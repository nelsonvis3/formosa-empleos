// ============================================================
// DASHBOARD EMPRESA - estado de aprobación + lista de empleos propios
// ============================================================

let usuarioActual = null;
let perfilEmpresaActual = null;

async function cerrarSesion() {
  await Api.logout();
  window.location.href = "../login/login.html";
}

function irAPublicar() {
  window.location.href = "publicar.html";
}

const ETIQUETAS_ESTADO = {
  activo: "Activo",
  pausado: "Pausado",
  cerrado: "Cerrado",
};

function renderBannerEstado(estadoEmpresa) {
  const banner = document.getElementById("banner-estado");

  if (estadoEmpresa === "pendiente") {
    banner.innerHTML = `
      <div class="estado-banner pendiente">
        Tu empresa está <strong>pendiente de aprobación</strong>. Vas a poder
        publicar empleos apenas un administrador la apruebe. Te avisamos por email.
      </div>
    `;
    document.getElementById("btn-publicar").disabled = true;
    document.getElementById("btn-publicar").title =
      "Necesitás estar aprobado para publicar";
  } else if (estadoEmpresa === "rechazada") {
    banner.innerHTML = `
      <div class="estado-banner rechazada">
        Tu empresa fue <strong>rechazada</strong>. Si creés que es un error,
        contactanos para revisar tu caso.
      </div>
    `;
    document.getElementById("btn-publicar").disabled = true;
  } else {
    banner.innerHTML = "";
  }
}

function renderEmpleos(empleos) {
  const contenedor = document.getElementById("lista-empleos");

  if (empleos.length === 0) {
    contenedor.innerHTML = `
      <div class="sin-empleos">
        <p>Todavía no publicaste ningún empleo.</p>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = empleos
    .map(
      (empleo) => `
    <div class="empleo-item" data-empleo-id="${empleo.id}">
      <div class="empleo-info">
        <h3>${escaparHtml(empleo.titulo)}</h3>
        <p>${escaparHtml(empleo.rubro || "")} · ${escaparHtml(empleo.modalidad || "")}</p>
        <div class="empleo-meta">
          <span class="etiqueta etiqueta-${empleo.estado}">${ETIQUETAS_ESTADO[empleo.estado]}</span>
        </div>
      </div>
      <div class="empleo-acciones">
        <button class="btn-chico" onclick="verPostulantes('${empleo.id}')">Ver postulantes</button>
        ${
          empleo.estado === "activo"
            ? `<button class="btn-chico" onclick="cambiarEstadoEmpleo('${empleo.id}', 'pausado')">Pausar</button>`
            : empleo.estado === "pausado"
              ? `<button class="btn-chico" onclick="cambiarEstadoEmpleo('${empleo.id}', 'activo')">Reactivar</button>`
              : ""
        }
      </div>
    </div>
  `,
    )
    .join("");
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function verPostulantes(empleoId) {
  window.location.href = `postulantes.html?empleo=${empleoId}`;
}

async function cambiarEstadoEmpleo(empleoId, nuevoEstado) {
  try {
    await Api.actualizarEmpleo(empleoId, { estado: nuevoEstado });
    await cargarEmpleos();
  } catch (error) {
    alert("No se pudo actualizar el empleo. Intentá de nuevo.");
    console.error(error);
  }
}

async function cargarEmpleos() {
  try {
    const empleos = await Api.getMisEmpleos(usuarioActual.id);
    renderEmpleos(empleos);
  } catch (error) {
    document.getElementById("lista-empleos").innerHTML = `
      <p class="mensaje-error">No se pudieron cargar tus empleos. Recargá la página.</p>
    `;
    console.error(error);
  }
}

// ---------- Punto de entrada ----------

(async function init() {
  try {
    usuarioActual = await Api.getUsuarioActual();

    if (!usuarioActual || usuarioActual.tipo !== "empresa") {
      window.location.href = "../login/login.html";
      return;
    }

    perfilEmpresaActual = await Api.getPerfilEmpresa(usuarioActual.id);

    document.getElementById("titulo-empresa").textContent =
      `${perfilEmpresaActual.nombre_empresa} — Mis empleos`;

    renderBannerEstado(perfilEmpresaActual.estado);

    document.getElementById("vista-cargando").classList.add("oculto");
    document.getElementById("vista-dashboard").classList.remove("oculto");

    await cargarEmpleos();
  } catch (error) {
    console.error(error);
    window.location.href = "../login/login.html";
  }
})();
