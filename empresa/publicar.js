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

  const item = document.createElement("div");
  item.className = "campo-formulario-item";
  item.id = id;
  item.innerHTML = `
    <div class="campo-formulario-fila">
      <input type="text" placeholder="Ej: ¿Tenés experiencia previa?" class="input-pregunta">
      <select class="input-tipo-pregunta" onchange="toggleOpcionesCampo('${id}')">
        <option value="texto">Respuesta libre</option>
        <option value="si_no">Sí / No</option>
        <option value="opcion_multiple">Opción múltiple</option>
      </select>
      <button type="button" class="btn-quitar-campo" onclick="quitarCampoFormulario('${id}')">✕</button>
    </div>
    <div class="campo-opciones-wrap oculto" id="${id}-opciones">
      <input type="text" placeholder="Opción 1" class="input-opcion">
      <input type="text" placeholder="Opción 2" class="input-opcion">
      <button type="button" class="btn-agregar-campo" style="padding:0.4rem 0.8rem; font-size:0.82rem;" onclick="agregarOpcion('${id}')">
        + Agregar opción
      </button>
    </div>
  `;
  lista.appendChild(item);
}

function toggleOpcionesCampo(id) {
  const item = document.getElementById(id);
  const tipo = item.querySelector(".input-tipo-pregunta").value;
  const opcionesWrap = document.getElementById(`${id}-opciones`);
  opcionesWrap.classList.toggle("oculto", tipo !== "opcion_multiple");
}

function agregarOpcion(id) {
  const opcionesWrap = document.getElementById(`${id}-opciones`);
  const boton = opcionesWrap.querySelector(".btn-agregar-campo");
  const cantidad = opcionesWrap.querySelectorAll(".input-opcion").length;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = `Opción ${cantidad + 1}`;
  input.className = "input-opcion";
  opcionesWrap.insertBefore(input, boton);
}

function quitarCampoFormulario(id) {
  document.getElementById(id).remove();
}

function recolectarCamposFormulario() {
  const items = document.querySelectorAll(".campo-formulario-item");
  const campos = [];

  items.forEach((item) => {
    const pregunta = item.querySelector(".input-pregunta").value.trim();
    const tipo = item.querySelector(".input-tipo-pregunta").value;
    if (!pregunta) return;

    const campo = { pregunta, tipo };

    if (tipo === "opcion_multiple") {
      const opciones = Array.from(item.querySelectorAll(".input-opcion"))
        .map((inp) => inp.value.trim())
        .filter((v) => v.length > 0);
      if (opciones.length < 2) return; // opción múltiple necesita al menos 2 opciones válidas
      campo.opciones = opciones;
    }

    campos.push(campo);
  });

  return campos;
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
