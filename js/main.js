// ============================================================
// LISTADO PÚBLICO DE EMPLEOS (index.html)
// ============================================================

let todosLosEmpleos = [];

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function formatearSalario(desde, hasta) {
  const fmt = (n) => Number(n).toLocaleString("es-AR");
  if (desde && hasta) return `$${fmt(desde)} - $${fmt(hasta)}`;
  if (desde) return `Desde $${fmt(desde)}`;
  if (hasta) return `Hasta $${fmt(hasta)}`;
  return null;
}

const ETIQUETAS_MODALIDAD = {
  presencial: "Presencial",
  remoto: "Remoto",
  hibrido: "Híbrido",
};

function renderEmpleos(empleos) {
  const grid = document.getElementById("grid-empleos");

  if (empleos.length === 0) {
    grid.innerHTML = `
      <div class="estado-vacio" style="grid-column: 1 / -1;">
        <p>No hay empleos que coincidan con esos filtros por ahora.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = empleos
    .map((empleo) => {
      const nombreEmpresa =
        empleo.perfiles_empresa?.nombre_empresa || "Empresa";
      const salario = formatearSalario(
        empleo.salario_desde,
        empleo.salario_hasta,
      );

      return `
      <div class="empleo-card">
        <span class="empresa-nombre">${escaparHtml(nombreEmpresa)}</span>
        <h3>${escaparHtml(empleo.titulo)}</h3>
        <p class="empleo-desc">${escaparHtml(empleo.descripcion)}</p>
        <div class="empleo-tags">
          ${empleo.rubro ? `<span class="tag">${escaparHtml(empleo.rubro)}</span>` : ""}
          ${empleo.modalidad ? `<span class="tag">${ETIQUETAS_MODALIDAD[empleo.modalidad]}</span>` : ""}
        </div>
        ${salario ? `<span class="empleo-salario">${salario}</span>` : ""}
        <a href="empleo.html?id=${empleo.id}" class="btn btn-primario">Ver detalle</a>
      </div>
    `;
    })
    .join("");
}

function poblarFiltroRubros(empleos) {
  const select = document.getElementById("filtro-rubro");
  const rubros = [
    ...new Set(empleos.map((e) => e.rubro).filter(Boolean)),
  ].sort();

  rubros.forEach((rubro) => {
    const option = document.createElement("option");
    option.value = rubro;
    option.textContent = rubro;
    select.appendChild(option);
  });
}

function aplicarFiltros() {
  const rubro = document.getElementById("filtro-rubro").value;
  const modalidad = document.getElementById("filtro-modalidad").value;

  const filtrados = todosLosEmpleos.filter((empleo) => {
    if (rubro && empleo.rubro !== rubro) return false;
    if (modalidad && empleo.modalidad !== modalidad) return false;
    return true;
  });

  renderEmpleos(filtrados);
}

document
  .getElementById("filtro-rubro")
  .addEventListener("change", aplicarFiltros);
document
  .getElementById("filtro-modalidad")
  .addEventListener("change", aplicarFiltros);

async function cargarEmpleos() {
  try {
    todosLosEmpleos = await Api.getEmpleosPublicos();
    poblarFiltroRubros(todosLosEmpleos);
    renderEmpleos(todosLosEmpleos);
  } catch (error) {
    document.getElementById("grid-empleos").innerHTML = `
      <p class="mensaje-error" style="grid-column: 1 / -1; text-align: center;">
        No se pudieron cargar los empleos. Recargá la página.
      </p>
    `;
    console.error(error);
  }
}

// ---------- Nav dinámica según haya sesión activa o no ----------

async function actualizarNav() {
  const nav = document.getElementById("nav-links");

  try {
    const usuario = await Api.getUsuarioActual();

    if (!usuario) {
      nav.innerHTML = `<a href="login/login.html" class="btn btn-secundario">Ingresar</a>`;
      return;
    }

    const destinoPanel =
      usuario.tipo === "empresa"
        ? "empresa/dashboard.html"
        : usuario.tipo === "admin"
          ? "admin/panel.html"
          : "postulante/mis-postulaciones.html";

    nav.innerHTML = `
      <a href="${destinoPanel}">Mi panel</a>
      <button class="btn btn-secundario" onclick="cerrarSesionDesdeInicio()">Cerrar sesión</button>
    `;

    // Si es empresa, el botón del hero "Publicar un empleo" va directo a su dashboard
    if (usuario.tipo === "empresa") {
      document.getElementById("btn-publicar-hero").href =
        "empresa/dashboard.html";
    }
  } catch {
    nav.innerHTML = `<a href="login/login.html" class="btn btn-secundario">Ingresar</a>`;
  }
}

async function cerrarSesionDesdeInicio() {
  await Api.logout();
  window.location.reload();
}

// ---------- Init ----------

cargarEmpleos();
actualizarNav();
