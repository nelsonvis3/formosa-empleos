// ============================================================
// DETALLE DE EMPLEO - render + lógica de postulación
// ============================================================

let empleoActual = null;
let usuarioActual = null;

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function getEmpleoIdDeUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
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

function renderDetalleEmpleo(empleo) {
  document.getElementById("empleo-empresa").textContent =
    empleo.perfiles_empresa?.nombre_empresa || "Empresa";
  document.getElementById("empleo-titulo").textContent = empleo.titulo;
  document.getElementById("empleo-descripcion").textContent =
    empleo.descripcion;

  const tags = document.getElementById("empleo-tags");
  tags.innerHTML = [
    empleo.rubro ? `<span class="tag">${escaparHtml(empleo.rubro)}</span>` : "",
    empleo.modalidad
      ? `<span class="tag">${ETIQUETAS_MODALIDAD[empleo.modalidad]}</span>`
      : "",
  ].join("");

  const salario = formatearSalario(empleo.salario_desde, empleo.salario_hasta);
  if (salario) {
    document.getElementById("empleo-salario").textContent = salario;
    document.getElementById("empleo-salario").classList.remove("oculto");
  }

  document.getElementById("empresa-nombre-box").textContent =
    empleo.perfiles_empresa?.nombre_empresa || "";
  document.getElementById("empresa-descripcion-box").textContent =
    empleo.perfiles_empresa?.descripcion || "Sin descripción de la empresa.";

  document.title = `${empleo.titulo} - Formosa Empleos`;
}

// ---------- Caja de postulación: distintos estados según usuario/empleo ----------

function renderCajaSinSesion() {
  document.getElementById("caja-postulacion").innerHTML = `
    <h3>¿Te interesa este empleo?</h3>
    <p style="color: var(--gris); margin-bottom: 1rem;">Iniciá sesión como postulante para postularte.</p>
    <a href="login/login.html" class="btn btn-primario">Iniciar sesión</a>
  `;
}

function renderCajaNoEsPostulante() {
  document.getElementById("caja-postulacion").innerHTML = `
    <p style="color: var(--gris);">Esta cuenta no puede postularse a empleos.</p>
  `;
}

function renderCajaYaPostulado() {
  document.getElementById("caja-postulacion").innerHTML = `
    <div class="estado-ya-postulado">✓ Ya te postulaste a este empleo</div>
    <p style="color: var(--gris); font-size: 0.9rem; margin-top: 0.5rem;">
      La empresa va a revisar tu postulación. Podés ver el estado desde tu panel.
    </p>
  `;
}

function renderCajaPostulacionDirecta() {
  document.getElementById("caja-postulacion").innerHTML = `
    <h3>Postularme a este empleo</h3>
    <p style="color: var(--gris); font-size: 0.9rem; margin-bottom: 1rem;">
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
          empleoId: empleoActual.id,
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

function renderCajaConFormulario(camposFormulario) {
  const preguntasHtml = camposFormulario
    .map(
      (campo, i) => `
    <div class="campo">
      <label for="pregunta-${i}">${escaparHtml(campo.pregunta)}</label>
      <textarea id="pregunta-${i}" required style="min-height: 70px;"></textarea>
    </div>
  `,
    )
    .join("");

  document.getElementById("caja-postulacion").innerHTML = `
    <h3>Postularme a este empleo</h3>
    <p style="color: var(--gris); font-size: 0.9rem; margin-bottom: 1rem;">
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
        respuesta: document.getElementById(`pregunta-${i}`).value.trim(),
      }));

      try {
        const perfil = await Api.getPerfilPostulante(usuarioActual.id);
        await Api.postularse({
          empleoId: empleoActual.id,
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

async function renderCajaPostulacion() {
  if (!usuarioActual) {
    renderCajaSinSesion();
    return;
  }

  if (usuarioActual.tipo !== "postulante") {
    renderCajaNoEsPostulante();
    return;
  }

  const yaPostulado = await Api.yaSePostulo(empleoActual.id, usuarioActual.id);
  if (yaPostulado) {
    renderCajaYaPostulado();
    return;
  }

  if (
    empleoActual.requiere_formulario &&
    empleoActual.campos_formulario?.length > 0
  ) {
    renderCajaConFormulario(empleoActual.campos_formulario);
  } else {
    renderCajaPostulacionDirecta();
  }
}

// ---------- Nav dinámica (igual que en index.html) ----------

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

  nav.innerHTML = `<a href="${destinoPanel}">Mi panel</a>`;
}

// ---------- Init ----------

(async function init() {
  const empleoId = getEmpleoIdDeUrl();

  if (!empleoId) {
    window.location.href = "index.html";
    return;
  }

  try {
    usuarioActual = await Api.getUsuarioActual();
  } catch {
    usuarioActual = null;
  }

  try {
    empleoActual = await Api.getEmpleoPorId(empleoId);
  } catch (error) {
    console.error(error);
    document.getElementById("vista-cargando").innerHTML = `
      <p>No se encontró este empleo, o ya no está disponible.</p>
      <a href="index.html" class="btn btn-secundario" style="margin-top: 1rem; display: inline-block;">Volver al listado</a>
    `;
    return;
  }

  renderDetalleEmpleo(empleoActual);
  await renderCajaPostulacion();
  await actualizarNav();

  document.getElementById("vista-cargando").classList.add("oculto");
  document.getElementById("vista-detalle").classList.remove("oculto");
})();
