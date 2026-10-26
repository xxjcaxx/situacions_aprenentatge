---
name: "Situació d'aprenentatge ESO"
description: "Crea, completa o revisa programacions d'aula de situacions d'aprenentatge d'ESO amb el format oficial extret de Situacio-daprenentatge-ESO-exemple1.pdf: A4 horitzontal, taula amb columna morada, competències i criteris, sabers bàsics, organització i instruments d'avaluació. Usa-la quan demanin una «situació d'aprenentatge», «situación de aprendizaje», «programació d'aula», «programación de aula» o una taula equivalent per a ESO."
---

# Situació d'aprenentatge ESO

## Per a què serveix

Genera una programació d'aula completa amb la mateixa estructura visual i el mateix contracte de continguts que l'exemple `Situacio-daprenentatge-ESO-exemple1.pdf`. No és una plantilla de text lliure: és una taula A4 horitzontal amb blocs, fusions, colors i extensions de contingut fixades.

Llegeix `references/estructura-i-continguts.md` abans de construir o revisar el document. Conté mesures exactes, columnes, tipografia, ordre de blocs, extensió esperada de cada apartat i checklist.

## Quan usar-la

- L'usuari demana crear una situació d'aprenentatge per a ESO.
- Cal completar una programació d'aula amb competències, criteris, sabers, organització i instruments.
- Cal revisar si una taula existent té l'estructura correcta.
- Cal convertir un contingut en el format de 5 pàgines de l'exemple.

## Entrades que cal obtenir

Recull aquestes dades. Si en falta alguna, pregunta només la imprescindible; la resta es pot proposar i marcar per revisió.

1. Curs acadèmic, matèria/àmbit, nivell i grup.
2. Número i títol de la situació.
3. Context (personal, educatiu, social i/o professional).
4. Necessitat o oportunitat de l'entorn que origina la situació.
5. Producte final i reptes/accions.
6. Competències específiques i criteris oficials del currículum.
7. Sabers bàsics (blocs i continguts concrets).
8. Activitats, sessions, agrupaments, espais, temps, recursos i mesures d'inclusió.
9. Instruments d'avaluació i tasques avaluades.
10. Llengua de sortida (per defecte, català) i format (HTML imprimible, PDF o DOCX).

No inventis codis oficials de competències ni criteris. Si no tens el currículum, demana'l abans de tancar el document. Si l'usuari demana continuar sense, fes servir etiquetes descriptives provisionals («Competència 1», «Criteri 1.1») i avisa explícitament que cal substituir-les pels codis oficials; no les presentis mai com a oficials.

## Regles no negociables

1. **Mateix ordre de blocs**: dades → identificació → descripció/producte → reptes/ODS → competències/criteris → sabers → organització → instruments.
2. **Mateixa geometria**: A4 horitzontal, taula de 269,3 mm, columna morada del 18,65 %, línies de 0,5 pt.
3. **Mateixos colors**: morat `#774DB2`, gris `#F2F2F2`, text negre, text blanc a la columna morada.
4. **Mateixa tipografia**: Arial o Liberation Sans; cos 10 pt; etiquetes morades 11,5 pt negreta; títol del document 12,5 pt negreta morat; subcapçaleres en cursiva.
5. **Sense línies horitzontals** dins de competències, sabers, organització i instruments. Només entre blocs i entre les dues files d'identificació/descripció.
6. **Sense files ni columnes inventades**. Si un contingut no encaixa, reorganitza'l dins del bloc; no canviïs l'esquema.
7. **No deixis cap apartat buit**. Si falta informació, escriu un contingut mínim coherent i marca'l com a revisable, però no enviïs la taula amb placeholders.
8. **No generis una taula Markdown com a resultat final**: no pot representar fusions, colors ni paginació. El resultat ha de ser HTML imprimible, PDF o DOCX.

## Flux de treball

1. **Llegeix el contracte**: obre `references/estructura-i-continguts.md` i pren les mides, columnes i extensions.
2. **Planifica el contingut** en un esborrany intern amb aquests comptes:
   - 3-5 productes finals.
   - 3-5 reptes.
   - 4-6 competències i 6-12 criteris.
   - 2-4 blocs per columna de sabers.
   - 3-4 activitats, cadascuna amb les cinc columnes d'organització.
   - 4-6 instruments i una llista de tasques avaluades.
