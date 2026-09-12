// ============================================================
// LISTADO + DETALLE DE EMPLEOS (index.html) - layout split
// ============================================================

let todosLosEmpleos = [];
let usuarioActual = null;
let empleoSeleccionadoId = null;

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

// Iniciales para el placeholder de logo cuando la empresa no subió uno
function inicialesDe(nombre) {
  if (!nombre) return "?";
  return nombre.trim().charAt(0).toUpperCase();
}

// ---------- Lista (columna izquierda) ----------

function renderLista(empleos) {
  const contenedor = document.getElementById("lista-scroll");

  if (empleos.length === 0) {
    contenedor.innerHTML = `<p class="estado-vacio">No hay empleos que coincidan con esos filtros.</p>`;
    return;
  }

  contenedor.innerHTML = empleos
    .map((empleo) => {
      const nombreEmpresa =
        empleo.perfiles_empresa?.nombre_empresa || "Empresa";
      const seleccionado =
        empleo.id === empleoSeleccionadoId ? "seleccionado" : "";

      return `
      <button class="empleo-item ${seleccionado}" data-id="${empleo.id}">
        <span class="empresa-nombre">${escaparHtml(nombreEmpresa)}</span>
        <h3>${escaparHtml(empleo.titulo)}</h3>
        <div class="empleo-meta">
          ${empleo.rubro ? `<span>${escaparHtml(empleo.rubro)}</span>` : ""}
          ${empleo.modalidad ? `<span>${ETIQUETAS_MODALIDAD[empleo.modalidad]}</span>` : ""}
        </div>
      </button>
    `;
    })
    .join("");

  contenedor.querySelectorAll(".empleo-item").forEach((el) => {
    el.addEventListener("click", () => seleccionarEmpleo(el.dataset.id));
  });
}

function poblarFiltroRubros(empleos) {
  const select = document.getElementById("filtro-rubro");
  const valorActual = select.value;
  const rubros = [
    ...new Set(empleos.map((e) => e.rubro).filter(Boolean)),
  ].sort();

  select.innerHTML =
    `<option value="">Todos los rubros</option>` +
    rubros
      .map(
        (r) => `<option value="${escaparHtml(r)}">${escaparHtml(r)}</option>`,
      )
      .join("");
  select.value = valorActual;
}

function aplicarFiltros() {
  const rubro = document.getElementById("filtro-rubro").value;
  const modalidad = document.getElementById("filtro-modalidad").value;

  const filtrados = todosLosEmpleos.filter((empleo) => {
    if (rubro && empleo.rubro !== rubro) return false;
    if (modalidad && empleo.modalidad !== modalidad) return false;
    return true;
  });

  renderLista(filtrados);
}

document
  .getElementById("filtro-rubro")
  .addEventListener("change", aplicarFiltros);
document
  .getElementById("filtro-modalidad")
  .addEventListener("change", aplicarFiltros);

// ---------- Selección de empleo (sin recargar página) ----------

async function seleccionarEmpleo(empleoId, actualizarUrl = true) {
  empleoSeleccionadoId = empleoId;

  document.querySelectorAll(".empleo-item").forEach((el) => {
    el.classList.toggle("seleccionado", el.dataset.id === empleoId);
  });

  if (actualizarUrl) {
    history.pushState({ empleoId }, "", `?id=${empleoId}`);
  }

  document.getElementById("sin-seleccion").classList.add("oculto");
  const detalle = document.getElementById("detalle-contenido");
  detalle.classList.remove("oculto");
  detalle.innerHTML = `<p class="estado-vacio">Cargando...</p>`;

  // En mobile, mostrar el detalle oculta la lista (se vuelve con el botón atrás del navegador)
  document.getElementById("col-lista").classList.add("detalle-abierto");

  let empleo;
  try {
    empleo = await Api.getEmpleoPorId(empleoId);
  } catch (error) {
    console.error(error);
    detalle.innerHTML = `<p class="mensaje-error">No se pudo cargar este empleo.</p>`;
    return;
  }

  renderDetalle(empleo);
}

