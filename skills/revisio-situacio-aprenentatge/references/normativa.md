---
titol: "Normativa d'exemple per a la revisió de situacions d'aprenentatge (ESO)"
estat: "EXEMPLE NO VIGENT"
versio: "0.1"
data: "2026-10-26"
ambit: "Educació Secundària Obligatòria"
territori: "Catalunya"
font: "Document inventat per a demostració; no és normativa oficial."
---

# Normativa de referència per a la revisió de situacions d'aprenentatge

> [!IMPORTANT]
> Aquest fitxer és una **normativa d'exemple inventada**. Serveix per demostrar com funciona la skill i perquè siga substituït pel marc normatiu real del territori, el curs i l'etapa.
>
> **No el cites com a font legal.** Abans d'usar-lo en un centre, substitueix les regles, les referències i les metadades per la normativa oficial vigent. Si canvies les regles, actualitza també el bloc `REGLES-AUTO` del final.

## 0. Com editar aquest fitxer

1. Canvia el frontmatter (`titol`, `estat`, `versio`, `data`, `territori`, `font`) per les dades reals.
2. Substitueix el marc legal orientatiu per les referències oficials que corresponguen.
3. Ajusta les taules de seccions obligatòries, coherència i prohibicions.
4.Actualitza el bloc `REGLES-AUTO` perquè el validador automàtic comprove les mateixes regles que la part humana.
5. Conserva els identificadors (`S01`, `C01`, `P01`, `M01`) si vols que els informes seguisquen la mateixa nomenclatura.
6. Marca `estat: "VIGENT"` només quan el contingut siga realment la normativa aplicable.

## 1. Objecte i àmbit

Aquesta normativa estableix les condicions mínimes que ha de complir una situació d'aprenentatge d'ESO per considerar-se completa, coherent i conforme amb el currículum.

S'aplica a:

- situacions d'aprenentatge incloses en una programació d'aula;
- documents en HTML, PDF, DOCX o text convertit;
- revisions inicials, revisions de centre i auditories de qualitat.

No substitueix la validació oficial del centre ni la inspecció educativa.

## 2. Marc legal de referència (orientatiu, a verificar)

Aquestes referències són un punt de partida. Cal comprovar la vigència, l'article aplicable i la concreció autonòmica abans de considerar-les normativa real:

- Llei Orgànica 3/2020, de 29 de desembre, per la qual es modifica la Llei Orgànica 2/2006 d'Educació (LOMLOE).
- Reial Decret 217/2022, de 29 de març, pel qual s'estableix l'ordenació i els ensenyaments mínims de l'Educació Secundària Obligatòria.
- Decret 175/2022, de 27 de setembre, d'ordenació dels ensenyaments de l'educació bàsica a Catalunya.
- Currículum vigent de l'etapa, les matèries i els àmbits.
- Projecte educatiu de centre, programació general anual, normes d'organització i funcionament, projecte lingüístic i pla digital de centre.

## 3. Definicions operatives

- **Situació d'aprenentatge**: conjunt d'activitats contextualitzades que parteix d'una necessitat o oportunitat de l'entorn i que mobilitza competències, sabers i criteris d'avaluació per elaborar un producte final.
- **Competència específica**: capacitat que l'alumnat ha de desenvolupar en una matèria o àmbit.
- **Criteri d'avaluació**: referent observable que permet valorar el grau d'assoliment d'una competència.
- **Saber bàsic**: coneixement, destresa, actitud o valor que sustenta el desenvolupament competencial.
- **Producte final**: evidència tangible o actuació verificable que sintetitza l'aprenentatge.
- **DUA**: disseny universal per a l'aprenentatge, entès com el conjunt de mesures preventives i adaptacions que eliminen barreres.

## 4. Seccions obligatòries

Totes les seccions següents han d'aparéixer de manera identificable. L'absència de qualsevol secció és un motiu de **no conformitat**.

