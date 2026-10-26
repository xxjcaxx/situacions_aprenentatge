#!/usr/bin/env python3
"""Valida una taula de situació d'aprenentatge en HTML.

Ús:
    python3 scripts/validar.py document.html

Comprova que hi hagi tots els blocs obligatoris, que no quedin placeholders
i que hi hagi pistes mínimes de contingut (context marcat, competències,
criteris, columnes d'organització i instruments).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REQUIRED = {
    "capçalera": ["Curs acadèmic:", "Matèria:", "Nivell:", "Grup:"],
    "identificació": ["Situació d’aprenentatge", "Títol:", "Context:"],
    "descripció": ["Descripció / Justificació:", "Producte final:"],
    "reptes": ["Relació amb els reptes del s.XXI i els ODS:"],
    "competències": ["Competències específiques", "Criteris d’avaluació vinculats"],
    "sabers": ["Sabers bàsics"],
    "organització": [
        "Organització",
        "Seqüenciació d’activitats",
        "Organització dels espais",
        "Distribució del temps",
        "Recursos i materials",
        "Mesures de resposta educativa per a la inclusió",
    ],
    "instruments": [
        "Instruments de recollida d’informació",
        "Tasques avaluades:",
    ],
}

# Variants habituals amb accents simples o rectes.
NORMALIZE = str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"'})


def normalize(text: str) -> str:
    return text.translate(NORMALIZE)


def main() -> int:
    if len(sys.argv) != 2:
        print("Ús: python3 scripts/validar.py document.html", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"No existeix el fitxer: {path}", file=sys.stderr)
        return 2

    html = normalize(path.read_text(encoding="utf-8"))
    errors: list[str] = []
    warnings: list[str] = []

    for block, labels in REQUIRED.items():
        for label in labels:
            if normalize(label) not in html:
                errors.append(f"Falta l'etiqueta obligatòria [{block}]: {label}")

    placeholders = sorted(
        set(re.findall(r"\{\{[^}]+\}\}|\[(?:PENDENT|CODI|TEXT|NOM|DATA|MATÈRIA|CURS|NIVELL|GRUP)[^\]]*\]", html, re.I))
    )
    if placeholders:
        shown = ", ".join(placeholders[:12])
        if len(placeholders) > 12:
            shown += f" (+{len(placeholders) - 12} més)"
        errors.append("Queden placeholders: " + shown)

    if not re.search(r'class="[^"]*box[^"]*checked|>\s*X\s*<', html):
        errors.append("No hi ha cap opció de context marcada amb X.")

    competencies = len(re.findall(r"Competència específica:", html))
    if competencies < 4:
        warnings.append(f"Només hi ha {competencies} competències; l'exemple en té 6 (mínim recomanat: 4).")
    if competencies > 6:
        warnings.append(f"Hi ha {competencies} competències; l'exemple en té 6 (màxim recomanat: 6).")

    criteria = re.findall(r"\b[A-Z]{2,}\s?\d+(?:\.\d+)?\b", html)
    if len(set(criteria)) < 6:
        warnings.append("Hi ha menys de 6 codis de criteri; revisa que cada competència tinga criteris vinculats.")

    if len(re.findall(r"<tr\b", html)) < 6:
        warnings.append("Hi ha poques files: revisa que hi hagen diverses competències i activitats.")

    if errors:
        print("ERRORS:")
        for error in errors:
            print(" -", error)
    if warnings:
        print("AVISOS:")
        for warning in warnings:
            print(" -", warning)
    if not errors:
        print(f"OK: estructura bàsica correcta ({path}).")
        if warnings:
            print("Revisa els avisos abans de lliurar.")
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
