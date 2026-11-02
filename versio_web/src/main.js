import { exportFormToDocx } from "./docx-export.js";

document.addEventListener("DOMContentLoaded", function () {

  const ajustarTextarea = (textarea, extraPx = 0) => {
    if (!textarea || textarea.id === 'json') return;
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight + extraPx) + 'px';
  };

  const ajustarTodasTextareas = (extraPx = 0) => {
    document.querySelectorAll('textarea').forEach((textarea) => ajustarTextarea(textarea, extraPx));
  };

  const mmToPx = (mm) => {
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.height = '0';
    probe.style.width = '100mm';
    document.body.appendChild(probe);
    const pxPer100mm = probe.getBoundingClientRect().width;
    document.body.removeChild(probe);
    return (pxPer100mm / 100) * mm;
  };

  const crearCabeceraTemporal = () => {
    const bloque = document.createElement('div');
    bloque.className = 'print-page-header';

    const headerOriginal = document.querySelector('#header');
   
    if (headerOriginal) {
      const headerClonado = headerOriginal.cloneNode(true);
      headerClonado.removeAttribute('id');
      headerClonado.classList.add('print-header-main');
      bloque.appendChild(headerClonado);
    }

    

    return bloque;
  };

  const limpiarCabecerasTemporales = () => {
    document.querySelectorAll('.print-page-header').forEach(el => el.remove());
  };

  const insertarCabecerasPorAlturaDePagina = () => {
    limpiarCabecerasTemporales();

    const paginas = Array.from(document.querySelectorAll('#sa-form .pagina'));
    if (!paginas.length) return;

    const altoMaximoPagina = mmToPx(194);
    let acumulado = 0;

    paginas.forEach((pagina, index) => {
      const altoPagina = pagina.getBoundingClientRect().height;

      if (index === 0) {
        acumulado = altoPagina;
        return;
      }

      if (acumulado + altoPagina > altoMaximoPagina) {
        console.log(acumulado);
        
        const cabecera = crearCabeceraTemporal();
        console.log(cabecera);
        
        pagina.parentNode.insertBefore(cabecera, pagina);
        acumulado = cabecera.getBoundingClientRect().height + altoPagina;
      } else {
        acumulado += altoPagina;
      }
    });
  };

  const aplicarTextoPequenoParaImpresion = () => {
    document.querySelectorAll('#sa-form textarea').forEach(textarea => {
      textarea.dataset.prevFontSize = textarea.style.fontSize;
      textarea.dataset.prevLineHeight = textarea.style.lineHeight;
      textarea.style.fontSize = '0.85em';
      textarea.style.lineHeight = '1.2';
    });
     ajustarTodasTextareas(8);
  };

  const restaurarTextoTrasImpresion = () => {
    document.querySelectorAll('#sa-form textarea').forEach(textarea => {
      textarea.style.fontSize = textarea.dataset.prevFontSize || '';
      textarea.style.lineHeight = textarea.dataset.prevLineHeight || '';
      delete textarea.dataset.prevFontSize;
      delete textarea.dataset.prevLineHeight;
    });
     ajustarTodasTextareas();
  };

  const limpiarPreparacionImpresion = () => {
    restaurarTextoTrasImpresion();
    limpiarCabecerasTemporales();
  };

  document.querySelectorAll(".month-box").forEach(mb => mb.addEventListener("click", function (event) {
    console.log("Month changed to: ",  mb.ariaPressed);
    mb.ariaPressed = mb.ariaPressed == 'true' ? 'false' : 'true';
  })
  )

  document.querySelector('#exportar').addEventListener("click",()=>{
    const formulari = document.querySelector('#sa-form');
    const data = new FormData(formulari);
    const obj = Object.fromEntries(data.entries());
    // Also include unchecked checkboxes explicitly as empty so import can clear them
    formulari.querySelectorAll('input[type=checkbox]').forEach(cb=>{
      if (!(cb.name in obj)) {
        // unchecked checkboxes are absent from FormData; set empty string
        obj[cb.name] = "";
      }
    });
    const json = JSON.stringify(obj, null, 2);
    document.querySelector('#json').value = json;
    console.log("Exporting form data: ", obj);
    
  });

  document.querySelector('#importar').addEventListener("click",()=>{
    const jsonInput = document.querySelector('#json').value;
    try {
      const data = JSON.parse(jsonInput);
      const formulari = document.querySelector('#sa-form');
      // First reset all checkboxes to unchecked so missing keys become unchecked
      formulari.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.checked = false);

      for (const [key, value] of Object.entries(data)) {
        const input = formulari.elements[key];
        if (!input) continue;

        // Handle collections (RadioNodeList) or single elements
        if (input.length && input[0]) {
          // If it's a collection of checkboxes (same name), set checked for each
          if (input[0].type === 'checkbox') {
            for (let i = 0; i < input.length; i++) {
              input[i].checked = (value === 'on' || value === true || value === 'true');
            }
          } else {
            // Radios or other grouped inputs
            for (let i = 0; i < input.length; i++) {
              if (input[i].value == value) input[i].checked = true;
            }
          }
        } else if (input.type === 'checkbox') {
          input.checked = (value === 'on' || value === true || value === 'true');
        } else {
          input.value = value;
        }
      }
      ajustarTodasTextareas();
      console.log("Imported form data: ", data);
    } catch (e) {
      console.error("Invalid JSON input: ", e);
    }
  });

  document.querySelector('#prompt').addEventListener("click",()=>{
    document.querySelector('#json').value = `Eres un expert docent de la Comunitat Valenciana, especialitzat en el disseny curricular segons el marc normatiu vigent (LOMLOE i decrets autonòmics valencians).

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
   - Utilitza el valor "on" NOMÉS per a aquelles competències clau (descriptors operatius) i principis DUA (Design Universal for Learning) que realment es treballen de forma directa en la SA.
   - Per a les que NO es treballen, deixa el camp com una cadena buida "" (o elimina la clau).
3. **Estructura dels camps de text:**
   - sequencia: Detalla la seqüència didàctica organitzada per sessions (ex: "Sessió 1: ..., Sessió 2: ...").
   - avaluacio: Especifica els instruments, eines i moments d'avaluació.
   - mesuresII, mesuresIII, mesuresIV: Proposa mesures d'atenció a la diversitat per a cada nivell d'inclusió educatiu segons la normativa valenciana.
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
}`;
  }); 

  document.querySelector('#limpiar').addEventListener("click",()=>{
    const formulari = document.querySelector('#sa-form');
    formulari.reset();
    // Also clear all checkboxes explicitly
    formulari.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.checked = false);
    document.querySelector('#json').value = '';
    ajustarTodasTextareas();
  });

  document.querySelector('#imprimir').addEventListener('click', async (event) => {
    const boton = event.currentTarget;
    const textoOriginal = boton.textContent;

    boton.disabled = true;
    boton.textContent = 'Generant...';

    try {
      await exportFormToDocx();
    } catch (error) {
      console.error("Error generant el document Word:", error);
      alert("No s'ha pogut generar el document Word. Revisa la consola per a més detalls.");
    } finally {
      boton.disabled = false;
      boton.textContent = textoOriginal;
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.tagName.toLowerCase() === 'textarea') {
      ajustarTextarea(e.target);
    }
  });

  ajustarTodasTextareas();

});
