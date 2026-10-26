#!/usr/bin/env python3
"""Revisa una situació d'aprenentatge contra una normativa editable.

Ús:
    python3 revisar.py document.html
    python3 revisar.py document.html --normativa references/normativa.md
    python3 revisar.py document.html --json
    python3 revisar.py document.html --strict

La normativa ha de contindre un bloc `<!-- REGLES-AUTO -->` amb un JSON. El
bloc alimenta les comprovacions automàtiques; la resta del Markdown és el
contracte humà que cal llegir i mantindre actualitzat.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html as html_lib
import json
import re
import subprocess
import sys
import unicodedata
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_NORMATIVA = ROOT / "references" / "normativa.md"

BLOCK_TAGS = {
    "p", "div", "li", "ul", "ol", "tr", "table", "td", "th",
    "h1", "h2", "h3", "h4", "h5", "h6", "section", "article",
}


class ReviewError(Exception):
    """Error controlat de configuració o de lectura."""


def fold(text: str) -> str:
    """Minúscules, sense accents, espais col·lapsats i cometes normalitzades."""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = (
        text.replace("’", "'").replace("‘", "'")
        .replace("“", '"').replace("”", '"')
        .replace("–", "-").replace("—", "-")
    )
    return re.sub(r"\s+", " ", text).strip().lower()


def normalize_text(text: str) -> str:
    text = text.replace("\xa0", " ").replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def snippet(text: str, limit: int = 220) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"^[\s:;,.–-]+", "", text)
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def strip_html(raw: str) -> str:
    raw = re.sub(r"<!--.*?-->", " ", raw, flags=re.S)
    raw = re.sub(r"<(script|style|head)\b.*?</\1>", " ", raw, flags=re.S | re.I)
    raw = re.sub(r"<br\s*/?>", "\n", raw, flags=re.I)
    raw = re.sub(r"</(?:p|li|div|tr|h[1-6])\s*>", "\n", raw, flags=re.I)
    raw = re.sub(r"<[^>]+>", " ", raw)
    return normalize_text(html_lib.unescape(raw))


class DocParser(HTMLParser):
    """Extrau text visible i taules (files i cel·les) sense dependències externes."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.text_chunks: list[str] = []
        self.tables: list[list[list[str]]] = []
        self._table: list[list[str]] | None = None
        self._row: list[str] | None = None
        self._cell: list[str] | None = None
        self._skip = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        tag = tag.lower()
        if tag in {"head", "script", "style"}:
            self._skip += 1
            return
        if tag == "table":
            self._table = []
        elif tag == "tr" and self._table is not None:
            self._row = []
        elif tag in {"td", "th"} and self._row is not None:
            self._cell = []
        if tag == "br":
            self._add("\n")
        elif tag in BLOCK_TAGS:
            self._add("\n")

    def handle_startendtag(self, tag: str, attrs) -> None:
        if tag.lower() == "br":
            self._add("\n")

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"head", "script", "style"}:
            if self._skip:
                self._skip -= 1
            return
        if tag in {"td", "th"} and self._cell is not None:
            if self._row is not None:
                self._row.append(normalize_text("".join(self._cell)))
            self._cell = None
        elif tag == "tr" and self._row is not None:
            if self._table is not None:
                self._table.append(self._row)
            self._row = None
        elif tag == "table" and self._table is not None:
            self.tables.append(self._table)
            self._table = None
        if tag in BLOCK_TAGS:
            self._add("\n")

    def handle_data(self, data: str) -> None:
        if self._skip:
            return
        self._add(data)

    def _add(self, value: str) -> None:
        if self._skip:
            return
        self.text_chunks.append(value)
        if self._cell is not None:
            self._cell.append(value)

    @property
    def text(self) -> str:
        return normalize_text("".join(self.text_chunks))


@dataclass
class Document:
    source: Path
    raw: str
    text: str
    tables: list[list[list[str]]]
    is_html: bool


@dataclass
class Check:
    id: str
    label: str
    status: str  # OK | BLOQUEJANT | AVÍS | MANUAL
    detail: str = ""
    evidence: str = ""
    action: str = ""


def load_document(path: Path) -> Document:
    suffix = path.suffix.lower()
    if suffix in {".html", ".htm"}:
        raw = path.read_text(encoding="utf-8")
        parser = DocParser()
        parser.feed(raw)
        parser.close()
        return Document(path, raw, parser.text, parser.tables, True)
    if suffix == ".pdf":
        try:
            result = subprocess.run(
                ["pdftotext", "-layout", str(path), "-"],
                check=True, capture_output=True, text=True,
            )
        except FileNotFoundError as exc:
            raise ReviewError("Cal instal·lar `pdftotext` per revisar PDF.") from exc
        except subprocess.CalledProcessError as exc:
            raise ReviewError(f"No s'ha pogut llegir el PDF: {exc.stderr.strip()}") from exc
        return Document(path, result.stdout, normalize_text(result.stdout), [], False)
    if suffix in {".txt", ".md"}:
        raw = path.read_text(encoding="utf-8")
        return Document(path, raw, normalize_text(raw), [], False)
    raise ReviewError("Format no suportat. Usa HTML, PDF, TXT o MD.")


def parse_frontmatter(text: str) -> dict[str, str]:
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.S)
    if not match:
        return {}
    data: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        data[key.strip()] = value.strip().strip('"').strip("'")
    return data


