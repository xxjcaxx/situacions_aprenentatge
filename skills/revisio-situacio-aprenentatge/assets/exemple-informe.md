# Informe d'exemple de revisió d'una situació d'aprenentatge

> **Exemple didàctic.** Aquest informe revisa `assets/exemple-situacio.html` amb la normativa d'exemple de `references/normativa.md`. La normativa és inventada i no vigent: serveix per mostrar el flux de treball, no per certificar res.

## 1. Capçalera

- **Document revisat:** `assets/exemple-situacio.html`
- **Títol de la situació:** El teatre com a eina de socialització de les persones majors
- **Curs / nivell / grup:** 2022-2023 · 3r ESO · PDC
- **Matèria:** Àmbit pràctic
- **Normativa aplicada:** `references/normativa.md`
- **Títol de la normativa:** Normativa d'exemple per a la revisió de situacions d'aprenentatge (ESO)
- **Estat de la normativa:** EXEMPLE NO VIGENT
- **Versió / data:** 0.1 · 2026-10-26
- **Abast:** revisió completa (seccions, coherència i checklist manual)
- **Comanda:** `python3 scripts/revisar.py assets/exemple-situacio.html`

## 2. Resultat global

**NO CONFORME**

| Bloquejants | Avisos | Revisions manuals | Comprovacions correctes |
|---:|---:|---:|---:|
| 1 | 0 | 10 | 38 |

La situació és completa pel que fa a les 21 seccions i coherent en competències, criteris, activitats, sessions i instruments. No obstant això, no es pot considerar conforme perquè:

- **C10**: la secció parla d'ODS, però no concreta cap ODS amb número.
- **M03**: dos criteris d'avaluació no tenen una evidència explícita a les tasques avaluades.

