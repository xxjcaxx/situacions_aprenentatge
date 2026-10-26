---
name: "Revisió de situació d'aprenentatge ESO"
description: "Revisa si una situació d'aprenentatge d'ESO complix la normativa: comprova que hi haja totes les seccions obligatòries, que competències i criteris estiguen aparellats, que les activitats i les sessions siguen coherents, que no hi haja placeholders ni contradiccions, i emet un informe amb bloquejants, avisos i revisions manuals. Usa-la quan demanen revisar, auditar, validar o comprovar una situació d'aprenentatge o una programació d'aula."
---

# Revisió de situació d'aprenentatge ESO

## Per a què serveix

Audita una situació d'aprenentatge ja redactada contra una normativa editable. No crea la situació: comprova si és completa, si no es contradiu i si pot considerar-se conforme.

La revisió té tres capes:

1. **Completesa**: hi són totes les seccions obligatòries (`S01`-`S21`)?
2. **Coherència interna**: competències i criteris, productes i reptes, activitats i sessions, instruments i tasques, curs i nivell (`C01`-`C18`).
3. **Conformitat normativa i revisió humana**: les regles que el validador no pot decidir (`M01`-`M10`), com la idoneïtat dels sabers, la viabilitat del producte o la vigència dels codis.

## Quan usar-la

- L'usuari demana revisar, auditar, validar o comprovar una situació d'aprenentatge.
- Cal saber si un document té totes les seccions i si alguna cosa es contradiu.
- Cal preparar un informe per a un departament, una coordinació o una Inspecció.
- Cal comprovar si una situació és conforme amb el currículum o amb una normativa interna del centre.

**No la usis per crear una situació des de zero.** Per a això hi ha la skill `situacio-aprenentatge-eso`. Sí que pots usar-la després de crear-la, com a control de qualitat.

## Entrades necessàries

1. **Document a revisar**: HTML, PDF, TXT o MD. L'HTML és el format amb més comprovacions automàtiques.
2. **Normativa**: per defecte, `references/normativa.md`. Si l'usuari té la normativa real, cal substituir el fitxer d'exemple.
3. **Abast**: revisió ràpida (seccions i bloquejants) o auditoria completa (amb checklist manual).
4. **Curs, territori i etapa**: per confirmar que la normativa carregada és l'aplicable.

Si falta el document, demana'l. Si falta la normativa real, no inventes regles: usa la normativa d'exemple i digues clarament que és una demostració.

## Normativa editable

La font de veritat humana és `references/normativa.md`. Conté:

- un frontmatter amb títol, estat, versió, data, territori i font;
- les definicions i el marc legal orientatiu;
- les taules de seccions (`S`), coherència (`C`), prohibicions (`P`) i revisions manuals (`M`);
- un bloc `<!-- REGLES-AUTO -->` amb el JSON que llig `scripts/revisar.py`.

### Com substituir l'exemple per normativa real

1. Copia la normativa oficial o la del centre dins de `references/normativa.md`.
2. Actualitza el frontmatter: `titol`, `estat: "VIGENT"`, `versio`, `data`, `territori`, `font`.
3. Substitueix el marc legal orientatiu per les referències reals i verificades.
4. Ajusta les taules de seccions i regles. Conserva els IDs si vols mantindre la traçabilitat; si n'afegueixes, usa la sèrie que corresponga (`S22`, `C21`, `M11`...).
5. Actualitza el bloc `REGLES-AUTO`:
   - `required_sections`: etiquetes o patrons que han d'aparéixer.
   - `min_*` / `max_*`: nombre de competències, criteris, productes, reptes, activitats, instruments i evidències.
   - `require_explicit_ods`, `require_dua`, `require_checked_context`, `require_tasks`: obligatorietat.
   - `allowed_code_prefixes`: prefixos oficials del currículum (per exemple, `FOIP`, `TD`).
   - `forbidden_patterns`: placeholders i textos pendents.
   - `manual_checks`: punts que el validador no pot decidir.
6. Comprova que el JSON és vàlid i que el validador continua funcionant.
7. Marca `estat: "VIGENT"` només quan el contingut siga realment la normativa aplicable.

> La normativa inclosa és **una demostració inventada**. No la cites com a font legal. Si no es substitueix, l'informe ha de dir-ho a la capçalera.