def load_rules(path: Path) -> tuple[dict, dict[str, str]]:
    if not path.exists():
        raise ReviewError(f"No existeix la normativa: {path}")
    text = path.read_text(encoding="utf-8")
    meta = parse_frontmatter(text)
    match = re.search(
        r"<!--\s*REGLES-AUTO\s*-->\s*```json\s*(.*?)```",
        text, re.S | re.I,
    )
    if not match:
        raise ReviewError(
            "La normativa no té el bloc `<!-- REGLES-AUTO -->` amb un JSON. "
            "Revisa references/normativa.md."
        )
    try:
        rules = json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        raise ReviewError(f"El JSON de REGLES-AUTO no és vàlid: {exc}") from exc
    if not isinstance(rules, dict):
        raise ReviewError("El bloc REGLES-AUTO ha de ser un objecte JSON.")
    rules.setdefault("required_sections", [])
    rules.setdefault("manual_checks", [])
    rules.setdefault("forbidden_patterns", [])
    return rules, meta


def find_table(doc: Document, *keywords: str):
    wanted = [fold(k) for k in keywords]
    for table in doc.tables:
        blob = fold(" ".join(cell for row in table for cell in row))
        if all(key in blob for key in wanted):
            return table
    return None


def raw_cell_after_label(raw: str, label: str) -> str:
    match = re.search(re.escape(label), raw, re.I)
    if not match:
        return ""
    end = raw.find("</td>", match.end())
    if end < 0:
        end = raw.find("</th>", match.end())
    return raw[match.end(): end if end >= 0 else len(raw)]


def segment_between(text: str, starts: list[str], ends: list[str]) -> str:
    start_match = None
    for label in starts:
        start_match = re.search(re.escape(label), text, re.I)
        if start_match:
            break
    if not start_match:
        return ""
    start = start_match.end()
    end = len(text)
    for label in ends:
        match = re.search(re.escape(label), text[start:], re.I)
        if match:
            end = min(end, start + match.start())
    return text[start:end].strip()


def count_products(doc: Document) -> tuple[int, str]:
    if doc.is_html:
        chunk = raw_cell_after_label(doc.raw, "Producte final")
        count = len(re.findall(r"<li\b", chunk, re.I))
        if count:
            return count, snippet(strip_html(chunk))
    segment = segment_between(
        doc.text,
        ["Producte final", "Producto final"],
        ["Relació amb els reptes", "Relación con los retos",
         "Competències específiques", "Competencias específicas"],
    )
    items = re.findall(r"(?m)^\s*(?:[-*•·]|\d+[.)])\s+(.+)$", segment)
    return len(items), snippet(segment)


def count_challenges(doc: Document) -> tuple[int, str]:
    if doc.is_html:
        chunk = raw_cell_after_label(doc.raw, "Relació amb els reptes del s.XXI i els ODS")
        if not chunk:
            chunk = raw_cell_after_label(doc.raw, "Relació amb els reptes")
        count = len(re.findall(r"<li\b", chunk, re.I))
        if count:
            return count, snippet(strip_html(chunk))
    segment = segment_between(
        doc.text,
        ["Relació amb els reptes del s.XXI i els ODS",
         "Relación con los retos del s.XXI y los ODS",
         "Relació amb els reptes", "Relación con los retos"],
        ["Competències específiques", "Competencias específicas", "Sabers bàsics", "Saberes básicos"],
    )
    items = re.findall(r"(?m)^\s*(?:\d+[.)]|[-*•·])\s+(.+)$", segment)
    return len(items), snippet(segment)


def count_instruments(doc: Document) -> tuple[int, str]:
    if doc.is_html:
        for chunk in re.findall(r"<table\b.*?</table>", doc.raw, re.S | re.I):
            if (
                "instruments de recollida" in fold(chunk)
                or "instrumentos de recogida" in fold(chunk)
            ):
                cells = re.findall(r"<t[dh]\b[^>]*>(.*?)</t[dh]>", chunk, re.S | re.I)
                if not cells:
                    continue
                content = max(cells, key=lambda cell: len(strip_html(cell)))
                blocks: list[str] = []
                for match in re.finditer(r"<(p|li)\b[^>]*>(.*?)</\1>", content, re.S | re.I):
                    block = strip_html(match.group(2))
                    if not block:
                        continue
                    if re.search(r"tasques avaluades|tareas evaluadas", block, re.I):
                        continue
                    if re.match(r"^(instruments de recollida|instrumentos de recogida)", fold(block)):
                        continue
                    blocks.append(block)
                if blocks:
                    return len(blocks), snippet("\n".join(blocks))
                before = re.split(
                    r"tasques avaluades|tareas evaluadas", content, flags=re.I
                )[0]
                n_br = len(re.findall(r"<br\b", before, re.I))
                if n_br:
                    count = n_br + 1
                else:
                    count = 1 if strip_html(before).strip() else 0
                return count, snippet(strip_html(before))
    segment = segment_between(
        doc.text,
        ["Instruments de recollida", "Instrumentos de recogida"],
        ["Tasques avaluades", "Tareas evaluadas"],
    )
    lines = [line for line in segment.splitlines() if line.strip()]
    return len(lines), snippet(segment)


def count_tasks(doc: Document) -> tuple[int, str, bool]:
    if doc.is_html:
        chunk = raw_cell_after_label(doc.raw, "Tasques avaluades")
        if not chunk:
            chunk = raw_cell_after_label(doc.raw, "Tareas evaluadas")
        content = strip_html(chunk)
    else:
        content = segment_between(
            doc.text,
            ["Tasques avaluades", "Tareas evaluadas"],
            [],
        )
    present = bool(content.strip())
    parts = [part.strip() for part in re.split(r";|\n", content) if len(part.strip()) >= 3]
    if len(parts) < 2:
        parts = [part.strip() for part in re.split(r",", content) if len(part.strip()) >= 3]
    return len(parts), snippet(content), present