function renderDetalle(empleo) {
  const detalle = document.getElementById("detalle-contenido");
  const empresa = empleo.perfiles_empresa || {};
  const salario = formatearSalario(empleo.salario_desde, empleo.salario_hasta);

  detalle.innerHTML = `
    <div class="detalle-empresa-header">
      <div class="empresa-logo">
        ${
          empresa.logo_url
            ? `<img src="${empresa.logo_url}" alt="">`
            : inicialesDe(empresa.nombre_empresa)
        }
      </div>
      <span class="empresa-nombre">${escaparHtml(empresa.nombre_empresa || "Empresa")}</span>
    </div>

    <div class="detalle-header">
      <h1>${escaparHtml(empleo.titulo)}</h1>
      <div class="detalle-tags">
        ${empleo.rubro ? `<span class="tag">${escaparHtml(empleo.rubro)}</span>` : ""}
        ${empleo.modalidad ? `<span class="tag">${ETIQUETAS_MODALIDAD[empleo.modalidad]}</span>` : ""}
      </div>
      ${salario ? `<p class="detalle-salario">${salario}</p>` : ""}
    </div>

    <p class="detalle-descripcion">${escaparHtml(empleo.descripcion)}</p>

    <div class="empresa-box">
      <p>${escaparHtml(empresa.descripcion || "Sin descripción de la empresa.")}</p>
      ${
        empresa.sitio_web || empresa.red_social || empresa.direccion
          ? `
        <div class="empresa-links">
          ${empresa.sitio_web ? `<a href="${escaparHtml(empresa.sitio_web)}" target="_blank" rel="noopener">Sitio web</a>` : ""}
          ${empresa.red_social ? `<a href="${escaparHtml(empresa.red_social)}" target="_blank" rel="noopener">Redes</a>` : ""}
          ${empresa.direccion ? `<span>${escaparHtml(empresa.direccion)}</span>` : ""}
        </div>
      `
          : ""
      }
    </div>

    <div class="postulacion-box" id="caja-postulacion"></div>
  `;

  renderCajaPostulacion(empleo);
}

// ---------- Caja de postulación ----------

function renderCajaSinSesion() {
  document.getElementById("caja-postulacion").innerHTML = `
    <h3>¿Te interesa este empleo?</h3>
    <p style="color: var(--gris); font-size: 0.88rem; margin-bottom: 1rem;">Iniciá sesión como postulante para postularte.</p>
    <a href="login/login.html" class="btn btn-primario">Iniciar sesión</a>
  `;
}

function renderCajaNoEsPostulante() {
  document.getElementById("caja-postulacion").innerHTML = `
    <p style="color: var(--gris); font-size: 0.88rem;">Esta cuenta no puede postularse a empleos.</p>
  `;
}

function renderCajaYaPostulado() {
  document.getElementById("caja-postulacion").innerHTML = `
    <div class="estado-ya-postulado">✓ Ya te postulaste a este empleo</div>
    <p style="color: var(--gris); font-size: 0.85rem; margin-top: 0.5rem;">
      La empresa va a revisar tu postulación. Podés ver el estado desde tu panel.
    </p>
  `;
}

function renderCajaPostulacionDirecta(empleoId) {
  document.getElementById("caja-postulacion").innerHTML = `
    <h3>Postularme a este empleo</h3>
    <p style="color: var(--gris); font-size: 0.85rem; margin-bottom: 1rem;">
      Se va a enviar tu perfil y CV cargados en tu cuenta.
    </p>
    <button class="btn btn-primario" id="btn-postular-directo">Postularme</button>
    <p class="mensaje-error oculto" id="error-postular"></p>
  `;

  document
    .getElementById("btn-postular-directo")
    .addEventListener("click", async (e) => {
      const boton = e.target;
      boton.disabled = true;
      boton.textContent = "Enviando...";

      try {
        const perfil = await Api.getPerfilPostulante(usuarioActual.id);
        await Api.postularse({
          empleoId,
          postulanteId: usuarioActual.id,
          cvUsadoUrl: perfil.cv_url || null,
        });
        renderCajaYaPostulado();
      } catch (error) {
        console.error(error);
        document.getElementById("error-postular").textContent =
          "No se pudo enviar la postulación. Intentá de nuevo.";
        document.getElementById("error-postular").classList.remove("oculto");
        boton.disabled = false;
        boton.textContent = "Postularme";
      }
    });
}

// Renderiza el input correcto según el tipo de pregunta (texto / si_no / opcion_multiple)
function renderInputPregunta(campo, index) {
  const inputId = `pregunta-${index}`;

  if (campo.tipo === "si_no") {
    return `
      <div class="campo">
        <label>${escaparHtml(campo.pregunta)}</label>
        <div style="display:flex; gap:1.2rem; margin-top:0.3rem;">
          <label style="display:flex; align-items:center; gap:0.4rem; font-weight:400; font-size:0.9rem;">
            <input type="radio" name="${inputId}" value="Sí" required style="width:auto;"> Sí
          </label>
          <label style="display:flex; align-items:center; gap:0.4rem; font-weight:400; font-size:0.9rem;">
            <input type="radio" name="${inputId}" value="No" style="width:auto;"> No
          </label>
        </div>
      </div>
    `;
  }

  if (campo.tipo === "opcion_multiple" && Array.isArray(campo.opciones)) {
    return `
      <div class="campo">
        <label for="${inputId}">${escaparHtml(campo.pregunta)}</label>
        <select id="${inputId}" required>
          <option value="" disabled selected>Elegí una opción</option>
          ${campo.opciones.map((op) => `<option value="${escaparHtml(op)}">${escaparHtml(op)}</option>`).join("")}
        </select>
      </div>
    `;
  }

  // Default: texto libre
  return `
    <div class="campo">
      <label for="${inputId}">${escaparHtml(campo.pregunta)}</label>
      <textarea id="${inputId}" required style="min-height: 70px;"></textarea>
    </div>
  `;
}