3. **Redacta** amb llenguatge curricular, concret i verificable. Cada activitat ha de tenir coherència interna entre seqüenciació, espais, temps, recursos i inclusió.
4. **Munta la taula** copiant `assets/plantilla-situacio.html` i substituint els camps. Per a un exemple complet, parteix de `assets/exemple-situacio.html`.
5. **Renderitza** amb `bash scripts/render.sh entrada.html sortida.pdf`.
6. **Valida** amb `python3 scripts/validar.py sortida.html` i amb la checklist del final.
7. **Revisa la paginació**: el resultat típic és de 5 pàgines; comprova que no hi hagi capçaleres òrfenes, cel·les tallades ni text desbordat.

## Contingut esperat per bloc

### Capçalera de dades

Fila grisa de quatre columnes: curs acadèmic, matèria, nivell i grup. Tots els camps són obligatoris.

### Identificació

- Columna morada: `Situació d'aprenentatge núm. N`.
- Columna central: `Títol:` en cursiva i títol en negreta (1-2 línies).
- Columna dreta: `Context:` amb caselles per a personal, educatiu, social i professional; marca amb `X` les que corresponguin.

### Descripció / Justificació

Un o dos paràgrafs que expliquin el punt de partida, el grup, la necessitat de l'entorn i l'encaix curricular. Després, `Producte final:` amb 3-5 resultats concrets en guions.

### Reptes del s.XXI i ODS

Un paràgraf de connexió amb el repte social o comunitari i una llista numerada de 3-5 accions, de la detecció a l'execució. Si és possible, esmenta un ODS.

### Competències i criteris

- Esquerra: `Competències específiques` en cursiva i un paràgraf per competència amb el format `Competència específica: CODI text`, on `CODI` només apareix si és oficial.
- Dreta: `Criteris d'avaluació vinculats` en cursiva i un paràgraf per criteri amb el format `CODI text`, amb la mateixa condició.
- Cada competència ha de tenir almenys un criteri. Mantén l'ordre i no inventis codis: si no en tens, aplica les etiquetes provisionals indicades a les entrades.

### Sabers bàsics

Dues columnes, una per matèria o mòdul, amb el nom en cursiva. A sota, `BLOC X: [títol]` i una descripció concreta dels sabers. Selecciona només els blocs rellevants.

### Organització

Cinc columnes exactes:

1. `Seqüenciació d'activitats`: narrativa i desglossament sessió a sessió.
2. `Organització dels espais`: agrupaments i espais.
3. `Distribució del temps`: sessions i durada.
4. `Recursos i materials`: eines, plantilles i materials.
5. `Mesures de resposta educativa per a la inclusió`: suports, DUA, alumne referent.

Cada activitat ha de tenir les cinc columnes coherents. L'última activitat ha d'incloure l'execució del producte final.

### Instruments

Llista de 4-6 instruments (observació, portfolio, exposició, dossier, rúbrica...). Després, `Tasques avaluades:` en negreta i un paràgraf amb les evidències concretes.

## Fitxers

- `references/estructura-i-continguts.md`: mides, columnes, estils, contracte de contingut, paginació i checklist.
- `assets/plantilla-situacio.html`: plantilla buida amb placeholders i classes llestes per imprimir.
- `assets/exemple-situacio.html`: exemple complet basat en el PDF, útil com a few-shot.
- `scripts/render.sh`: converteix HTML en PDF amb Chrome headless.
- `scripts/validar.py`: comprova etiquetes obligatòries, placeholders i pistes bàsiques de contingut.

## Checklist final

- [ ] Tots els blocs hi són i en l'ordre correcte.
- [ ] Capçalera de dades completa.
- [ ] Context marcat amb X.
- [ ] Descripció i producte final.
- [ ] Reptes i ODS.
- [ ] Competències i criteris aparellats, amb codis oficials o etiquetes provisionals identificades.
- [ ] Sabers concrets i seleccionats.
- [ ] Tres o quatre activitats amb les cinc columnes coherents.
- [ ] Instruments i tasques avaluades.
- [ ] Sense placeholders.
- [ ] A4 horitzontal, colors i tipografia correctes.
- [ ] Sense línies horitzontals dins dels blocs.
- [ ] Paginació neta, sense textos tallats ni capçaleres òrfenes.
