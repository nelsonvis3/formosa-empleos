// ============================================================
// PANEL ADMIN - verificación de rol + gestión de empresas pendientes
// ============================================================

async function cerrarSesion() {
  await Api.logout();
  window.location.href = "../login/login.html";
}

function mostrarVista(vista) {
  document.getElementById("vista-cargando").classList.add("oculto");
  document.getElementById("vista-no-autorizado").classList.add("oculto");
  document.getElementById("vista-panel").classList.add("oculto");
  document.getElementById(`vista-${vista}`).classList.remove("oculto");
}

function renderEmpresas(empresas) {
  const contenedor = document.getElementById("lista-empresas");

  if (empresas.length === 0) {
    contenedor.innerHTML = `
      <div class="sin-pendientes">
        <p>No hay empresas pendientes de aprobación por el momento.</p>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = empresas
    .map(
      (empresa) => `
    <div class="empresa-item" data-usuario-id="${empresa.usuario_id}">
      <div class="empresa-info">
        <h3>${escaparHtml(empresa.nombre_empresa)}</h3>
        <p><strong>Rubro:</strong> ${escaparHtml(empresa.rubro || "No especificado")}</p>
        <p><strong>CUIT:</strong> ${escaparHtml(empresa.cuit || "No especificado")}</p>
        <p><strong>Email:</strong> ${escaparHtml(empresa.usuarios?.email || "—")}</p>
        ${empresa.descripcion ? `<p>${escaparHtml(empresa.descripcion)}</p>` : ""}
      </div>
      <div class="empresa-acciones">
        <button class="btn-chico btn-aprobar" onclick="aprobarEmpresa('${empresa.usuario_id}')">
          Aprobar
        </button>
        <button class="btn-chico btn-rechazar" onclick="rechazarEmpresa('${empresa.usuario_id}')">
          Rechazar
        </button>
      </div>
    </div>
  `,
    )
    .join("");
}

// Previene inyección de HTML si una empresa carga datos con < > etc.
function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

async function cargarEmpresasPendientes() {
  try {
    const empresas = await Api.getEmpresasPendientes();
    renderEmpresas(empresas);
  } catch (error) {
    document.getElementById("lista-empresas").innerHTML = `
      <p class="mensaje-error">No se pudieron cargar las empresas. Recargá la página.</p>
    `;
    console.error(error);
  }
}

async function aprobarEmpresa(usuarioId) {
  const item = document.querySelector(`[data-usuario-id="${usuarioId}"]`);
  const botones = item.querySelectorAll("button");
  botones.forEach((b) => (b.disabled = true));

  try {
    await Api.cambiarEstadoEmpresa(usuarioId, "aprobada");
    item.remove();
    verificarListaVacia();
  } catch (error) {
    alert("No se pudo aprobar la empresa. Intentá de nuevo.");
    botones.forEach((b) => (b.disabled = false));
    console.error(error);
  }
}

async function rechazarEmpresa(usuarioId) {
  const confirmado = confirm("¿Seguro que querés rechazar esta empresa?");
  if (!confirmado) return;

  const item = document.querySelector(`[data-usuario-id="${usuarioId}"]`);
  const botones = item.querySelectorAll("button");
  botones.forEach((b) => (b.disabled = true));

  try {
    await Api.cambiarEstadoEmpresa(usuarioId, "rechazada");
    item.remove();
    verificarListaVacia();
  } catch (error) {
    alert("No se pudo rechazar la empresa. Intentá de nuevo.");
    botones.forEach((b) => (b.disabled = false));
    console.error(error);
  }
}

function verificarListaVacia() {
  const contenedor = document.getElementById("lista-empresas");
  if (contenedor.children.length === 0) {
    renderEmpresas([]);
  }
}

// ---------- Punto de entrada: verificar rol antes de mostrar nada ----------

(async function init() {
  try {
    const usuario = await Api.getUsuarioActual();

    if (!usuario || usuario.tipo !== "admin") {
      mostrarVista("no-autorizado");
      return;
    }

    mostrarVista("panel");
    await cargarEmpresasPendientes();
  } catch (error) {
    // Si getUsuarioActual falla, lo más probable es que no haya sesión activa
    window.location.href = "../login/login.html";
  }
})();