## Flux de treball

### 1. Llig la normativa

Obre `references/normativa.md` i identifica:

- estat i versió;
- seccions obligatòries;
- regles de coherència;
- regles manuals;
- si l'ODS és obligatori, si el DUA és obligatori, quants productes i instruments calen.

### 2. Prepara el document

- HTML: és el format preferent; el validador pot llegir taules i columnes.
- PDF: el validador usa `pdftotext -layout`; les taules es poden perdre i caldrà revisar la maquetació.
- DOCX: converteix-lo a HTML o PDF abans de revisar-lo.
- TXT/MD: útil per a esborranys, però no permet comprovar columnes.

### 3. Executa la revisió automàtica

```bash
python3 skills/revisio-situacio-aprenentatge/scripts/revisar.py \
  document.html \
  --output informe.md
```

Amb una normativa alternativa:

```bash
python3 skills/revisio-situacio-aprenentatge/scripts/revisar.py \
  document.html \
  --normativa ruta/a/normativa-real.md \
  --output informe.md
```

Opcions:

- `--json`: emet el resultat estructurat.
- `--strict`: retorna codi 1 també quan hi ha avisos.
- `--output`: desa l'informe.

### 4. Revisa el resultat automàtic

No acceptes l'informe sense llegir-lo. Comprova:

- que el document siga el correcte;
- que la normativa siga la vigent;
- que les evidències corresponguen al text;
- que els falsos positius no vinguen d'una maquetació estranya;
- que els bloquejants no estiguen repetits per la mateixa causa.

### 5. Completa la checklist manual

Resol `M01`-`M10` llegint el document, no només el resultat del script. Per a cada punt:

- marca `CONFORME`, `NO CONFORME` o `NO VERIFICABLE`;
- cita l'evidència;
- indica l'acció correctiva si cal.

Com a mínim, has de revisar:

- si el producte final és viable i avaluable;
- si cada criteri té una evidència real;
- si els sabers sustenten les competències i les activitats;
- si les activitats condueixen al producte final;
- si els codis són oficials i vigents;
- si hi ha contradiccions que el script no detecta (per exemple, un context social amb una justificació que parla d'un altre context).

### 6. Contrasta contradiccions

A més de les regles automàtiques, busca:

- **Nivell**: capçalera, descripció, activitats i instruments han de parlar del mateix curs.
- **Curs acadèmic**: ha de ser únic i consecutiu.
- **Sessions**: la durada textual de cada activitat ha de coincidir amb la columna de temps.
- **Agrupaments**: els espais i els agrupaments han de ser compatibles amb les activitats.
- **Avaluació**: cada criteri ha de tindre almenys una evidència; els instruments han de cobrir el producte final.
- **Context**: el context marcat ha de coincidir amb la justificació.
- **Codis**: no es poden inventar ni barrejar codis de matèries o nivells diferents.
- **Producte**: el producte final ha d'aparéixer també a l'organització i a les tasques avaluades.
- **ODS**: si la normativa l'exigeix, ha d'estar concretat amb número i justificat.

### 7. Redacta l'informe

Usa `assets/informe-plantilla.md` com a base. L'informe ha de tindre:

1. capçalera amb document, normativa, estat, versió i data;
2. resultat global;
3. resum de bloquejants, avisos i revisions manuals;
4. taula de seccions;
5. taula de coherència;
6. detall de cada bloquejant amb evidència i acció;
7. checklist manual resolta;
8. limitacions;
9. conclusió i properes passes.

### 8. No modifiques el document sense permís

Primer informa. Si l'usuari demana corregir, fes els canvis en una còpia i torna a passar el validador. No canviïs la normativa per fer passar el document: si la normativa no s'aplica, canvia-la explícitament i deixa constància.

## Com interpretar el resultat

| Resultat | Significat |
|---|---|
| **CONFORME** | No hi ha bloquejants, no hi ha avisos i tots els punts manuals estan resolts a favor. |
| **CONFORME AMB OBSERVACIONS** | No hi ha bloquejants, però hi ha avisos o punts manuals que cal justificar. |
| **PENDENT DE REVISIÓ MANUAL** | No hi ha bloquejants ni avisos automàtics, però falten les revisions humanes. |
| **NO CONFORME** | Hi ha almenys un bloquejant. Cal corregir i tornar a revisar. |

No converteixques un `NO VERIFICABLE` en `CONFORME`. Si no tens la normativa real o el currículum, digues-ho.

## Regles per al revisor

1. **Cita sempre l'ID** de la regla (`S09`, `C08`, `M03`).
2. **Aporta evidència**: fragment, cel·la, taula o absència concreta.
3. **Distingix** entre "no hi és", "és incoherent" i "no s'ha pogut verificar".
4. **No inventes codis oficials** ni completis el currículum de memòria.
5. **No marques una revisió manual com a superada** sense haver llegit el document.
6. **No consideres conforme** un document amb placeholders, seccions buides o contradiccions de sessions.
7. **No canviïs la normativa** per fer desaparéixer un bloqueig sense justificar-ho.
8. **No facis una taula Markdown com a substitut del document original**: l'informe és un dictamen, no una reescriptura.

## Exemple inclòs

- `assets/exemple-situacio.html`: la situació del teatre, amb 6 competències, 10 criteris, 3 activitats i 4 instruments.
- `assets/exemple-informe.md`: informe d'exemple amb el resultat esperat.
- `assets/exemple-situacio-amb-errors.html`: còpia deliberadament incorrecta per provar el validador.
- `assets/exemple-informe-amb-errors.md`: informe d'exemple del document incorrecte.
- `references/normativa.md`: normativa d'exemple inventada, editable.

Resultat esperat de l'exemple: **NO CONFORME** per `C10` (no es concreta cap ODS amb número), amb la resta de comprovacions automàtiques correctes i la checklist manual pendent o resolta a l'informe d'exemple.

Resultat esperat del document amb errors: **NO CONFORME** amb **10 bloquejants** (`S09`, `S13`, `S21`, `C01`, `C06`, `C08`, `C10`, `C12`, `C14`, `C16`), cap avís i 29 comprovacions correctes. Les errades introduïdes són:

| Regla | Manipulació |
|---|---|
| `S09`, `C06` | `Producte final:` es reanomena `Resultats:`; la paraula encara apareix en text narratiu, però ja no com a etiqueta. |
| `S13` | `Sabers bàsics` es reanomena `Continguts`. |
| `S21`, `C12` | `Tasques avaluades:` es reanomena `Tasques fetes:`. |
| `C01` | Es desmarca la casella del context social. |
| `C08` | La primera activitat diu 3 sessions a la seqüenciació i 2 a la columna de temps. |
| `C10` | No es concreta cap ODS amb número (error heretat de l'exemple). |
| `C14` | La capçalera diu 4t ESO i la descripció continua dient 3r ESO. |
| `C16` | S'afegeix `{{PENDENT}}`. |

Per comprovar-ho:

```bash
python3 skills/revisio-situacio-aprenentatge/scripts/revisar.py skills/revisio-situacio-aprenentatge/assets/exemple-situacio-amb-errors.html
```

## Fitxers

- `references/normativa.md`: normativa editable i bloc de regles automàtiques.
- `assets/exemple-situacio.html`: document de prova correcte quant a estructura.
- `assets/exemple-situacio-amb-errors.html`: document de prova amb errades deliberades.
- `assets/informe-plantilla.md`: plantilla d'informe.
- `assets/exemple-informe.md`: informe complet d'exemple.
- `assets/exemple-informe-amb-errors.md`: informe d'exemple del document incorrecte.
- `scripts/revisar.py`: validador automàtic.

## Checklist final de la revisió

- [ ] He confirmat el document i la normativa aplicable.
- [ ] He executat `revisar.py` i he llegit el resultat.
- [ ] He comprovat les 21 seccions obligatòries.
- [ ] He comprovat competències, criteris i correspondència.
- [ ] He comprovat productes, reptes, activitats, sessions i instruments.
- [ ] He buscat contradiccions de nivell, curs, context, sessions i avaluació.
- [ ] He resolt la checklist manual amb evidències.
- [ ] He distingit bloquejants, avisos i punts no verificables.
- [ ] He redactat les accions correctives.
- [ ] No he modificat el document original sense permís.
- [ ] L'informe indica si la normativa és vigent o d'exemple.
