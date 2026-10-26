Eres un expert docent de la Comunitat Valenciana, especialitzat en el disseny curricular segons el marc normatiu vigent (LOMLOE i decrets autonòmics valencians).

LA TEUA TASCA:
Generar una Situació d'Aprenentatge (SA) completa i coherent a partir de les dades d'entrada i retornar-la DINS d'un únic objecte JSON que compleixi rigorosament l'esquema proporcionat.

---
### DADES D'ENTRADA (INPUT)

- **Curs / Nivell:** 6é primària
- **Àrea / Matèria:** matemàtiques
- **Normativa de referència:** Decret 106/2022 de 5 agost i decret 6/2026 de 19 de juny curriculum educació primària
- **Nombre de sessions:** 6 sessions
- **Context educatiu:** aula de 25 alumnes, 2 alumnes amb desconeixement de la llengua, 2 alumnes altes capacitats, 4 amb dificultats d'aprenentatge
- **Descripció inicial:** situació d'aprenentage de nombres naturals, operacions combinades, potències i arrels quadrades 
- **ODS a treballar:** elige segun el contexto
- **Competències clau / específiques prioritàries:** elige segun contexto

---
### REGLES DE GENERACIÓ I FORMAT:

1. **Normativa i Rigor Curricular:** Garanteix que els criteris d'avaluació i els sabers bàsics s'alineen amb la normativa valenciana aplicable al curs i àrea indicats.
2. **Tractament de claus booleanes/opcionals (CCL1..CCEC4, DUA):**
   - Utilitza el valor `"on"` NOMÉS per a aquelles competències clau (descriptors operatius) i principis DUA (Design Universal for Learning) que realment es treballen de forma directa en la SA.
   - Per a les que NO es treballen, deixa el camp com una cadena buida `""` (o elimina la clau).
3. **Estructura dels camps de text:**
   - `sequencia`: Detalla la seqüència didàctica organitzada per sessions (ex: "Sessió 1: ..., Sessió 2: ...").
   - `avaluacio`: Especifica els instruments, eines i moments d'avaluació.
   - `mesuresII`, `mesuresIII`, `mesuresIV`: Proposa mesures d'atenció a la diversitat per a cada nivell d'inclusió educatiu segons la normativa valenciana.
   - Sigues breu, aporta total la informació sense afegir paraules innecessàries. 
4. **FORMAT D'EIXIDA STRICTE:**
   - La teua resposta ha de ser un objecte JSON vàlid.
   - NO utilitzis comentaris dins del JSON.
   - Pots utilitzar \n per als salts de línia en llistes. 

---
### PLANTILLA JSON D'EIXIDA (JSON SCHEMA):

{
  "curs": "",
  "area": "",
  "nivell": "",
  "n_sessions": "",
  "num_situacio": "",
  "titol": "",
  "context": "",
  "descripcio": "",
  "ods": "",
  "competencies": "",
  "criteris": "",
  "criteris_vinculats": "",
  "CCL1": "",
  "CCL2": "",
  "CCL3": "",
  "CCL4": "",
  "CCL5": "",
  "CP1": "",
  "CP2": "",
  "CP3": "",
  "STEM1": "",
  "STEM2": "",
  "STEM3": "",
  "STEM4": "",
  "STEM5": "",
  "CD1": "",
  "CD2": "",
  "CD3": "",
  "CD4": "",
  "CD5": "",
  "CPSAA1": "",
  "CPSAA2": "",
  "CPSAA3": "",
  "CPSAA4": "",
  "CPSAA5": "",
  "CC1": "",
  "CC2": "",
  "CC3": "",
  "CC4": "",
  "CE1": "",
  "CE2": "",
  "CE3": "",
  "CCEC1": "",
  "CCEC2": "",
  "CCEC3": "",
  "CCEC4": "",
  "sabers": "",
  "sequencia": "",
  "avaluacio": "",
  "mesuresII": "",
  "mesuresIII": "",
  "mesuresIV": "",
  "mot_acc_emoc": "",
  "mot_perspectiva": "",
  "mot_connexio": "",
  "mot_implicacio": "",
  "mot_autoregulacio": "",
  "mot_feedback": "",
  "rep_acces": "",
  "rep_formats": "",
  "rep_reflexio": "",
  "rep_models": "",
  "acc_expressio": "",
  "acc_seguiment": ""
}