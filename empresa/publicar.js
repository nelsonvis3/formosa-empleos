// ============================================================
// PUBLICAR EMPLEO - formulario con campos dinámicos opcionales
// ============================================================

let usuarioActual = null;
let contadorCampos = 0;

function toggleFormularioPersonalizado() {
  const activo = document.getElementById("requiere_formulario").checked;
  const seccion = document.getElementById("seccion-campos-formulario");
  seccion.classList.toggle("oculto", !activo);

  // Si se activa y todavía no hay ningún campo cargado, agregamos uno de arranque
  if (
    activo &&
    document.getElementById("campos-formulario-lista").children.length === 0
  ) {
    agregarCampoFormulario();
  }
}

function agregarCampoFormulario() {
  contadorCampos++;
  const id = `campo-${contadorCampos}`;
  const lista = document.getElementById("campos-formulario-lista");

  const fila = document.createElement("div");
  fila.className = "campo-formulario-fila";
  fila.id = id;
  fila.innerHTML = `
    <input type="text" placeholder="Ej: ¿Tenés experiencia previa?" class="input-pregunta">
    <button type="button" class="btn-quitar-campo" onclick="quitarCampoFormulario('${id}')">✕</button>
  `;
  lista.appendChild(fila);
}

function quitarCampoFormulario(id) {
  document.getElementById(id).remove();
}

function recolectarCamposFormulario() {
  const preguntas = Array.from(document.querySelectorAll(".input-pregunta"))
    .map((input) => input.value.trim())
    .filter((texto) => texto.length > 0);

  return preguntas.map((pregunta) => ({ pregunta, tipo: "texto" }));
}

function mostrarError(mensaje) {
  const el = document.getElementById("error-publicar");
  el.textContent = mensaje;
  el.classList.remove("oculto");
}

document
  .getElementById("form-publicar")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    document.getElementById("error-publicar").classList.add("oculto");

    const requiereFormulario = document.getElementById(
      "requiere_formulario",
    ).checked;
    const camposFormulario = requiereFormulario
      ? recolectarCamposFormulario()
      : null;

    if (requiereFormulario && camposFormulario.length === 0) {
      mostrarError(
        "Agregá al menos una pregunta, o desactivá el formulario personalizado.",
      );
      return;
    }

    const salarioDesde = document.getElementById("salario_desde").value;
    const salarioHasta = document.getElementById("salario_hasta").value;

    const nuevoEmpleo = {
      empresa_id: usuarioActual.id,
      titulo: document.getElementById("titulo").value.trim(),
      descripcion: document.getElementById("descripcion").value.trim(),
      rubro: document.getElementById("rubro").value.trim() || null,
      modalidad: document.getElementById("modalidad").value,
      salario_desde: salarioDesde ? Number(salarioDesde) : null,
      salario_hasta: salarioHasta ? Number(salarioHasta) : null,
      requiere_formulario: requiereFormulario,
      campos_formulario: camposFormulario,
    };

    const boton = e.target.querySelector("button[type=submit]");
    boton.disabled = true;
    boton.textContent = "Publicando...";

    try {
      await Api.crearEmpleo(nuevoEmpleo);
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error(error);
      if (
        error?.message?.includes("row-level security") ||
        error?.code === "42501"
      ) {
        mostrarError(
          "Tu empresa todavía no está aprobada para publicar empleos.",
        );
      } else {
        mostrarError("No se pudo publicar el empleo. Intentá de nuevo.");
      }
      boton.disabled = false;
      boton.textContent = "Publicar empleo";
    }
  });

// ---------- Verificar sesión y permiso antes de mostrar el formulario ----------

(async function init() {
  try {
    usuarioActual = await Api.getUsuarioActual();

    if (!usuarioActual || usuarioActual.tipo !== "empresa") {
      window.location.href = "../login/login.html";
      return;
    }

    const perfil = await Api.getPerfilEmpresa(usuarioActual.id);
    if (perfil.estado !== "aprobada") {
      alert(
        "Tu empresa todavía no está aprobada. No podés publicar empleos por ahora.",
      );
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    console.error(error);
    window.location.href = "../login/login.html";
  }
})();
