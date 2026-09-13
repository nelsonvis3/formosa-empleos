// ============================================================
// PERFIL POSTULANTE - datos + habilidades + subida de CV
// ============================================================

let usuarioActual = null;
let perfilActual = null;
let habilidadesActuales = [];

async function cerrarSesion() {
  await Api.logout();
  window.location.href = "../login/login.html";
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// ---------- CV ----------

function renderCvBox() {
  const box = document.getElementById("cv-box");
  const previewWrap = document.getElementById("cv-preview-wrap");

  if (perfilActual.cv_url) {
    box.className = "cv-box";
    box.innerHTML = `
      <div class="cv-box-estado">
        <span class="cv-box-check">✓</span>
        <span>CV cargado con éxito</span>
      </div>
      <label class="cv-box-link" style="cursor:pointer;">
        Reemplazar
        <input type="file" id="input-cv" accept="application/pdf" style="display:none;">
      </label>
    `;
    previewWrap.classList.remove("oculto");
    CvViewer.render("cv-preview", perfilActual.cv_url);
  } else {
    previewWrap.classList.add("oculto");
    box.className = "cv-box sin-cv";
    box.innerHTML = `
      <div class="cv-box-estado">
        <span>Todavía no subiste tu CV</span>
      </div>
      <label class="btn btn-primario" style="cursor:pointer;">
        Subir CV (PDF)
        <input type="file" id="input-cv" accept="application/pdf" style="display:none;">
      </label>
    `;
  }

  document.getElementById("input-cv").addEventListener("change", subirCv);
}

async function subirCv(e) {
  const archivo = e.target.files[0];
  if (!archivo) return;

  if (archivo.type !== "application/pdf") {
    alert("El CV tiene que ser un archivo PDF.");
    return;
  }
  if (archivo.size > 5 * 1024 * 1024) {
    alert("El archivo no puede pesar más de 5MB.");
    return;
  }

  const box = document.getElementById("cv-box");
  box.innerHTML = "<p>Subiendo CV...</p>";

  try {
    const url = await Api.subirCV(usuarioActual.id, archivo);
    await Api.actualizarPerfilPostulante(usuarioActual.id, { cv_url: url });
    perfilActual.cv_url = url;
    renderCvBox();
  } catch (error) {
    console.error(error);
    alert("No se pudo subir el CV. Intentá de nuevo.");
    renderCvBox();
  }
}

// ---------- Habilidades (tags) ----------

function renderHabilidades() {
  const lista = document.getElementById("lista-habilidades");
  lista.innerHTML = habilidadesActuales
    .map(
      (h, i) => `
    <span class="habilidad-tag">
      ${escaparHtml(h)}
      <button type="button" onclick="quitarHabilidad(${i})">✕</button>
    </span>
  `,
    )
    .join("");
}

function agregarHabilidad() {
  const input = document.getElementById("input-nueva-habilidad");
  const valor = input.value.trim();
  if (!valor) return;
  if (habilidadesActuales.includes(valor)) {
    input.value = "";
    return;
  }
  habilidadesActuales.push(valor);
  input.value = "";
  renderHabilidades();
}

function quitarHabilidad(index) {
  habilidadesActuales.splice(index, 1);
  renderHabilidades();
}

// Permitir agregar habilidad con Enter, sin submitear el form completo
document
  .getElementById("input-nueva-habilidad")
  ?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      agregarHabilidad();
    }
  });

// ---------- Form principal ----------

function llenarFormulario() {
  document.getElementById("telefono").value = perfilActual.telefono || "";
  document.getElementById("ubicacion").value = perfilActual.ubicacion || "";
  document.getElementById("experiencia").value = perfilActual.experiencia || "";
  document.getElementById("disponibilidad").value =
    perfilActual.disponibilidad || "";
  habilidadesActuales = perfilActual.habilidades || [];
  renderHabilidades();
}

document.getElementById("form-perfil").addEventListener("submit", async (e) => {
  e.preventDefault();
  document.getElementById("error-perfil").classList.add("oculto");
  document.getElementById("exito-perfil").classList.add("oculto");

  const boton = e.target.querySelector("button[type=submit]");
  boton.disabled = true;
  boton.textContent = "Guardando...";

  try {
    await Api.actualizarPerfilPostulante(usuarioActual.id, {
      telefono: document.getElementById("telefono").value.trim(),
      ubicacion: document.getElementById("ubicacion").value.trim(),
      experiencia: document.getElementById("experiencia").value.trim(),
      disponibilidad: document.getElementById("disponibilidad").value.trim(),
      habilidades: habilidadesActuales,
    });
    document.getElementById("exito-perfil").classList.remove("oculto");
  } catch (error) {
    console.error(error);
    document.getElementById("error-perfil").textContent =
      "No se pudo guardar el perfil. Intentá de nuevo.";
    document.getElementById("error-perfil").classList.remove("oculto");
  } finally {
    boton.disabled = false;
    boton.textContent = "Guardar perfil";
  }
});

// ---------- Init ----------

(async function init() {
  try {
    usuarioActual = await Api.getUsuarioActual();

    if (!usuarioActual || usuarioActual.tipo !== "postulante") {
      window.location.href = "../login/login.html";
      return;
    }

    perfilActual = await Api.getPerfilPostulante(usuarioActual.id);

    renderCvBox();
    llenarFormulario();

    document.getElementById("vista-cargando").classList.add("oculto");
    document.getElementById("vista-perfil").classList.remove("oculto");
  } catch (error) {
    console.error(error);
    window.location.href = "../login/login.html";
  }
})();