| ID | Secció | Evidència esperada | Gravetat |
|---|---|---|---|
| S01 | Curs acadèmic | Camp `Curs acadèmic:` amb un curs vàlid | Bloquejant |
| S02 | Matèria | Camp `Matèria:` amb matèria, àmbit o mòdul | Bloquejant |
| S03 | Nivell | Camp `Nivell:` amb curs i etapa | Bloquejant |
| S04 | Grup | Camp `Grup:` amb grup o programa | Bloquejant |
| S05 | Número de situació | `Situació d'aprenentatge núm. N` | Bloquejant |
| S06 | Títol | Camp `Títol:` amb un títol concret | Bloquejant |
| S07 | Context | `Context:` amb almenys una casella marcada | Bloquejant |
| S08 | Descripció / Justificació | Punt de partida, grup, necessitat i encaix curricular | Bloquejant |
| S09 | Producte final | Etiqueta `Producte final:` amb 3-5 productes o resultats concrets | Bloquejant |
| S10 | Reptes del s.XXI i ODS | Connexió amb un repte i 3-5 accions | Bloquejant |
| S11 | Competències específiques | 4-6 competències amb codi o etiqueta | Bloquejant |
| S12 | Criteris d'avaluació vinculats | 6-12 criteris vinculats | Bloquejant |
| S13 | Sabers bàsics | Blocs i sabers concrets, no genèrics | Bloquejant |
| S14 | Organització | Bloc amb les cinc columnes | Bloquejant |
| S15 | Seqüenciació d'activitats | 3-4 activitats amb sessions | Bloquejant |
| S16 | Organització dels espais | Agrupaments i espais per activitat | Bloquejant |
| S17 | Distribució del temps | Sessions o durada per activitat | Bloquejant |
| S18 | Recursos i materials | Recursos concrets per activitat | Bloquejant |
| S19 | Mesures per a la inclusió | Mesures concretes, DUA i suports | Bloquejant |
| S20 | Instruments de recollida d'informació | 4-6 instruments | Bloquejant |
| S21 | Tasques avaluades | Evidències concretes | Bloquejant |

## 5. Requisits de contingut i coherència

| ID | Regla | Comprovació | Gravetat |
|---|---|---|---|
| C01 | El context ha d'estar marcat | Almenys una casella `X` entre personal, educatiu, social i professional | Bloquejant |
| C02 | Tota competència ha de tindre criteri | Cada codi de competència apareix en almenys un criteri | Bloquejant |
| C03 | Tot criteri ha de penjar d'una competència | Cada criteri té una competència amb el mateix prefix i nivell | Bloquejant |
| C04 | Nombre de competències | Entre 4 i 6 | Bloquejant |
| C05 | Nombre de criteris | Entre 6 i 12 | Bloquejant |
| C06 | Nombre de productes | Entre 3 i 5 | Avís; bloquejant si no n'hi ha cap |
| C07 | Nombre de reptes | Entre 3 i 5 | Avís; bloquejant si no n'hi ha cap |
| C08 | Activitats i temps | Almenys 3 activitats; cada fila té les 5 columnes; la durada textual i la columna de temps coincideixen | Bloquejant |
| C09 | Nombre d'instruments | Entre 4 i 6 | Avís; bloquejant si no n'hi ha cap |
| C10 | ODS explícit | El document esmenta almenys un ODS amb número | Bloquejant si la normativa ho exigeix |
| C11 | Mesures d'inclusió | El bloc conté mesures concretes (DUA, suports, adaptacions, alumne referent) | Bloquejant |
| C12 | Tasques avaluades | Hi ha `Tasques avaluades:` i almenys 3 evidències | Bloquejant |
| C13 | Curs acadèmic coherent | Un únic curs acadèmic amb format `20XX-20XX` i anys consecutius | Avís; bloquejant si no se'n detecta cap |
| C14 | Nivell coherent | Un únic nivell d'ESO al llarg del document | Bloquejant si hi ha contradicció; avís si no se'n detecta cap |
| C15 | Codis duplicats | No hi ha competències ni criteris repetits | Avís |
| C16 | Placeholders | No queden `{{...}}`, `[PENDENT]`, `TODO`, `XXX` ni textos de farciment | Bloquejant |
| C17 | Codis oficials | Els prefixos pertanyen al currículum que s'està aplicant | Avís; la vigència es confirma a M08 |
| C18 | Instruments variats | Hi ha instruments formatius i summatius, no només una prova | Avís |

