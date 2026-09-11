// ============================================================
// POSTULANTES DE UN EMPLEO - vista empresa
// ============================================================

let usuarioActual = null;
let empleoActual = null;

async function cerrarSesion() {
  await Api.logout();
  window.location.href = "../login/login.html";
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function getEmpleoIdDeUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("empleo");
}

function formatearFecha(fechaIso) {
  return new Date(fechaIso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const ETIQUETAS_ESTADO_POSTULACION = {
  enviada: "Enviada",
  vista: "Vista",
  rechazada: "Rechazada",
  contactado: "Contactado",
};

function renderRespuestasFormulario(respuestas) {
  if (!respuestas || respuestas.length === 0) return "";

  const items = respuestas
    .map(
      (r) => `
    <div class="respuesta-item">
      <p class="pregunta">${escaparHtml(r.pregunta)}</p>
      <p class="respuesta">${escaparHtml(r.respuesta || "(sin responder)")}</p>
    </div>
  `,
    )
    .join("");

  return `<div class="respuestas-formulario">${items}</div>`;
}

function renderPostulantes(postulaciones) {
  const contenedor = document.getElementById("lista-postulantes");

  if (postulaciones.length === 0) {
    contenedor.innerHTML = `
      <div class="sin-postulantes">
        <p>Todavía nadie se postuló a este empleo.</p>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = postulaciones
    .map((p) => {
      const perfil = p.perfiles_postulante;
      const nombre =
        perfil?.usuarios?.nombre_completo ||
        perfil?.usuarios?.email ||
        "Postulante";
      const habilidades = perfil?.habilidades || [];

      return `
      <div class="postulante-card" data-postulacion-id="${p.id}">
        <div class="postulante-card-top">
          <div class="postulante-datos">
            <h3>${escaparHtml(nombre)}</h3>
            ${perfil?.telefono ? `<p>📞 ${escaparHtml(perfil.telefono)}</p>` : ""}
            ${perfil?.ubicacion ? `<p>📍 ${escaparHtml(perfil.ubicacion)}</p>` : ""}
            ${perfil?.disponibilidad ? `<p>🕒 ${escaparHtml(perfil.disponibilidad)}</p>` : ""}
            ${perfil?.experiencia ? `<p>${escaparHtml(perfil.experiencia)}</p>` : ""}
            ${
              habilidades.length > 0
                ? `
              <div class="habilidades-mini">
                ${habilidades.map((h) => `<span>${escaparHtml(h)}</span>`).join("")}
              </div>
            `
                : ""
            }
            <p style="margin-top: 0.5rem;">Postulado el ${formatearFecha(p.created_at)}</p>
          </div>

          <div class="postulante-acciones">
            ${p.cv_usado_url ? `<a href="${p.cv_usado_url}" target="_blank" rel="noopener" class="btn-cv">Ver CV</a>` : ""}
            <select onchange="cambiarEstado('${p.id}', this.value)">
              <option value="enviada" ${p.estado === "enviada" ? "selected" : ""}>Enviada</option>
              <option value="vista" ${p.estado === "vista" ? "selected" : ""}>Vista</option>
              <option value="contactado" ${p.estado === "contactado" ? "selected" : ""}>Contactado</option>
              <option value="rechazada" ${p.estado === "rechazada" ? "selected" : ""}>Rechazada</option>
            </select>
          </div>
        </div>

        ${renderRespuestasFormulario(p.respuestas_formulario)}
      </div>
    `;
    })
    .join("");
}

async function cambiarEstado(postulacionId, nuevoEstado) {
  try {
    await Api.actualizarEstadoPostulacion(postulacionId, nuevoEstado);
  } catch (error) {
    console.error(error);
    alert(
      "No se pudo actualizar el estado. Recargá la página e intentá de nuevo.",
    );
  }
}

async function cargarPostulantes(empleoId) {
  try {
    const postulaciones = await Api.getPostulacionesDeEmpleo(empleoId);
    renderPostulantes(postulaciones);
  } catch (error) {
    console.error(error);
    document.getElementById("lista-postulantes").innerHTML = `
      <p class="mensaje-error">No se pudieron cargar los postulantes. Recargá la página.</p>
    `;
  }
}

// ---------- Init ----------

(async function init() {
  const empleoId = getEmpleoIdDeUrl();

  if (!empleoId) {
    window.location.href = "dashboard.html";
    return;
  }

  try {
    usuarioActual = await Api.getUsuarioActual();

    if (!usuarioActual || usuarioActual.tipo !== "empresa") {
      window.location.href = "../login/login.html";
      return;
    }

    empleoActual = await Api.getEmpleoPorId(empleoId);

    // La RLS ya impide leer postulaciones de empleos ajenos, pero
    // chequeamos acá también para dar un mensaje claro en vez de
    // una lista vacía sin explicación.
    if (empleoActual.empresa_id !== usuarioActual.id) {
      document.getElementById("vista-cargando").innerHTML = `
        <p>Este empleo no pertenece a tu empresa.</p>
        <a href="dashboard.html" class="btn btn-secundario" style="margin-top: 1rem; display: inline-block;">Volver</a>
      `;
      return;
    }

    document.getElementById("titulo-empleo").textContent =
      `Postulantes a: ${empleoActual.titulo}`;

    document.getElementById("vista-cargando").classList.add("oculto");
    document.getElementById("vista-postulantes").classList.remove("oculto");

    await cargarPostulantes(empleoId);
  } catch (error) {
    console.error(error);
    window.location.href = "dashboard.html";
  }
})();
