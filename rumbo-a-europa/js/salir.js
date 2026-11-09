/*
  BOTÓN «SALIR» DEL ALUMNADO
  Cuando un alumno ha iniciado sesión con su contraseña (o por adaptación curricular), se ve arriba a la derecha
  en todas las pantallas (también en las actividades de Piensa): «👤 Nombre · P5A  [Salir]».
  Al salir se cierra su sesión y se borran de este ordenador sus datos y notas guardadas, para que
  el siguiente compañero empiece de cero. Lo que ya se envió sigue en la hoja del profe.
  Se carga en index.html y en piensa/*.html (no necesita ningún otro archivo).
*/
(function () {
  "use strict";
  const SESION = "rumbo-sesion-alumno";
  // Datos del alumno guardados en el navegador.
  const BORRAR = ["rumbo-a-europa-v1", "rumbo-valoraciones-v1", "rumbo-robotica-v1", "rumbo-robotica-ac", "rumbo-piensa-llaves", "rumbo-pais-ac"];
  // Lo que guardan las actividades de Piensa (nombre, curso y avance), por prefijo.
  const PIENSA = ["bandeja-", "cartero-", "contrasenas-", "detectives-", "escudo-", "influ-", "netiqueta-", "redes-", "tic-", "itv-", "facil-"];
  const enPiensa = /\/piensa\//.test(location.pathname);
  const portada = enPiensa ? "../index.html#" : "#";
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function sesion() { try { return JSON.parse(localStorage.getItem(SESION) || "null"); } catch (e) { return null; } }

  function salir() {
    const s = sesion();
    const quien = s && s.nombre ? s.nombre : "tu sesión";
    if (!confirm(`¿Salir de ${quien}?\n\nLas notas que ya has enviado siguen guardadas para tu profe. En este ordenador se borran tus datos para que el siguiente compañero empiece de cero.`)) return;
    try {
      localStorage.removeItem(SESION);
      BORRAR.forEach((k) => localStorage.removeItem(k));
      Object.keys(localStorage).filter((k) => PIENSA.some((p) => k.indexOf(p) === 0)).forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
    // Se vuelve a la portada y se recarga para que ninguna pantalla conserve los datos en memoria.
    if (enPiensa) { location.href = portada; return; }
    history.replaceState(null, "", location.pathname + location.search);
    location.reload();
  }

  function estilo() {
    if (document.getElementById("salir-estilo")) return;
    const st = document.createElement("style");
    st.id = "salir-estilo";
    st.textContent = `
#salir-alumno { position: fixed; top: 10px; right: 10px; z-index: 9500; display: flex; align-items: center; gap: 8px;
  max-width: calc(100% - 20px); padding: 5px 5px 5px 12px; border-radius: 999px; background: #fff; color: #14225a;
  border: 2px solid #14225a; box-shadow: 0 4px 14px rgba(0,0,0,.18); font: 700 14px/1.2 "Baloo 2", "Trebuchet MS", system-ui, sans-serif; }
#salir-alumno .sa-quien { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
#salir-alumno button { flex: none; cursor: pointer; border: 0; border-radius: 999px; padding: 6px 14px; background: #c8102e; color: #fff;
  font: 800 14px/1 "Baloo 2", "Trebuchet MS", system-ui, sans-serif; }
#salir-alumno button:hover, #salir-alumno button:focus-visible { background: #9e0c24; outline: 3px solid #ffcc00; outline-offset: 1px; }
#salir-alumno.en-nav { position: static; box-shadow: none; border-color: #ffcc00; margin-left: 8px; padding: 2px 2px 2px 10px; font-size: 13px; }
#salir-alumno.en-nav button { padding: 5px 12px; font-size: 13px; }
.nav-global .envoltura > #salir-alumno.en-nav:nth-child(2) { margin-left: auto; }
@media (max-width: 520px) { #salir-alumno .sa-curso { display: none; } }
@media print { #salir-alumno { display: none; } }`;
    document.head.appendChild(st);
  }

  function pintar() {
    let b = document.getElementById("salir-alumno");
    const s = sesion();
    // En el panel del profe y en la vista de familias no se muestra.
    const sec = document.body.dataset.seccion;
    if (!s || !s.token || sec === "profe" || sec === "familias") { if (b) b.hidden = true; return; }
    estilo();
    if (!b) {
      b = document.createElement("div");
      b.id = "salir-alumno";
      b.setAttribute("role", "region");
      b.setAttribute("aria-label", "Sesión del alumno");
      b.addEventListener("click", (e) => { if (e.target.closest("button")) salir(); });
      // En la web principal va dentro de la barra de secciones; en Piensa, flotando arriba a la derecha.
      const nav = document.querySelector(".nav-global .envoltura");
      if (nav) { b.className = "en-nav"; nav.appendChild(b); } else document.body.appendChild(b);
    }
    b.hidden = false;
    b.innerHTML = `<span class="sa-quien" title="${esc(s.nombre)} · ${esc(s.clase)}">👤 ${esc(s.nombre)}<span class="sa-curso"> · ${esc(s.clase)}</span></span><button type="button">Salir</button>`;
  }

  // Si se sale en otra pestaña (por ejemplo, desde una actividad de Piensa), esta también se reinicia.
  window.addEventListener("storage", (e) => {
    if (e.key !== SESION) return;
    if (!e.newValue && e.oldValue) { if (enPiensa) location.href = portada; else { history.replaceState(null, "", location.pathname + location.search); location.reload(); } }
    else pintar();
  });
  window.addEventListener("hashchange", () => setTimeout(pintar, 0));
  // La sesión puede cambiar en esta misma página (al iniciar sesión): se comprueba cada poco.
  let ultimo = null;
  setInterval(() => { let v = null; try { v = localStorage.getItem(SESION); } catch (e) {} if (v !== ultimo) { ultimo = v; pintar(); } }, 800);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pintar); else pintar();
  window.SalirAlumno = { salir, pintar };
})();