function leerRespuestaPregunta(campo, index) {
  const inputId = `pregunta-${index}`;

  if (campo.tipo === "si_no") {
    const marcado = document.querySelector(`input[name="${inputId}"]:checked`);
    return marcado ? marcado.value : "";
  }

  return document.getElementById(inputId).value.trim();
}

function renderCajaConFormulario(empleoId, camposFormulario) {
  const preguntasHtml = camposFormulario
    .map((campo, i) => renderInputPregunta(campo, i))
    .join("");

  document.getElementById("caja-postulacion").innerHTML = `
    <h3>Postularme a este empleo</h3>
    <p style="color: var(--gris); font-size: 0.85rem; margin-bottom: 1rem;">
      Esta empresa pide que respondas algunas preguntas antes de postularte.
    </p>
    <form id="form-postulacion-formulario">
      ${preguntasHtml}
      <button type="submit" class="btn btn-primario">Enviar postulación</button>
      <p class="mensaje-error oculto" id="error-postular"></p>
    </form>
  `;

  document
    .getElementById("form-postulacion-formulario")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const boton = e.target.querySelector("button[type=submit]");
      boton.disabled = true;
      boton.textContent = "Enviando...";

      const respuestas = camposFormulario.map((campo, i) => ({
        pregunta: campo.pregunta,
        tipo: campo.tipo || "texto",
        respuesta: leerRespuestaPregunta(campo, i),
      }));

      try {
        const perfil = await Api.getPerfilPostulante(usuarioActual.id);
        await Api.postularse({
          empleoId,
          postulanteId: usuarioActual.id,
          respuestasFormulario: respuestas,
          cvUsadoUrl: perfil.cv_url || null,
        });
        renderCajaYaPostulado();
      } catch (error) {
        console.error(error);
        document.getElementById("error-postular").textContent =
          "No se pudo enviar la postulación. Intentá de nuevo.";
        document.getElementById("error-postular").classList.remove("oculto");
        boton.disabled = false;
        boton.textContent = "Enviar postulación";
      }
    });
}

async function renderCajaPostulacion(empleo) {
  if (!usuarioActual) {
    renderCajaSinSesion();
    return;
  }

  if (usuarioActual.tipo !== "postulante") {
    renderCajaNoEsPostulante();
    return;
  }

  const yaPostulado = await Api.yaSePostulo(empleo.id, usuarioActual.id);
  if (yaPostulado) {
    renderCajaYaPostulado();
    return;
  }

  if (empleo.requiere_formulario && empleo.campos_formulario?.length > 0) {
    renderCajaConFormulario(empleo.id, empleo.campos_formulario);
  } else {
    renderCajaPostulacionDirecta(empleo.id);
  }
}

// ---------- Nav dinámica ----------

async function actualizarNav() {
  const nav = document.getElementById("nav-links");

  if (!usuarioActual) {
    nav.innerHTML = `<a href="login/login.html" class="btn btn-secundario">Ingresar</a>`;
    return;
  }

  const destinoPanel =
    usuarioActual.tipo === "empresa"
      ? "empresa/dashboard.html"
      : usuarioActual.tipo === "admin"
        ? "admin/panel.html"
        : "postulante/mis-postulaciones.html";

  nav.innerHTML = `
    <a href="${destinoPanel}">Mi panel</a>
    <button class="btn btn-secundario" onclick="cerrarSesionDesdeInicio()">Cerrar sesión</button>
  `;
}

async function cerrarSesionDesdeInicio() {
  await Api.logout();
  window.location.reload();
}

// Volver de "detalle abierto" a la lista en mobile, con el botón atrás
window.addEventListener("popstate", (e) => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) {
    seleccionarEmpleo(id, false);
  } else {
    empleoSeleccionadoId = null;
    document.getElementById("col-lista").classList.remove("detalle-abierto");
    document.getElementById("sin-seleccion").classList.remove("oculto");
    document.getElementById("detalle-contenido").classList.add("oculto");
  }
});

// ---------- Init ----------

async function init() {
  try {
    usuarioActual = await Api.getUsuarioActual();
  } catch {
    usuarioActual = null;
  }

  await actualizarNav();

  try {
    todosLosEmpleos = await Api.getEmpleosPublicos();
    poblarFiltroRubros(todosLosEmpleos);
    renderLista(todosLosEmpleos);
  } catch (error) {
    console.error(error);
    document.getElementById("lista-scroll").innerHTML =
      `<p class="mensaje-error" style="padding: 1.5rem;">No se pudieron cargar los empleos.</p>`;
    return;
  }

  // Si la URL ya trae ?id=..., abrir ese empleo directo (permite compartir el link)
  const params = new URLSearchParams(window.location.search);
  const idInicial = params.get("id");
  if (idInicial) {
    seleccionarEmpleo(idInicial, false);
  }
}

init();
