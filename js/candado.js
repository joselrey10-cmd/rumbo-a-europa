/*
  CANDADO DE LOS RETOS
  Sin haber iniciado sesión (js/acceso.js), el alumno no puede abrir los retos:
  Crea, Programa, Robótica, Piensa y sus notas. Se le devuelve a la portada de Rincones con un aviso.
  - El alumnado con adaptación curricular entra eligiendo su nombre (también crea sesión), así que puede pasar.
  - Si en la hoja CODIGO_ALUMNO = false, no se pide contraseña y no hay candado.
  - El profe (panel Profe abierto o editando textos) puede ver todo sin contraseña.
  Se carga en index.html ANTES de js/juego.js y al final de piensa/*.html.
*/
(function () {
  "use strict";
  const SESION = "rumbo-sesion-alumno";
  const REQ = "rumbo-sesion-requiere";
  const AVISO = "rumbo-candado-aviso";
  const enPiensa = /\/piensa\//.test(location.pathname);
  const RETOS = /^#(crea|programa|destino-\d+|robotica.*|piensa.*|notas-.*)$/;

  function leer(k, ses) { try { return (ses ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } }
  function dentro() { try { const s = JSON.parse(leer(SESION) || "null"); return !!(s && s.token); } catch (e) { return false; } }
  const requiere = () => leer(REQ) !== "no";
  const esProfe = () => !!(leer("rumbo-profe-clave", true) || leer("rumbo-editar-textos"));
  const cerrado = () => requiere() && !dentro() && !esProfe();

  function avisar() {
    let t = document.getElementById("acceso-aviso");
    if (!t) { t = document.createElement("div"); t.id = "acceso-aviso"; t.setAttribute("role", "alert"); document.body.appendChild(t); }
    t.innerHTML = "🔐 Para entrar en los retos, primero <b>entra con tu contraseña</b>: elige tu curso y tu nombre, escribe tu usuario de Educacyl y crea tu contraseña o escribe la que elegiste.";
    t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 9000);
    setTimeout(() => { const f = document.querySelector("#r-form"); if (f) f.scrollIntoView({ behavior: "smooth", block: "center" }); }, 300);
  }

  // Actividades de Piensa (se abren en otra pestaña): sin sesión, a la portada.
  if (enPiensa) {
    if (cerrado()) { try { sessionStorage.setItem(AVISO, "1"); } catch (e) {} location.replace("../index.html#"); }
    return;
  }

  // Web principal: se comprueba antes de que js/juego.js pinte la pantalla.
  if (RETOS.test(location.hash) && cerrado()) {
    history.replaceState(null, "", location.pathname + location.search);
    document.addEventListener("DOMContentLoaded", avisar);
  }
  window.addEventListener("hashchange", (e) => {
    if (!RETOS.test(location.hash) || !cerrado()) return;
    e.stopImmediatePropagation();   // juego.js no llega a abrir el reto
    location.replace("#");
    avisar();
  });
  // Si la sesión se cierra o caduca estando dentro de un reto, se vuelve a la portada.
  setInterval(() => { if (RETOS.test(location.hash) && cerrado()) { location.replace("#"); avisar(); } }, 1500);
  if (leer(AVISO, true)) {
    try { sessionStorage.removeItem(AVISO); } catch (e) {}
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avisar); else avisar();
  }
  window.Candado = { cerrado };
})();
