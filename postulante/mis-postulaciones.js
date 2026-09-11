// ============================================================
// MIS POSTULACIONES - listado con estado
// ============================================================

async function cerrarSesion() {
  await Api.logout();
  window.location.href = "../login/login.html";
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

const ETIQUETAS_ESTADO_POSTULACION = {
  enviada: "Enviada",
  vista: "Vista por la empresa",
  rechazada: "Rechazada",
  contactado: "¡Te contactaron!",
};

function formatearFecha(fechaIso) {
  return new Date(fechaIso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function renderPostulaciones(postulaciones) {
  const contenedor = document.getElementById("lista-postulaciones");

  if (postulaciones.length === 0) {
    contenedor.innerHTML = `
      <div class="sin-postulaciones">
        <p>Todavía no te postulaste a ningún empleo.</p>
        <a href="../index.html" class="btn btn-primario" style="margin-top: 1rem; display: inline-block;">
          Ver empleos disponibles
        </a>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = postulaciones
    .map((p) => {
      const titulo = p.empleos?.titulo || "Empleo eliminado";
      const empresa = p.empleos?.perfiles_empresa?.nombre_empresa || "Empresa";

      return `
      <div class="postulacion-item">
        <div class="postulacion-info">
          <h3>${escaparHtml(titulo)}</h3>
          <p>${escaparHtml(empresa)}</p>
          <p>Postulado el ${formatearFecha(p.created_at)}</p>
        </div>
        <span class="etiqueta etiqueta-${p.estado}">${ETIQUETAS_ESTADO_POSTULACION[p.estado]}</span>
      </div>
    `;
    })
    .join("");
}

(async function init() {
  try {
    const usuario = await Api.getUsuarioActual();

    if (!usuario || usuario.tipo !== "postulante") {
      window.location.href = "../login/login.html";
      return;
    }

    const postulaciones = await Api.getMisPostulaciones(usuario.id);
    renderPostulaciones(postulaciones);

    document.getElementById("vista-cargando").classList.add("oculto");
    document.getElementById("vista-postulaciones").classList.remove("oculto");
  } catch (error) {
    console.error(error);
    window.location.href = "../login/login.html";
  }
})();
