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

  document.querySelector('#limpiar').addEventListener("click",()=>{
    const formulari = document.querySelector('#sa-form');
    formulari.reset();
    // Also clear all checkboxes explicitly
    formulari.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.checked = false);
    document.querySelector('#json').value = '';
    ajustarTodasTextareas();
  });

  document.querySelector('#imprimir').addEventListener('click', () => {
    aplicarTextoPequenoParaImpresion();
    insertarCabecerasPorAlturaDePagina();

    window.addEventListener('afterprint', limpiarPreparacionImpresion, { once: true });
    requestAnimationFrame(() => {
      ajustarTodasTextareas(8);
      window.print();
    });

    setTimeout(limpiarPreparacionImpresion, 3000);
  });

  document.addEventListener('input', function (e) {
    if (e.target.tagName.toLowerCase() === 'textarea') {
      ajustarTextarea(e.target);
    }
  });

  ajustarTodasTextareas();

});