def extract_competences(text: str) -> tuple[list[str], list[str]]:
    """Retorna (codes, display) de competències, admetent codi oficial o etiqueta provisional."""
    pattern = re.compile(
        r"compet[eè]ncia\s+espec[ií]fica\s*:\s*"
        r"(?:([A-Za-zÁÉÍÓÚÜÑ]{2,})\s*[- ]?\s*(\d+)|compet[eè]ncia\s*(\d+))",
        re.I,
    )
    codes: list[str] = []
    display: list[str] = []
    for match in pattern.finditer(text):
        if match.group(1):
            code = f"{match.group(1).upper()}{int(match.group(2))}"
            label = f"{match.group(1).upper()} {int(match.group(2))}"
        else:
            code = f"PROV{int(match.group(3))}"
            label = f"Competència {int(match.group(3))}"
        codes.append(code)
        display.append(label)
    return codes, display


def extract_criteria(text: str) -> tuple[list[str], list[str]]:
    """Retorna (codes, display) de criteris; admet codi oficial o etiqueta provisional."""
    pattern = re.compile(
        r"(?m)^\s*[•·\-–]?\s*"
        r"(?:([A-Za-zÁÉÍÓÚÜÑ]{2,})\s*(\d+)\.(\d+)|criteri\s*(\d+)\.(\d+))"
        r"\b",
        re.I,
    )
    codes: list[str] = []
    display: list[str] = []
    for match in pattern.finditer(text):
        if match.group(1):
            code = f"{match.group(1).upper()}{int(match.group(2))}.{int(match.group(3))}"
            label = f"{match.group(1).upper()} {int(match.group(2))}.{int(match.group(3))}"
        else:
            code = f"PROV{int(match.group(4))}.{int(match.group(5))}"
            label = f"Criteri {int(match.group(4))}.{int(match.group(5))}"
        codes.append(code)
        display.append(label)
    return codes, display


def strip_heading(cell: str, heading: str) -> str:
    """Lleva la capçalera de columna que pot compartir fila amb la primera activitat."""
    heading_pattern = re.escape(heading).replace("'", "['’]")
    return re.sub(
        r"^\s*" + heading_pattern + r"\s*:?\s*",
        "", cell, flags=re.I,
    ).strip()


def get_organization_rows(doc: Document) -> list[list[str]]:
    table = find_table(doc, "seqüenciació d'activitats", "organització dels espais")
    if not table:
        return []
    headings = [
        "",
        "Seqüenciació d'activitats",
        "Organització dels espais",
        "Distribució del temps",
        "Recursos i materials",
        "Mesures de resposta educativa per a la inclusió",
    ]
    rows: list[list[str]] = []
    for row in table:
        if len(row) < 6:
            continue
        cells = [cell.strip() for cell in row[:6]]
        for index in range(1, 6):
            cells[index] = strip_heading(cells[index], headings[index])
        if not any(cells[1:]):
            continue
        rows.append(cells)
    return rows


def check_context(doc: Document, rules: dict) -> tuple[bool, str]:
    candidates = [doc.raw, doc.text]
    checked = 0
    for source in candidates:
        checked = max(
            checked,
            len(re.findall(r"class\s*=\s*[\"'][^\"']*\bchecked\b", source, re.I)),
        )
    if not checked:
        checked = len(re.findall(r"[\[(]\s*[xX]\s*[\])]", doc.text))
    if not checked:
        checked = len(re.findall(r">\s*X\s*<", doc.raw))
    if not checked and re.search(
        r"\bX\s+(personal|educatiu|social|professional)\b", doc.text, re.I
    ):
        checked = 1
    if not checked and re.search(
        r"\b(personal|educatiu|social|professional)\s+X\b", doc.text, re.I
    ):
        checked = 1
    return bool(checked) or not rules.get("require_checked_context", True), (
        f"{checked} casella(es) marcada(es) amb X."
    )


def level_label(level: int) -> str:
    if level == 1:
        return "1r ESO"
    if level == 2:
        return "2n ESO"
    if level == 3:
        return "3r ESO"
    return "4t ESO"