La viabilitat del producte final i l'alineació dels sabers no es poden verificar automàticament; es revisen a `M02` i `M04`.

## 6. Prohibicions

| ID | Prohibició | Conseqüència |
|---|---|---|
| P01 | Deixar placeholders o camps buits | No conforme |
| P02 | Inventar codis oficials o atribuir-los a una norma sense verificar-los | No conforme |
| P03 | Presentar una llista de continguts sense activitats ni producte final | No conforme |
| P04 | Avaluar només amb una prova final, sense evidències formatives | Avís greu |
| P05 | Copiar el currículum sencer sense seleccionar els sabers rellevants | Avís |
| P06 | Contradir el context, el nivell, el curs o el nombre de sessions entre seccions | No conforme |

## 7. Nivells de gravetat i resultat global

- **Bloquejant**: impedeix considerar el document conforme. El resultat global és **NO CONFORME**.
- **Avís**: no impedix la conformitat, però cal revisar-lo o justificar-lo. El resultat global és **CONFORME AMB OBSERVACIONS**.
- **Manual**: no es pot verificar automàticament; el resultat queda **PENDENT DE REVISIÓ MANUAL** fins que una persona el tanque.

Es considera **CONFORME** només si no hi ha bloquejants, no hi ha avisos i tots els punts manuals estan resolts.

> **Nota sobre PDF.** Quan el document és un PDF, les comprovacions que depenen de llegir columnes o taules es poden degradar a **Avís** i acompanyar-se d'una nota de revisió manual. L'extracció de text no és equivalent a llegir el document original: la maquetació pot separar o barrejar cel·les. L'HTML és el format preferent per a l'auditoria automàtica.

## 8. Procediment de revisió

1. Identificar totes les seccions obligatòries.
2. Comprovar els camps de capçalera i el context.
3. Extreure competències, criteris, productes, reptes, activitats i instruments.
4. Aplicar les regles de coherència.
5. Revisar manualment les regles marcades com a `Manual`.
6. Emetre un informe amb evidències, gravetat i accions correctives.
7. No modificar el document original sense autorització: primer s'informa, després es proposa la correcció.

## 9. Evidències i traçabilitat

Cada afirmació de l'informe ha d'incloure:

- l'ID de la regla;
- la ubicació o el fragment que la sustenta;
- la gravetat;
- l'acció correctiva recomanada.

No s'accepten informes amb afirmacions genèriques sense evidència.

## 10. Annex: exemple aplicat

La situació d'exemple «El teatre com a eina de socialització de les persones majors» (3r ESO, àmbit pràctic, PDC) serves per il·lustrar l'aplicació:

- 6 competències: FOIP1, FOIP2, FOIP4, TD1, TD2 i TD5.
- 10 criteris: FOIP 1.3, 1.4, 2.1, 2.4, 4.1, 4.3, 4.5, TD 1.3, 2.4 i 5.1.
- 3 activitats de 3, 4 i 4 sessions.
- 5 productes finals i 4 reptes.
- 4 instruments i 5 evidències avaluades.

Aquest annex és només una referència de calibratge; no és una plantilla de contingut.

## 11. Regles automàtiques

El bloc següent alimenta `scripts/revisar.py`. Si edites la normativa humana, actualitza també aquest bloc. No el deixes buit: el validador no podrà funcionar.

