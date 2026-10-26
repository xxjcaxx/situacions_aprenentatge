# Informe d'exemple: document amb errors deliberats

> **Exemple de prova.** Aquest informe revisa `assets/exemple-situacio-amb-errors.html`, una còpia de l'exemple amb errades introduïdes a propòsit per comprovar que el validador les detecta. La normativa és la d'exemple de `references/normativa.md` i **no és vigent**.

## 1. Capçalera

- **Document revisat:** `assets/exemple-situacio-amb-errors.html`
- **Títol de la situació:** El teatre com a eina de socialització de les persones majors
- **Curs / nivell / grup:** 2022-2023 · 3r ESO / 4t ESO (contradicció) · PDC
- **Normativa aplicada:** `references/normativa.md`
- **Estat de la normativa:** EXEMPLE NO VIGENT
- **Versió / data:** 0.1 · 2026-10-26
- **Abast:** proves de regressió del validador
- **Comanda:** `python3 scripts/revisar.py assets/exemple-situacio-amb-errors.html`

## 2. Resultat global

**NO CONFORME**

| Bloquejants | Avisos | Revisions manuals | Comprovacions correctes |
|---:|---:|---:|---:|
| 10 | 0 | 10 | 29 |

El document és una còpia de l'exemple correcte amb deu alteracions. El validador les detecta totes i no genera cap fals avís. Els deu bloquejants són els esperats per al fixture de proves.

## 3. Bloquejants detectats

| ID | Comprovació | Evidència | Causa introduïda |
|---|---|---|---|
| S09 | Producte final | No es troba l'etiqueta `Producte final:` | S'ha reanomenat `Resultats:`; el text narratiu encara diu «producte final», però ja no és una etiqueta. |
| S13 | Sabers bàsics | No es troba la secció | S'ha reanomenat `Continguts`. |
| S21 | Tasques avaluades | No es troba la secció | S'ha reanomenat `Tasques fetes:`. |
| C01 | Context marcat | 0 caselles marcades | S'ha desmarcat el context social. |
| C06 | Nombre de productes finals | Cap producte detectat | Conseqüència de perdre l'etiqueta de `S09`. |
| C08 | Activitats i coherència de temps | Activitat 1: 3 sessions a la seqüenciació i 2 a la columna de temps | S'ha canviat `3 SESSIONS` per `2 SESSIONS` només a la columna de temps. |
| C10 | ODS explícit | Hi ha la paraula ODS, però cap número | Error heretat de l'exemple original. |
| C12 | Tasques avaluades | Bloc buit o absent | Conseqüència de perdre l'etiqueta de `S21`. |
| C14 | Nivell coherent | Nivells diferents: 3r ESO i 4t ESO | S'ha canviat la capçalera a 4t ESO sense canviar la descripció. |
| C16 | Placeholders | `{{PENDENT}}` | S'ha afegit un marcador al final del document. |

## 4. Comprovacions correctes rellevants

La resta de regles automàtiques continuen passant, cosa que confirma que les errades són les introduïdes i no efectes secundaris:

- `S01`-`S08`, `S10`-`S12`, `S14`-`S20`: seccions presents.
- `C02`, `C03`: competències i criteris continuen aparellats.
- `C04`, `C05`: 6 competències i 10 criteris.
- `C07`: 4 reptes.
- `C09`: 4 instruments.
- `C11`: DUA i mesures concretes.
- `C13`: curs 2022-2023 consecutiu.
- `C15`: sense codis duplicats.
- `C17`, `C18`: prefixos FOIP/TD i instruments variats.

## 5. Revisió manual

Els deu punts `M01`-`M10` queden pendents. En este fixture no cal resoldre'ls: l'objectiu és provar la detecció automàtica. Si es reutilitza com a exemple didàctic, caldria completar-los amb el mateix criteri que a `assets/exemple-informe.md`.

## 6. Conclusió

El fixture complix el seu propòsit: **10 bloquejants detectats, 0 avisos i 29 comprovacions correctes**. Qualsevol canvi futur al validador o a `REGLES-AUTO` que altere estos nombres ha de revisar-se: pot ser una millora, però també una regressió.

## 7. Signatura

- **Revisat per:** exemple didàctic
- **Data:** 2026-10-26
- **Estat:** NO CONFORME (esperat)