def build_checks(doc: Document, rules: dict) -> list[Check]:
    checks: list[Check] = []
    flat = fold(doc.text)
    is_pdf = doc.source.suffix.lower() == ".pdf"
    pdf_note = " (En PDF l'extracció de columnes no és fiable; cal revisió manual.)"

    def add(
        check_id: str,
        label: str,
        status: str,
        detail: str = "",
        evidence: str = "",
        action: str = "",
    ) -> None:
        checks.append(Check(check_id, label, status, detail, evidence, action))

    # 1. Seccions obligatòries
    for section in rules.get("required_sections", []):
        section_id = str(section.get("id", "S??"))
        label = str(section.get("label", section_id))
        pattern = section.get("pattern")
        if pattern:
            found = re.search(str(pattern), flat, re.I | re.S) is not None
        else:
            aliases = section.get("aliases") or [label]
            found = any(fold(str(alias)) in flat for alias in aliases)
        if found:
            detail = "Secció present."
            status = "OK"
        else:
            detail = "No s'ha trobat la secció o l'etiqueta obligatòria."
            status = "BLOQUEJANT"
            if is_pdf:
                status = "AVÍS"
                detail += pdf_note
        add(
            section_id, label, status, detail,
            action="" if found else f"Afegir o etiquetar la secció «{label}».",
        )

    # Qualitat mínima d'algunes seccions (només si l'ordre de lectura és fiable)
    reliable_order = doc.is_html or doc.source.suffix.lower() in {".txt", ".md"}
    title_segment = segment_between(doc.text, ["Títol", "Título"], ["Context"])
    if reliable_order and title_segment and len(title_segment) < 8:
        for check in checks:
            if check.id == "S06":
                check.status = "AVÍS"
                check.detail = "El títol és present però sembla massa curt o buit."
                check.action = "Escriure un títol concret i identificable."

    description = segment_between(
        doc.text,
        ["Descripció / Justificació", "Descripción / Justificación"],
        ["Producte final", "Producto final"],
    )
    if reliable_order and description and len(description) < 80:
        for check in checks:
            if check.id == "S08":
                check.status = "AVÍS"
                check.detail = "La descripció és present però molt breu."
                check.action = "Explicar el punt de partida, el grup, la necessitat i l'encaix curricular."

    sabers = segment_between(
        doc.text,
        ["Sabers bàsics", "Saberes básicos"],
        ["Organització", "Organización"],
    )
    if reliable_order and sabers and len(sabers) < 80:
        for check in checks:
            if check.id == "S13":
                check.status = "AVÍS"
                check.detail = "Els sabers són presents però semblen massa genèrics o breus."
                check.action = "Concretar els blocs i els sabers rellevants per a la situació."

    # 2. Coherència
    context_ok, context_detail = check_context(doc, rules)
    add(
        "C01", "Context marcat", "OK" if context_ok else "BLOQUEJANT",
        context_detail,
        action="" if context_ok else "Marcar amb X almenys un context (personal, educatiu, social o professional).",
    )

    comp_codes, comp_display = extract_competences(doc.text)
    crit_codes, crit_display = extract_criteria(doc.text)

    # Quan hi ha taula de competències/criteris, llegim només eixa taula per a
    # no confondre els codis dels blocs de sabers (per exemple, «BLOC 1.2»).
    if doc.is_html:
        comp_table = find_table(
            doc, "competències específiques", "criteris d'avaluació vinculats"
        )
        if comp_table:
            comp_parts: list[str] = []
            crit_parts: list[str] = []
            for row in comp_table:
                if len(row) >= 3:
                    comp_parts.append(row[1])
                    crit_parts.append(row[2])
            comp_codes, comp_display = extract_competences("\n".join(comp_parts))
            crit_codes, crit_display = extract_criteria("\n".join(crit_parts))

    allowed_prefixes = {
        str(prefix).upper()
        for prefix in rules.get("allowed_code_prefixes", [])
    }

    def known_prefix(code: str) -> bool:
        match = re.match(r"([A-Z]+)", code)
        return bool(match) and (
            not allowed_prefixes or match.group(1) in allowed_prefixes
        )

    comp_pairs = [
        (code, label)
        for code, label in zip(comp_codes, comp_display)
        if known_prefix(code)
    ]
    crit_pairs = [
        (code, label)
        for code, label in zip(crit_codes, crit_display)
        if known_prefix(code)
    ]
    comp_codes = [code for code, _ in comp_pairs]
    comp_display = [label for _, label in comp_pairs]
    crit_codes = [code for code, _ in crit_pairs]
    crit_display = [label for _, label in crit_pairs]

    comp_unique = list(dict.fromkeys(comp_codes))
    crit_unique = list(dict.fromkeys(crit_codes))

    comp_keys = {code.split(".")[0] for code in comp_unique}
    crit_keys = {code.split(".")[0] for code in crit_unique}
    unassessed = sorted(comp_keys - crit_keys)
    orphan = sorted(crit_keys - comp_keys)

    if comp_unique and crit_unique:
        pair_status = "AVÍS" if is_pdf else "BLOQUEJANT"
        add(
            "C02", "Cada competència té criteri", "OK" if not unassessed else pair_status,
            ("Totes les competències tenen almenys un criteri." if not unassessed
             else "Competències sense criteri: " + ", ".join(unassessed) + (pdf_note if is_pdf else "")),
            action="" if not unassessed else "Vincular almenys un criteri a cada competència.",
        )
        add(
            "C03", "Cada criteri té competència", "OK" if not orphan else pair_status,
            ("Tots els criteris pengen d'una competència." if not orphan
             else "Criteris sense competència: " + ", ".join(orphan) + (pdf_note if is_pdf else "")),
            action="" if not orphan else "Corregir el codi o afegir la competència corresponent.",
        )
    else:
        add(
            "C02", "Cada competència té criteri", "AVÍS",
            "No s'han pogut aparellar perquè falta la llista de competències o de criteris.",
            action="Revisar manualment l'apartat de competències i criteris.",
        )
        add(
            "C03", "Cada criteri té competència", "AVÍS",
            "No s'han pogut aparellar perquè falta la llista de competències o de criteris.",
            action="Revisar manualment l'apartat de competències i criteris.",
        )

    min_comp = int(rules.get("min_competencies", 4))
    max_comp = int(rules.get("max_competencies", 6))
    if not comp_unique:
        add("C04", "Nombre de competències", "AVÍS" if is_pdf else "BLOQUEJANT",
            "No s'ha detectat cap competència amb codi o etiqueta." + (pdf_note if is_pdf else ""),
            action="Afegir les competències específiques del currículum.")
    elif not (min_comp <= len(comp_unique) <= max_comp):
        add("C04", "Nombre de competències", "AVÍS" if is_pdf else "BLOQUEJANT",
            f"N'hi ha {len(comp_unique)}; la normativa en demana entre {min_comp} i {max_comp}."
            + (pdf_note if is_pdf else ""),
            evidence=", ".join(comp_display),
            action="Ajustar el nombre de competències o justificar l'excepció.")
    else:
        add("C04", "Nombre de competències", "OK",
            f"{len(comp_unique)} competències detectades.",
            evidence=", ".join(comp_display))

    min_crit = int(rules.get("min_criteria", 6))
    max_crit = int(rules.get("max_criteria", 12))
    if not crit_unique:
        add("C05", "Nombre de criteris", "AVÍS" if is_pdf else "BLOQUEJANT",
            "No s'ha detectat cap criteri amb codi o etiqueta." + (pdf_note if is_pdf else ""),
            action="Afegir els criteris d'avaluació vinculats.")
    elif not (min_crit <= len(crit_unique) <= max_crit):
        add("C05", "Nombre de criteris", "AVÍS" if is_pdf else "BLOQUEJANT",
            f"N'hi ha {len(crit_unique)}; la normativa en demana entre {min_crit} i {max_crit}."
            + (pdf_note if is_pdf else ""),
            evidence=", ".join(crit_display),
            action="Ajustar el nombre de criteris o justificar l'excepció.")
    else:
        add("C05", "Nombre de criteris", "OK",
            f"{len(crit_unique)} criteris detectats.",
            evidence=", ".join(crit_display))

    products, product_evidence = count_products(doc)
    min_prod = int(rules.get("min_products", 3))
    max_prod = int(rules.get("max_products", 5))
    if products == 0:
        add("C06", "Nombre de productes finals", "AVÍS" if is_pdf else "BLOQUEJANT",
            "No s'han detectat productes finals." + (pdf_note if is_pdf else ""),
            evidence=product_evidence,
            action="Afegir 3-5 productes o resultats concrets.")
    elif not (min_prod <= products <= max_prod):
        add("C06", "Nombre de productes finals", "AVÍS",
            f"N'hi ha {products}; la normativa en recomana entre {min_prod} i {max_prod}.",
            evidence=product_evidence,
            action="Revisar la llista de productes finals.")
    else:
        add("C06", "Nombre de productes finals", "OK",
            f"{products} productes detectats.", evidence=product_evidence)

    challenges, challenge_evidence = count_challenges(doc)
    min_ch = int(rules.get("min_challenges", 3))
    max_ch = int(rules.get("max_challenges", 5))
    if challenges == 0:
        add("C07", "Nombre de reptes", "AVÍS" if is_pdf else "BLOQUEJANT",
            "No s'han detectat reptes o accions." + (pdf_note if is_pdf else ""),
            evidence=challenge_evidence,
            action="Afegir 3-5 reptes o accions vinculats a l'entorn.")
    elif not (min_ch <= challenges <= max_ch):
        add("C07", "Nombre de reptes", "AVÍS",
            f"N'hi ha {challenges}; la normativa en recomana entre {min_ch} i {max_ch}.",
            evidence=challenge_evidence,
            action="Revisar la llista de reptes.")
    else:
        add("C07", "Nombre de reptes", "OK",
            f"{challenges} reptes detectats.", evidence=challenge_evidence)

    org_rows = get_organization_rows(doc)
    org_issues: list[str] = []
    org_warnings: list[str] = []
    if org_rows:
        for index, cells in enumerate(org_rows, start=1):
            names = ["Seqüenciació", "Espais", "Temps", "Recursos", "Inclusió"]
            missing = [names[i] for i, cell in enumerate(cells[1:]) if not cell.strip()]
            if missing:
                org_issues.append(f"Activitat {index}: falten {', '.join(missing)}.")
            time_match = re.search(r"(\d+)\s*sessi", fold(cells[3]))
            seq_match = re.search(r"(?:duraci[oó]|durada) de (\d+) sessio", fold(cells[1]))
            if not time_match:
                org_issues.append(f"Activitat {index}: no s'ha detectat la durada a la columna de temps.")
            if seq_match and time_match and int(seq_match.group(1)) != int(time_match.group(1)):
                org_issues.append(
                    f"Activitat {index}: la seqüenciació diu {seq_match.group(1)} sessions "
                    f"i la columna de temps diu {time_match.group(1)}."
                )
            if not seq_match:
                org_warnings.append(f"Activitat {index}: no s'ha detectat «duració de N sessions» a la seqüenciació.")
            measures = fold(cells[5])
            if not re.search(
                r"dua|disseny universal|adaptaci|suport|alumne referent|material accessible|plantilla|bastida",
                measures,
            ):
                org_warnings.append(f"Activitat {index}: les mesures d'inclusió són genèriques o no s'han concretat.")
            if len(cells[4].strip()) < 12:
                org_warnings.append(f"Activitat {index}: els recursos són molt breus o genèrics.")
        if len(org_rows) < int(rules.get("min_activities", 3)):
            org_issues.append(
                f"Només s'han detectat {len(org_rows)} activitats; la normativa en demana almenys "
                f"{rules.get('min_activities', 3)}."
            )
        if org_issues:
            status = "BLOQUEJANT"
            detail = " ".join(org_issues + org_warnings)
        elif org_warnings:
            status = "AVÍS"
            detail = " ".join(org_warnings)
        else:
            status = "OK"
            detail = f"{len(org_rows)} activitats amb les cinc columnes i durades coherents."
        add("C08", "Activitats i coherència de temps", status, detail,
            evidence=snippet(" | ".join(" / ".join(row[1:4]) for row in org_rows)),
            action="" if status == "OK" else "Completar les cinc columnes i fer coincidir la durada textual amb la columna de temps.")
    else:
        sessions = len(re.findall(r"\b\d+\s*SESSIONS?\b", doc.text, re.I))
        if sessions >= int(rules.get("min_activities", 3)):
            add("C08", "Activitats i coherència de temps", "AVÍS",
                f"No s'ha pogut llegir la taula d'organització; s'han detectat {sessions} indicis de sessions. Cal revisió manual.",
                action="Revisar la taula d'organització en el document original.")
        else:
            add("C08", "Activitats i coherència de temps", "BLOQUEJANT",
                "No s'ha trobat la taula d'organització ni activitats suficients.",
                action="Afegir el bloc d'organització amb les cinc columnes.")

    instruments, instrument_evidence = count_instruments(doc)
    min_inst = int(rules.get("min_instruments", 4))
    max_inst = int(rules.get("max_instruments", 6))
    if instruments == 0:
        add("C09", "Nombre d'instruments", "AVÍS" if is_pdf else "BLOQUEJANT",
            "No s'han detectat instruments d'avaluació." + (pdf_note if is_pdf else ""),
            evidence=instrument_evidence,
            action="Afegir 4-6 instruments de recollida d'informació.")
    elif not (min_inst <= instruments <= max_inst):
        add("C09", "Nombre d'instruments", "AVÍS",
            f"N'hi ha {instruments}; la normativa en recomana entre {min_inst} i {max_inst}.",
            evidence=instrument_evidence,
            action="Revisar la llista d'instruments.")
    else:
        add("C09", "Nombre d'instruments", "OK",
            f"{instruments} instruments detectats.", evidence=instrument_evidence)

    ods_matches = re.findall(
        r"\bODS\s*(?:n[uú]m\.?|n[º°]|#)?\s*(\d{1,2})\b", doc.text, re.I
    )
    ods_numbers = [int(number) for number in ods_matches if 1 <= int(number) <= 17]
    if not ods_numbers:
        status = "BLOQUEJANT" if rules.get("require_explicit_ods", True) else "AVÍS"
        detail = "No s'ha detectat cap ODS amb número."
        if re.search(r"\bODS\b", doc.text, re.I):
            detail += " Hi ha la paraula ODS, però no s'ha concretat cap número."
        add("C10", "ODS explícit", status, detail,
            action="Concretar l'ODS principal (per exemple, ODS 3) i justificar la relació.")
    else:
        add("C10", "ODS explícit", "OK",
            "ODS detectats: " + ", ".join(str(number) for number in sorted(set(ods_numbers))) + ".")

    dua_in_text = re.search(r"\bDUA\b|disseny universal|dise[nñ]o universal", doc.text, re.I)
    generic_measures = []
    if org_rows:
        for index, cells in enumerate(org_rows, start=1):
            if not re.search(
                r"dua|disseny universal|adaptaci|suport|alumne referent|material accessible|plantilla|bastida",
                fold(cells[5]),
            ):
                generic_measures.append(index)
    if not dua_in_text and rules.get("require_dua", True):
        add("C11", "Mesures d'inclusió i DUA", "BLOQUEJANT",
            "No s'ha detectat cap referència al DUA ni al disseny universal per a l'aprenentatge.",
            action="Incorporar mesures DUA concretes i justificar-les.")
    elif generic_measures:
        add("C11", "Mesures d'inclusió i DUA", "AVÍS",
            "Hi ha DUA al document, però les mesures de les activitats "
            + ", ".join(str(i) for i in generic_measures)
            + " són genèriques.",
            action="Concretar suports, adaptacions i materials per a cada activitat.")
    else:
        add("C11", "Mesures d'inclusió i DUA", "OK",
            "S'han detectat mesures d'inclusió concretes.")

    tasks_count, task_evidence, tasks_present = count_tasks(doc)
    min_tasks = int(rules.get("min_tasks", 3))
    if rules.get("require_tasks", True) and not tasks_present:
        add("C12", "Tasques avaluades", "AVÍS" if is_pdf else "BLOQUEJANT",
            "No s'ha trobat el bloc «Tasques avaluades» o és buit." + (pdf_note if is_pdf else ""),
            evidence=task_evidence,
            action="Afegir les evidències concretes que es valoraran.")
    elif tasks_count < min_tasks:
        add("C12", "Tasques avaluades", "AVÍS" if is_pdf else "BLOQUEJANT",
            f"Només s'han detectat {tasks_count} evidències; calen almenys {min_tasks}."
            + (pdf_note if is_pdf else ""),
            evidence=task_evidence,
            action="Desglossar les tasques avaluades en evidències concretes.")
    else:
        add("C12", "Tasques avaluades", "OK",
            f"{tasks_count} evidències detectades.", evidence=task_evidence)

    year_pairs = re.findall(r"\b(20\d{2})\s*[-–—/]\s*(20\d{2})\b", doc.text)
    unique_years = sorted(set((int(a), int(b)) for a, b in year_pairs))
    if not unique_years:
        add("C13", "Curs acadèmic coherent", "BLOQUEJANT",
            "No s'ha detectat cap curs acadèmic amb format 20XX-20XX.",
            action="Indicar el curs acadèmic al camp corresponent.")
    elif len(unique_years) > 1:
        add("C13", "Curs acadèmic coherent", "AVÍS",
            "S'han detectat diversos cursos acadèmics: "
            + ", ".join(f"{a}-{b}" for a, b in unique_years),
            action="Unificar el curs acadèmic o justificar la diferència.")
    elif unique_years[0][1] != unique_years[0][0] + 1:
        add("C13", "Curs acadèmic coherent", "AVÍS",
            f"El curs {unique_years[0][0]}-{unique_years[0][1]} no és consecutiu.",
            action="Corregir els anys del curs acadèmic.")
    else:
        add("C13", "Curs acadèmic coherent", "OK",
            f"Curs detectat: {unique_years[0][0]}-{unique_years[0][1]}.")

    levels = re.findall(
        r"\b([1-4])\s*(?:r|n|t|er|on|e|è|º|°)?\s*(?:(?:de\s+(?:l'|la\s+)?)|d')?eso\b",
        fold(doc.text), re.I,
    )
    unique_levels = sorted(set(int(level) for level in levels))
    if len(unique_levels) > 1:
        add("C14", "Nivell coherent", "BLOQUEJANT",
            "S'han detectat nivells diferents: " + ", ".join(level_label(level) for level in unique_levels),
            action="Unificar el nivell o corregir la contradicció.")
    elif not unique_levels:
        add("C14", "Nivell coherent", "AVÍS",
            "No s'ha detectat cap nivell d'ESO al text.",
            action="Indicar el nivell al camp corresponent i a la descripció.")
    else:
        add("C14", "Nivell coherent", "OK", f"Nivell detectat: {level_label(unique_levels[0])}.")

    duplicate_comp = sorted({code for code in comp_codes if comp_codes.count(code) > 1})
    duplicate_crit = sorted({code for code in crit_codes if crit_codes.count(code) > 1})
    duplicates = duplicate_comp + duplicate_crit
    if duplicates:
        add("C15", "Codis duplicats", "AVÍS",
            "Codis repetits: " + ", ".join(duplicates),
            action="Eliminar o corregir les repeticions.")
    else:
        add("C15", "Codis duplicats", "OK", "No s'han detectat codis repetits.")

    placeholders: list[str] = []
    for pattern in rules.get("forbidden_patterns", []):
        try:
            matches = re.findall(str(pattern), doc.text, re.I)
        except re.error:
            continue
        for match in matches:
            value = match if isinstance(match, str) else "".join(match)
            if value and value not in placeholders:
                placeholders.append(value)
    if placeholders:
        placeholders = [
            value for value in placeholders
            if not any(value != other and value in other for other in placeholders)
        ]
        add("C16", "Placeholders i textos pendents", "BLOQUEJANT",
            "S'han detectat " + str(len(placeholders)) + " marcador(s) pendent(s).",
            evidence=", ".join(placeholders[:8]),
            action="Substituir tots els marcadors per contingut real.")
    else:
        add("C16", "Placeholders i textos pendents", "OK",
            "No s'han detectat placeholders ni textos pendents.")

    prefixes = sorted({
        re.match(r"([A-Z]+)", code).group(1)
        for code in comp_unique + crit_unique
        if re.match(r"([A-Z]+)", code)
    })
    if not prefixes:
        add("C17", "Codis oficials", "AVÍS",
            "No s'han detectat codis oficials; si el document usa etiquetes provisionals, cal substituir-les.",
            action="Incorporar els codis oficials del currículum vigent.")
    else:
        add("C17", "Codis oficials", "OK",
            "Prefixos detectats: " + ", ".join(prefixes) + ". Cal confirmar la vigència (M08).")

    instrument_text = fold((instrument_evidence or "") + " " + doc.text)
    formative = bool(re.search(r"observaci|diari|portfolio|dossier|rubrica|autoavaluaci|coavaluaci", instrument_text))
    summative = bool(re.search(r"exposici|prova|examen|presentaci|dossier|projecte|producte", instrument_text))
    if formative and summative:
        add("C18", "Varietat d'instruments", "OK",
            "S'han detectat instruments formatius i summatius.")
    elif instruments:
        add("C18", "Varietat d'instruments", "AVÍS",
            "Els instruments detectats semblen d'un sol tipus.",
            action="Incorporar evidències formatives i summatives.")
    else:
        add("C18", "Varietat d'instruments", "AVÍS",
            "No s'han pogut classificar els instruments.",
            action="Revisar la llista d'instruments.")

    # 3. Revisió manual
    for item in rules.get("manual_checks", []):
        add(
            str(item.get("id", "M??")),
            str(item.get("label", "Revisió manual")),
            "MANUAL",
            "Cal revisar-ho manualment i deixar constància al camp de notes.",
        )

    return checks