La resta de comprovacions automàtiques són correctes. La revisió manual ha detectat, a més, un punt no verificable (`M08`, vigència dels codis) i una observació menor (`M07`, mesures de l'activitat 2).

## 3. Seccions obligatòries

Les 21 seccions obligatòries (`S01`-`S21`) són presents:

| Bloc | Seccions | Resultat |
|---|---|---|
| Dades i identificació | `S01`-`S07` | OK |
| Descripció, producte i reptes | `S08`-`S10` | OK |
| Competències i criteris | `S11`-`S12` | OK |
| Sabers i organització | `S13`-`S19` | OK |
| Avaluació | `S20`-`S21` | OK |

No s'ha detectat cap secció òrfena, cap camp de capçalera buit ni cap placeholder.

## 4. Coherència i contingut

| ID | Comprovació | Resultat | Detall / evidència |
|---|---|---|---|
| C01 | Context marcat | OK | 1 casella marcada: social. |
| C02 | Cada competència té criteri | OK | 6 competències i 10 criteris; totes tenen correspondència. |
| C03 | Cada criteri té competència | OK | Cap criteri orfe. |
| C04 | Nombre de competències | OK | 6: FOIP1, FOIP2, FOIP4, TD1, TD2, TD5. |
| C05 | Nombre de criteris | OK | 10: FOIP 1.3, 1.4, 2.1, 2.4, 4.1, 4.3, 4.5, TD 1.3, 2.4, 5.1. |
| C06 | Nombre de productes | OK | 5 productes finals. |
| C07 | Nombre de reptes | OK | 4 reptes. |
| C08 | Activitats i sessions | OK | 3 activitats de 3, 4 i 4 sessions; les durades coincideixen amb la columna de temps. |
| C09 | Nombre d'instruments | OK | 4 instruments. |
| C10 | ODS explícit | **BLOQUEJANT** | La paraula ODS apareix al títol, però no hi ha cap número d'ODS. |
| C11 | Mesures d'inclusió i DUA | OK | DUA, alumne referent, plantilles adaptades i suports. |
| C12 | Tasques avaluades | OK | 5 evidències: respostes, circular, planificació, promoció i organització. |
| C13 | Curs acadèmic coherent | OK | 2022-2023, anys consecutius. |
| C14 | Nivell coherent | OK | 3r ESO a la capçalera i a la descripció. |
| C15 | Codis duplicats | OK | No n'hi ha. |
| C16 | Placeholders | OK | No n'hi ha. |
| C17 | Codis oficials | OK | Prefixos FOIP i TD; cal confirmar vigència (M08). |
| C18 | Varietat d'instruments | OK | Observació, portfolio, exposició i dossier. |

## 5. Revisió manual

| ID | Comprovació | Resultat | Evidència / justificació |
|---|---|---|---|
| M01 | Coherència justificació-context-entorn | CONFORME | El context social encaixa amb l'associació de persones majors i el teatre comunitari. |
| M02 | Producte final observable i viable | CONFORME AMB OBSERVACIÓ | Els productes són observables, però depenen de l'ajuntament i de l'associació; cal confirmar permisos i recursos. |
| M03 | Cada criteri té evidència | **NO CONFORME** | FOIP 1.4 (hàbits saludables) i FOIP 4.5 (decisions i valors) no tenen una evidència explícita a les tasques avaluades. |
| M04 | Sabers alineats | CONFORME | FOIP 1.2, 1.3, 2.2 i 3.1; Tecnologia 1 i 6 sustenten les competències i les activitats. |
| M05 | Activitats progressives | CONFORME | DAFO → planificació i difusió → execució de l'esdeveniment. |
| M06 | Avaluació formativa i sumativa | CONFORME | Diari d'observació i portfolio (formatiu); exposició i dossier (summatiu). |
| M07 | Inclusió concreta | CONFORME AMB OBSERVACIÓ | Hi ha DUA, alumne referent i suports; a l'activitat 2 es repeteixen recursos i mesures, cal concretar-les millor. |
| M08 | Codis oficials vigents | NO VERIFICABLE | Els codis FOIP i TD són plausibles, però no s'han contrastat amb el currículum oficial. |
| M09 | Sense contradiccions | CONFORME | No s'han detectat contradiccions de nivell, curs, sessions, agrupaments ni avaluació. |
| M10 | Llenguatge inclusiu | CONFORME | Llenguatge inclusiu i adequat; es poden escurçar algunes frases llargues. |

## 6. Contradiccions detectades

No s'han detectat contradiccions automàtiques de nivell, curs, sessions o seccions.

La revisió manual sí que detecta una **manca de traçabilitat** (M03), que no és una contradicció literal però impedix afirmar que tots els criteris s'avaluen:

| Tipus | On | Què diu una secció | Què diu l'altra | Resolució |
|---|---|---|---|---|
| Manca d'evidència | Competències i criteris vs. tasques avaluades | FOIP 1.4 i FOIP 4.5 demanen hàbits saludables i presa de decisions | Les tasques no inclouen cap evidència específica per a estos criteris | Afegir una evidència o ajustar els criteris |

## 7. Accions correctives

### A1 · C10 · Concretar l'ODS

- **Problema:** la secció «Relació amb els reptes del s.XXI i els ODS» no concreta cap ODS.
- **Acció:** afegir, per exemple, «ODS 3: Salut i benestar» com a ODS principal i, si es vol, «ODS 10: Reducció de les desigualtats» com a secundari.
- **Justificació:** el projecte incideix en el benestar i la participació de les persones majors i en la cohesió comunitària.
- **Ubicació:** bloc 4, primer paràgraf.

### A2 · M03 · Traçabilitat dels criteris

- **Problema:** FOIP 1.4 i FOIP 4.5 no tenen evidència explícita.
- **Acció:** afegir a les tasques avaluades una reflexió individual sobre hàbits saludables i una justificació de les decisions preses, o bé retirar estos criteris si no es treballen.
- **Ubicació:** bloc 5 (criteris) i bloc 8 (tasques avaluades).

### A3 · M08 · Verificació dels codis

- **Problema:** no s'ha pogut confirmar que FOIP1, FOIP2, FOIP4, TD1, TD2 i TD5 siguen els codis vigents.
- **Acció:** contrastar-los amb el currículum oficial del curs i del territori.
- **Ubicació:** bloc 5.

### A4 · M07 · Concreció de les mesures

- **Problema:** les mesures de l'activitat 2 repeteixen els recursos i són poc específiques.
- **Acció:** descriure suports concrets per a la circular, la planificació i la difusió.
- **Ubicació:** bloc 7, activitat 2.

## 8. Limitacions de la revisió

- La normativa utilitzada és d'exemple i no vigent.
- No s'ha verificat el currículum oficial ni la vigència dels codis (M08).
- No s'ha comprovat la viabilitat real dels permisos, els recursos econòmics ni la disponibilitat de l'ajuntament i de l'associació.
- El curs 2022-2023 és el que consta al document; si es presenta com a proposta per al curs actual, cal actualitzar-lo.

## 9. Conclusió i properes passes

El document té una estructura molt completa i una coherència interna alta, però **no és conforme** amb la normativa d'exemple perquè no concreta cap ODS i perquè dos criteris no tenen evidència explícita.

1. Afegir l'ODS principal i justificar-lo.
2. Assignar evidències a FOIP 1.4 i FOIP 4.5.
3. Verificar els codis oficials amb el currículum vigent.
4. Tornar a executar `revisar.py` i actualitzar este informe.

Si es corregeixen A1 i A2, el resultat automàtic passaria a **PENDENT DE REVISIÓ MANUAL** fins que M08 es puga confirmar. Si M08 es confirma i M07 es concreta, el resultat podria ser **CONFORME**.

## 10. Signatura

- **Revisat per:** exemple didàctic
- **Data:** 2026-10-26
- **Estat:** NO CONFORME
