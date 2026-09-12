// ============================================================
// PDF PREVIEW - renderiza la primera página de un PDF como thumbnail
// ============================================================
// Requiere que el script de pdf.js (UMD, vía CDN) ya esté cargado en
// la página ANTES de este archivo. Ver el <script> correspondiente en
// el HTML de cada página que lo usa.
//
// Uso:
//   <div id="mi-contenedor"></div>
//   <script>
//     PdfPreview.render('mi-contenedor', 'https://.../archivo.pdf');
//   </script>
// ============================================================

const PdfPreview = {
  _workerConfigurado: false,

  _configurarWorkerSiHaceFalta() {
    if (this._workerConfigurado) return;
    if (typeof pdfjsLib === "undefined") {
      console.error(
        "PdfPreview: pdfjsLib no está cargado. Agregá el <script> de pdf.js antes de este archivo.",
      );
      return;
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js";
    this._workerConfigurado = true;
  },

  // Renderiza la primera página del PDF en `url` dentro del elemento
  // con id `contenedorId`. Muestra un estado de carga mientras procesa,
  // y un fallback simple (ícono + link) si el PDF no se puede renderizar.
  async render(contenedorId, url, opciones = {}) {
    const escala = opciones.escala || 0.35;
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    this._configurarWorkerSiHaceFalta();
    contenedor.innerHTML = `<div class="pdf-preview-cargando">Cargando vista previa...</div>`;

    try {
      const pdf = await pdfjsLib.getDocument(url).promise;
      const pagina = await pdf.getPage(1);
      const viewport = pagina.getViewport({ scale: escala });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.className = "pdf-preview-canvas";

      const contexto = canvas.getContext("2d");
      await pagina.render({ canvasContext: contexto, viewport }).promise;

      contenedor.innerHTML = "";
      contenedor.appendChild(canvas);
    } catch (error) {
      console.error("PdfPreview: no se pudo renderizar el PDF", error);
      contenedor.innerHTML = `
        <div class="pdf-preview-fallback">
          <span>📄</span>
          <p>No se pudo mostrar la vista previa</p>
        </div>
      `;
    }
  },
};