def summarize(checks: list[Check]) -> tuple[str, dict[str, int]]:
    blocking = sum(1 for check in checks if check.status == "BLOQUEJANT")
    warnings = sum(1 for check in checks if check.status == "AVÍS")
    manual = sum(1 for check in checks if check.status == "MANUAL")
    ok = sum(1 for check in checks if check.status == "OK")
    if blocking:
        status = "NO CONFORME"
    elif warnings:
        status = "CONFORME AMB OBSERVACIONS"
    elif manual:
        status = "PENDENT DE REVISIÓ MANUAL"
    else:
        status = "CONFORME"
    return status, {
        "bloquejants": blocking,
        "avisos": warnings,
        "manuals": manual,
        "correctes": ok,
        "total": len(checks),
    }


def render_markdown(
    doc: Document,
    normativa_path: Path,
    norm_meta: dict[str, str],
    checks: list[Check],
    status: str,
    summary: dict[str, int],
) -> str:
    lines: list[str] = []
    lines.append("# Informe de revisió de la situació d'aprenentatge")
    lines.append("")
    lines.append(f"- **Document revisat:** `{doc.source}`")
    lines.append(f"- **Normativa:** `{normativa_path}`")
    lines.append(f"- **Títol de la normativa:** {norm_meta.get('titol', 'No indicat')}")
    lines.append(f"- **Estat de la normativa:** {norm_meta.get('estat', 'No indicat')}")
    lines.append(f"- **Versió:** {norm_meta.get('versio', 'No indicada')}")
    lines.append(f"- **Data de la revisió:** {dt.date.today().isoformat()}")
    lines.append("")
    lines.append(f"## Resultat global: **{status}**")
    lines.append("")
    lines.append(
        f"- Bloquejants: **{summary['bloquejants']}** · "
        f"Avisos: **{summary['avisos']}** · "
        f"Revisions manuals: **{summary['manuals']}** · "
        f"Comprovacions correctes: **{summary['correctes']}**"
    )
    lines.append("")
    lines.append(
        "> Aquest informe combina comprovacions automàtiques i una checklist manual. "
        "El resultat només és definitiu quan totes les revisions manuals estan resoltes."
    )
    lines.append("")

    groups = [
        ("1. Seccions obligatòries", "S"),
        ("2. Coherència i contingut", "C"),
        ("3. Revisió manual", "M"),
    ]
    for title, prefix in groups:
        subset = [check for check in checks if check.id.startswith(prefix)]
        if not subset:
            continue
        lines.append(f"## {title}")
        lines.append("")
        lines.append("| ID | Comprovació | Resultat | Detall / evidència |")
        lines.append("|---|---|---|---|")
        for check in subset:
            detail = check.detail
            if check.evidence:
                detail = f"{detail} Evidència: {snippet(check.evidence, 180)}"
            lines.append(
                f"| {check.id} | {check.label} | {check.status} | {detail.replace('|', '/')} |"
            )
        lines.append("")

    actionable = [check for check in checks if check.status in {"BLOQUEJANT", "AVÍS"}]
    lines.append("## 4. Accions correctives")
    lines.append("")
    if not actionable:
        lines.append("No hi ha accions correctives automàtiques pendents.")
    else:
        for check in actionable:
            lines.append(f"### {check.id} · {check.label} · {check.status}")
            lines.append("")
            lines.append(f"- **Problema:** {check.detail}")
            if check.evidence:
                lines.append(f"- **Evidència:** {snippet(check.evidence, 300)}")
            if check.action:
                lines.append(f"- **Acció recomanada:** {check.action}")
            lines.append("")
    lines.append("")

    lines.append("## 5. Checklist manual pendent")
    lines.append("")
    manual_checks = [check for check in checks if check.status == "MANUAL"]
    if not manual_checks:
        lines.append("No hi ha punts manuals definits a la normativa.")
    else:
        for check in manual_checks:
            lines.append(f"- [ ] **{check.id}** · {check.label}")
    lines.append("")

    lines.append("## 6. Limitacions del validador")
    lines.append("")
    lines.append(
        "- No pot comprovar si els codis oficials existeixen realment al currículum vigent; "
        "això requereix la revisió manual M08."
    )
    lines.append(
        "- No pot decidir si el producte final és viable, si les activitats condueixen a ell "
        "o si els sabers són els adequats; ho cobreixen M02-M05."
    )
    lines.append(
        "- En PDF o text no sempre pot reconstruir les taules; en eixe cas marca C08 com a "
        "revisió manual i cal comprovar la maquetació original."
    )
    lines.append(
        "- La normativa és editable: si canvia el bloc REGLES-AUTO, canvien les comprovacions."
    )
    lines.append("")
    lines.append("## 7. Conclusió")
    lines.append("")
    if status == "NO CONFORME":
        lines.append(
            "El document no es pot considerar conforme amb la normativa carregada. "
            "Cal resoldre els bloquejants i tornar a executar la revisió."
        )
    elif status == "CONFORME AMB OBSERVACIONS":
        lines.append(
            "El document complix les comprovacions automàtiques, però té avisos que cal "
            "revisar o justificar abans de considerar-lo tancat."
        )
    elif status == "PENDENT DE REVISIÓ MANUAL":
        lines.append(
            "No s'han detectat bloquejants ni avisos automàtics, però encara cal completar "
            "la checklist manual."
        )
    else:
        lines.append("El document complix la normativa carregada en aquesta revisió.")
    lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Revisa una situació d'aprenentatge contra una normativa editable."
    )
    parser.add_argument("document", help="Fitxer HTML, PDF, TXT o MD a revisar.")
    parser.add_argument(
        "--normativa", default=str(DEFAULT_NORMATIVA),
        help="Fitxer Markdown amb la normativa i el bloc REGLES-AUTO.",
    )
    parser.add_argument("--output", help="Escriure l'informe en aquest fitxer.")
    parser.add_argument("--json", action="store_true", help="Emetre JSON en compte de Markdown.")
    parser.add_argument(
        "--strict", action="store_true",
        help="Retornar codi 1 també quan hi ha avisos (a més dels bloquejants).",
    )
    args = parser.parse_args(argv)

    try:
        doc_path = Path(args.document)
        if not doc_path.exists():
            raise ReviewError(f"No existeix el document: {doc_path}")
        norm_path = Path(args.normativa)
        rules, norm_meta = load_rules(norm_path)
        doc = load_document(doc_path)
        checks = build_checks(doc, rules)
        status, summary = summarize(checks)
    except ReviewError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    if args.json:
        payload = {
            "document": str(doc.source),
            "normativa": {
                "path": str(norm_path),
                **norm_meta,
            },
            "resultat": status,
            "resum": summary,
            "comprovacions": [asdict(check) for check in checks],
        }
        output = json.dumps(payload, ensure_ascii=False, indent=2)
    else:
        output = render_markdown(doc, norm_path, norm_meta, checks, status, summary)

    if args.output:
        Path(args.output).write_text(output + "\n", encoding="utf-8")
        print(f"Informe escrit a {args.output}")
    else:
        print(output)

    if status == "NO CONFORME":
        return 1
    if args.strict and summary["avisos"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