<!-- REGLES-AUTO -->
```json
{
  "min_competencies": 4,
  "max_competencies": 6,
  "min_criteria": 6,
  "max_criteria": 12,
  "min_products": 3,
  "max_products": 5,
  "min_challenges": 3,
  "max_challenges": 5,
  "min_activities": 3,
  "min_instruments": 4,
  "max_instruments": 6,
  "min_tasks": 3,
  "require_explicit_ods": true,
  "require_dua": true,
  "require_checked_context": true,
  "require_tasks": true,
  "allowed_code_prefixes": ["FOIP", "TD"],
  "forbidden_patterns": [
    "\\{\\{[^}]+\\}\\}",
    "\\bPENDENT\\b",
    "\\bTODO\\b",
    "\\bXXX\\b",
    "Lorem ipsum",
    "\\bN/A\\b"
  ],
  "required_sections": [
    {"id": "S01", "label": "Curs acadèmic", "aliases": ["Curs acadèmic", "Curso académico"]},
    {"id": "S02", "label": "Matèria", "aliases": ["Matèria", "Materia"]},
    {"id": "S03", "label": "Nivell", "aliases": ["Nivell", "Nivel"]},
    {"id": "S04", "label": "Grup", "aliases": ["Grup", "Grupo"]},
    {"id": "S05", "label": "Número de situació", "pattern": "situacio d'aprenentatge.{0,250}num\\.?\\s*\\d+|num\\.?\\s*\\d+.{0,250}situacio d'aprenentatge"},
    {"id": "S06", "label": "Títol", "aliases": ["Títol", "Título"]},
    {"id": "S07", "label": "Context", "aliases": ["Context"]},
    {"id": "S08", "label": "Descripció / Justificació", "aliases": ["Descripció / Justificació", "Descripción / Justificación"]},
    {"id": "S09", "label": "Producte final", "pattern": "producte final\\s*:|producto final\\s*:"},
    {"id": "S10", "label": "Reptes del s.XXI i ODS", "aliases": ["Relació amb els reptes del s.XXI i els ODS", "Relación con los retos del s.XXI y los ODS"]},
    {"id": "S11", "label": "Competències específiques", "aliases": ["Competències específiques", "Competencias específicas"]},
    {"id": "S12", "label": "Criteris d'avaluació vinculats", "aliases": ["Criteris d'avaluació vinculats", "Criterios de evaluación vinculados"]},
    {"id": "S13", "label": "Sabers bàsics", "aliases": ["Sabers bàsics", "Saberes básicos"]},
    {"id": "S14", "label": "Organització", "aliases": ["Organització", "Organización"]},
    {"id": "S15", "label": "Seqüenciació d'activitats", "aliases": ["Seqüenciació d'activitats", "Secuenciación de actividades"]},
    {"id": "S16", "label": "Organització dels espais", "aliases": ["Organització dels espais", "Organización de los espacios"]},
    {"id": "S17", "label": "Distribució del temps", "aliases": ["Distribució del temps", "Distribución del tiempo"]},
    {"id": "S18", "label": "Recursos i materials", "aliases": ["Recursos i materials", "Recursos y materiales"]},
    {"id": "S19", "label": "Mesures de resposta educativa per a la inclusió", "aliases": ["Mesures de resposta educativa per a la inclusió", "Medidas de respuesta educativa para la inclusión"]},
    {"id": "S20", "label": "Instruments de recollida d'informació", "pattern": "instruments de recollida"},
    {"id": "S21", "label": "Tasques avaluades", "aliases": ["Tasques avaluades", "Tareas evaluadas"]}
  ],
  "manual_checks": [
    {"id": "M01", "label": "Coherència entre la justificació, el context marcat i les necessitats de l'entorn."},
    {"id": "M02", "label": "El producte final és observable, avaluable i viable amb els recursos i el temps previstos."},
    {"id": "M03", "label": "Cada criteri d'avaluació té almenys una evidència o tasca avaluada."},
    {"id": "M04", "label": "Els sabers bàsics seleccionats són els que sustenten les competències i les activitats."},
    {"id": "M05", "label": "Les activitats condueixen de manera progressiva al producte final."},
    {"id": "M06", "label": "Els instruments permeten una avaluació formativa i sumativa, no només una prova final."},
    {"id": "M07", "label": "Les mesures d'inclusió són concretes i responen a barreres reals de l'alumnat."},
    {"id": "M08", "label": "Els codis oficials coincideixen amb el currículum vigent i no s'han inventat."},
    {"id": "M09", "label": "No hi ha contradiccions de dates, nivells, agrupaments, sessions o noms entre seccions."},
    {"id": "M10", "label": "El llenguatge és inclusiu, clar i adequat al nivell."}
  ]
}
```
<!-- FI REGLES-AUTO -->
