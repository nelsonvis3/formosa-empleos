// ============================================================
// PERFIL DE EMPRESA - datos + logo
// ============================================================

let usuarioActual = null;
let perfilActual = null;

async function cerrarSesion() {
  await Api.logout();
  window.location.href = "../login/login.html";
}

function inicialesDe(nombre) {
  if (!nombre) return "?";
  return nombre.trim().charAt(0).toUpperCase();
}

function renderLogoPreview() {
  const preview = document.getElementById("logo-preview");
  if (perfilActual.logo_url) {
    preview.innerHTML = `<img src="${perfilActual.logo_url}" alt="Logo">`;
  } else {
    preview.textContent = inicialesDe(perfilActual.nombre_empresa);
  }
}

async function subirLogo(e) {
  const archivo = e.target.files[0];
  if (!archivo) return;

  if (!archivo.type.startsWith("image/")) {
    alert("El logo tiene que ser una imagen.");
    return;
  }
  if (archivo.size > 2 * 1024 * 1024) {
    alert("La imagen no puede pesar más de 2MB.");
    return;
  }

  const preview = document.getElementById("logo-preview");
  preview.textContent = "...";

  try {
    const url = await Api.subirLogo(usuarioActual.id, archivo);
    await Api.actualizarPerfilEmpresa(usuarioActual.id, { logo_url: url });
    perfilActual.logo_url = url;
    renderLogoPreview();
  } catch (error) {
    console.error(error);
    alert("No se pudo subir el logo. Intentá de nuevo.");
    renderLogoPreview();
  }
}

document.getElementById("input-logo").addEventListener("change", subirLogo);

function llenarFormulario() {
  document.getElementById("nombre_empresa").value =
    perfilActual.nombre_empresa || "";
  document.getElementById("cuit").value = perfilActual.cuit || "";
  document.getElementById("rubro").value = perfilActual.rubro || "";
  document.getElementById("descripcion").value = perfilActual.descripcion || "";
  document.getElementById("sitio_web").value = perfilActual.sitio_web || "";
  document.getElementById("red_social").value = perfilActual.red_social || "";
  document.getElementById("direccion").value = perfilActual.direccion || "";
}

document
  .getElementById("form-perfil-empresa")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    document.getElementById("error-perfil").classList.add("oculto");
    document.getElementById("exito-perfil").classList.add("oculto");

    const boton = e.target.querySelector("button[type=submit]");
    boton.disabled = true;
    boton.textContent = "Guardando...";

    const nombreNuevo = document.getElementById("nombre_empresa").value.trim();

    try {
      await Api.actualizarPerfilEmpresa(usuarioActual.id, {
        nombre_empresa: nombreNuevo,
        cuit: document.getElementById("cuit").value.trim(),
        rubro: document.getElementById("rubro").value.trim(),
        descripcion: document.getElementById("descripcion").value.trim(),
        sitio_web: document.getElementById("sitio_web").value.trim() || null,
        red_social: document.getElementById("red_social").value.trim() || null,
        direccion: document.getElementById("direccion").value.trim() || null,
      });

      perfilActual.nombre_empresa = nombreNuevo;
      if (!perfilActual.logo_url) renderLogoPreview(); // actualiza la inicial si cambió el nombre

      document.getElementById("exito-perfil").classList.remove("oculto");
    } catch (error) {
      console.error(error);
      document.getElementById("error-perfil").textContent =
        "No se pudo guardar. Intentá de nuevo.";
      document.getElementById("error-perfil").classList.remove("oculto");
    } finally {
      boton.disabled = false;
      boton.textContent = "Guardar cambios";
    }
  });

// ---------- Init ----------

(async function init() {
  try {
    usuarioActual = await Api.getUsuarioActual();

    if (!usuarioActual || usuarioActual.tipo !== "empresa") {
      window.location.href = "../login/login.html";
      return;
    }

    perfilActual = await Api.getPerfilEmpresa(usuarioActual.id);

    renderLogoPreview();
    llenarFormulario();

    document.getElementById("vista-cargando").classList.add("oculto");
    document.getElementById("vista-perfil").classList.remove("oculto");
  } catch (error) {
    console.error(error);
    window.location.href = "../login/login.html";
  }
})();
