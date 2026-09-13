// ============================================================
// CV VIEWER - tarjeta de CV + panel lateral con visor nativo del PDF
// ============================================================
// No usa pdf.js: algunos navegadores (Brave, por su bloqueo de
// telemetría interno) impiden cargar esa librería sin importar el CDN.
// En su lugar, usa el visor de PDF nativo del navegador dentro de un
// <iframe> — el mismo motor que abre un PDF si lo abrís directo, sin
// depender de ninguna librería externa que se pueda bloquear.
//
// Uso:
//   <div id="mi-contenedor"></div>
//   <script>
//     CvViewer.render('mi-contenedor', 'https://.../archivo.pdf', 'nombre-archivo.pdf');
//   </script>
// ============================================================

const CvViewer = {
  _contador: 0,

  // Extrae un nombre de archivo legible de la URL (que suele tener un
  // uuid + timestamp), para mostrar algo más prolijo que la ruta completa.
  _nombreCorto(url) {
    try {
      const partes = url.split("/").pop().split("-");
      return "CV.pdf";
    } catch {
      return "CV.pdf";
    }
  },

  render(contenedorId, url) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    this._contador++;
    const panelId = `cv-panel-${this._contador}`;

    contenedor.innerHTML = `
      <div class="cv-viewer-wrap">
        <button type="button" class="cv-tarjeta" onclick="CvViewer.toggle('${panelId}', '${url}')">
          <span class="cv-tarjeta-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <path d="M14 2v6h6"></path>
            </svg>
          </span>
          <span class="cv-tarjeta-texto">
            <strong>Curriculum Vitae</strong>
            <span>Click para ver</span>
          </span>
        </button>

        <div class="cv-panel oculto" id="${panelId}">
          <div class="cv-panel-header">
            <span>Vista previa del CV</span>
            <div class="cv-panel-acciones">
              <a href="${url}" download class="cv-panel-btn" title="Descargar" onclick="event.stopPropagation()">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </a>
              <button type="button" class="cv-panel-btn" title="Cerrar" onclick="CvViewer.cerrar('${panelId}')">✕</button>
            </div>
          </div>
          <iframe class="cv-panel-iframe" src="${url}"></iframe>
        </div>
      </div>
    `;
  },

  toggle(panelId, url) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.toggle("oculto");
  },

  cerrar(panelId) {
    document.getElementById(panelId)?.classList.add("oculto");
  },
};
