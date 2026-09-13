// ============================================================
// MENÚ DE PERFIL MOBILE - toggle compartido entre todas las páginas
// ============================================================
// Requiere que la página tenga en su HTML:
//   <div class="menu-perfil" id="menu-perfil">
//     <button onclick="toggleMenuPerfil()">...</button>
//     <div class="menu-perfil-dropdown oculto" id="menu-perfil-dropdown">...</div>
//   </div>
// ============================================================

function toggleMenuPerfil() {
  document.getElementById("menu-perfil-dropdown")?.classList.toggle("oculto");
}

document.addEventListener("click", (e) => {
  const menu = document.getElementById("menu-perfil");
  if (menu && !menu.contains(e.target)) {
    document.getElementById("menu-perfil-dropdown")?.classList.add("oculto");
  }
});
