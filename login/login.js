// ============================================================
// LOGIN / REGISTRO - lógica de UI + llamadas a Api
// ============================================================

let tipoSeleccionado = "postulante";

function cambiarTab(tab) {
  const esIngresar = tab === "ingresar";

  document.getElementById("tab-ingresar").classList.toggle("activo", esIngresar);
  document.getElementById("tab-registrar").classList.toggle("activo", !esIngresar);
  document.getElementById("form-ingresar").classList.toggle("oculto", !esIngresar);
  document.getElementById("form-registrar").classList.toggle("oculto", esIngresar);
}

function seleccionarTipo(tipo) {
  tipoSeleccionado = tipo;

  document.querySelectorAll(".tipo-usuario-opcion").forEach((el) => {
    el.classList.toggle("seleccionado", el.dataset.tipo === tipo);
  });

  const esEmpresa = tipo === "empresa";
  document.getElementById("campos-empresa").classList.toggle("oculto", !esEmpresa);
  document.getElementById("label-nombre").textContent = esEmpresa
    ? "Nombre de tu empresa"
    : "Nombre completo";
}

function mostrarError(elId, error) {
  const el = document.getElementById(elId);
  el.textContent = traducirError(error);
  el.classList.remove("oculto");
}

function ocultarError(elId) {
  document.getElementById(elId).classList.add("oculto");
}

// Supabase devuelve mensajes en inglés; traducimos los más comunes
// para que la experiencia sea consistente en español.
function traducirError(error) {
  const msg = error?.message || "";
  if (msg.includes("Invalid login credentials")) return "Email o contraseña incorrectos.";
  if (msg.includes("User already registered")) return "Ya existe una cuenta con ese email.";
  if (msg.includes("Password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
  if (msg.includes("Unable to validate email")) return "El formato del email no es válido.";
  return "Ocurrió un error. Intentá de nuevo en unos segundos.";
}

// Redirige según el tipo de usuario logueado
function redirigirSegunTipo(tipo) {
  if (tipo === "empresa") {
    window.location.href = "../empresa/dashboard.html";
  } else if (tipo === "admin") {
    window.location.href = "../admin/panel.html";
  } else {
    window.location.href = "../postulante/mis-postulaciones.html";
  }
}

// ---------- INGRESAR ----------

document.getElementById("form-ingresar").addEventListener("submit", async (e) => {
  e.preventDefault();
  ocultarError("error-ingresar");

  const email = document.getElementById("ingresar-email").value.trim();
  const password = document.getElementById("ingresar-password").value;
  const boton = e.target.querySelector("button[type=submit]");

  boton.disabled = true;
  boton.textContent = "Ingresando...";

  try {
    await Api.login({ email, password });
    const usuario = await Api.getUsuarioActual();
    redirigirSegunTipo(usuario.tipo);
  } catch (error) {
    mostrarError("error-ingresar", error);
    boton.disabled = false;
    boton.textContent = "Iniciar sesión";
  }
});

// ---------- REGISTRAR ----------

document.getElementById("form-registrar").addEventListener("submit", async (e) => {
  e.preventDefault();
  ocultarError("error-registrar");
  document.getElementById("exito-registrar").classList.add("oculto");

  const nombre = document.getElementById("registrar-nombre").value.trim();
  const email = document.getElementById("registrar-email").value.trim();
  const password = document.getElementById("registrar-password").value;
  const boton = e.target.querySelector("button[type=submit]");

  boton.disabled = true;
  boton.textContent = "Creando cuenta...";

  try {
    const { user } = await Api.registrarse({
      email,
      password,
      tipo: tipoSeleccionado,
      nombreCompleto: nombre,
    });

    // El trigger de Postgres ya creó la fila en `usuarios`.
    // Ahora creamos el perfil específico según el tipo elegido.
    if (tipoSeleccionado === "empresa") {
      const cuit = document.getElementById("registrar-cuit").value.trim();
      const rubro = document.getElementById("registrar-rubro").value.trim();
      await Api.crearPerfilEmpresa({
        usuarioId: user.id,
        nombreEmpresa: nombre,
        cuit,
        rubro,
      });
    } else {
      await Api.crearPerfilPostulante({ usuarioId: user.id });
    }

    if (tipoSeleccionado === "empresa") {
      document.getElementById("exito-registrar").textContent =
        "¡Cuenta creada! Tu empresa queda pendiente de aprobación — te avisamos por email cuando esté activa.";
    } else {
      document.getElementById("exito-registrar").textContent =
        "¡Cuenta creada! Ya podés iniciar sesión.";
    }
    document.getElementById("exito-registrar").classList.remove("oculto");
    e.target.reset();
    boton.textContent = "Crear cuenta";
    boton.disabled = false;
  } catch (error) {
    mostrarError("error-registrar", error);
    boton.disabled = false;
    boton.textContent = "Crear cuenta";
  }
});
