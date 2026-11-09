/*
  TEXTOS EDITABLES
  El profe puede cambiar cualquier texto de las pantallas del alumnado sin tocar GitHub:
  1. En el panel del profe (#profe) pulsa «Editar textos».
  2. Ve a cualquier rincón: los textos se marcan al pasar el ratón. Pulsa uno, escríbelo de nuevo y Guarda.
  Los cambios se guardan en la pestaña «Textos» de la hoja de Google y el alumnado los ve al cargar la página.
  Cada cambio vale para esa pantalla (Crea, Piensa, Programa…) y ese texto exacto. «Volver al original» lo quita.
  Si el texto original cambia en el código (rincones-datos.js), el cambio deja de aplicarse.
*/
window.Textos = (function () {
  "use strict";
  const CACHE = "rumbo-textos-v1";
  const EDITAR = "rumbo-editar-textos";
  const CLAVE_SES = "rumbo-profe-clave";
  const FUERA = "script,style,textarea,input,select,option,svg,canvas,.blockly-area,.injectionDiv,#textos-barra,#textos-dialogo";
  const original = new WeakMap(); // nodo de texto -> texto original (sin espacios de los lados)
  let mapa = {};
  try { mapa = JSON.parse(localStorage.getItem(CACHE) || "{}") || {}; } catch (e) {}

  const limpio = (t) => String(t || "").replace(/\s+/g, " ").trim();
  // Actividades de Piensa (piensa/itv.html…): la pantalla es «piensa/itv» para toda la actividad.
  const enPiensa = /\/piensa\/([\w-]+)\.html$/.exec(location.pathname);
  // Pantalla actual: #crea, #piensa, #programa, #destino-3… (la portada es «#»).
  const pantalla = () => (enPiensa ? "piensa/" + enPiensa[1] : (location.hash || "#").split(/[/?]/)[0] || "#");
  const prohibida = () => !enPiensa && /^#(profe|familias)$/.test(pantalla());
  const clave = (orig) => pantalla() + "|" + orig;
  // El modo editar se guarda en localStorage (8 horas) para que siga en las actividades de Piensa, que se abren en otra pestaña.
  function estadoEd() {
    try {
      const e = JSON.parse(localStorage.getItem(EDITAR) || "null");
      if (e && e.hasta > Date.now()) return e;
      if (e) localStorage.removeItem(EDITAR);
    } catch (x) {}
    return null;
  }
  function ponerEstado(e) { try { if (e) localStorage.setItem(EDITAR, JSON.stringify(e)); else localStorage.removeItem(EDITAR); } catch (x) {} }
  const editando = () => !!estadoEd();
  const editandoYa = () => { const e = estadoEd(); return !!e && !e.navegar && !prohibida(); };
  const zona = (t) => t && t.closest && (enPiensa ? t.closest("body") : t.closest("main"));
  const claveProfe = () => { const e = estadoEd(); if (e && e.clave) return e.clave; try { return sessionStorage.getItem(CLAVE_SES) || ""; } catch (x) { return ""; } };
  const PANTALLAS = [["#", "Portada"], ["#crea", "Crea"], ["#programa", "Programa"], ["#notas-prog", "Autoevaluación de Programa"],
    ["#robotica", "Robótica"], ["#notas-rob", "Autoevaluación de Robótica"], ["#piensa", "Piensa"], ["#familias", "Familias (no editable)"]];

  function valido(n) {
    const p = n.parentElement;
    return !!(p && !p.closest(FUERA));
  }
  function aplicarNodo(n) {
    if (n.nodeType !== 3 || !valido(n)) return;
    const actual = limpio(n.nodeValue);
    if (!actual) return;
    let orig = original.get(n);
    // Si el programa ha cambiado el texto, se toma como nuevo original.
    if (orig === undefined || (actual !== orig && actual !== limpio(mapa[clave(orig)]))) { orig = actual; original.set(n, orig); }
    const nuevo = mapa[clave(orig)];
    const quiero = nuevo != null && nuevo !== "" ? nuevo : orig;
    if (actual !== limpio(quiero)) {
      const m = /^(\s*)[\s\S]*?(\s*)$/.exec(n.nodeValue);
      n.nodeValue = m[1] + quiero + m[2];
    }
  }
  function aplicar(raiz) {
    if (prohibida() || !raiz) return;
    if (raiz.nodeType === 3) return aplicarNodo(raiz);
    if (raiz.nodeType !== 1 || raiz.closest(FUERA)) return;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) aplicarNodo(n);
  }
  const obs = new MutationObserver((lista) => {
    if (prohibida()) return;
    lista.forEach((m) => { if (m.type === "characterData") aplicarNodo(m.target); else m.addedNodes.forEach(aplicar); });
  });

  async function llamar(cuerpo) {
    const R = window.REGISTRO || {};
    if (!R.url) return null;
    try {
      const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(cuerpo) });
      return JSON.parse(await r.text());
    } catch (e) { return null; }
  }
  function guardarCache() { try { localStorage.setItem(CACHE, JSON.stringify(mapa)); } catch (e) {} }
  async function cargar() {
    const j = await llamar({ accion: "textos" });
    if (!j || !j.ok) return;
    mapa = j.textos || {};
    guardarCache();
    restaurarTodo();
    aplicar(document.body);
  }
  // Vuelve a poner el original en los nodos cuyo cambio se ha quitado.
  function restaurarTodo() {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) {
      const o = original.get(n);
      if (o !== undefined && mapa[clave(o)] == null && limpio(n.nodeValue) !== o) {
        const m = /^(\s*)[\s\S]*?(\s*)$/.exec(n.nodeValue); n.nodeValue = m[1] + o + m[2];
      }
    }
  }

  /* ---------- Modo editar (solo el profe) ---------- */
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function nodoEn(e) {
    let n = null;
    if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(e.clientX, e.clientY); n = p && p.offsetNode; }
    else if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(e.clientX, e.clientY); n = r && r.startContainer; }
    if (!n || n.nodeType !== 3 || !limpio(n.nodeValue) || !e.target.contains(n)) {
      n = [...e.target.childNodes].find((c) => c.nodeType === 3 && limpio(c.nodeValue)) || null;
      if (!n) { const w = document.createTreeWalker(e.target, NodeFilter.SHOW_TEXT); let c; while ((c = w.nextNode())) if (limpio(c.nodeValue)) { n = c; break; } }
    }
    return n && valido(n) ? n : null;
  }
  function barra() {
    let b = document.getElementById("textos-barra");
    const e = estadoEd(), ver = !!e && !prohibida();
    document.body.classList.toggle("editando-textos", ver && !e.navegar);
    document.body.classList.toggle("piensa-ed", !!enPiensa);
    if (!ver) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("div"); b.id = "textos-barra"; document.body.appendChild(b); }
    const ir = enPiensa
      ? `<button type="button" class="btn sec" id="textos-cerrar">Cerrar la actividad</button>`
      : `<label class="tb-ir">Ir a <select id="textos-ir">${PANTALLAS.map(([h, t]) => `<option value="${h}"${pantalla() === h ? " selected" : ""}>${t}</option>`).join("")}${PANTALLAS.some(([h]) => h === pantalla()) ? "" : `<option selected value="">(esta pantalla)</option>`}</select></label>`;
    b.innerHTML = `<span class="tb-t">${e.navegar
        ? "👆 <b>Modo navegar.</b> Los botones funcionan: entra en la actividad o el reto que quieras y vuelve a «Editar»."
        : "✏️ <b>Modo editar.</b> Pulsa un texto para cambiarlo. Para pulsar botones y entrar en actividades, cambia a «Navegar»."}</span>
      <div class="tb-modo" role="radiogroup" aria-label="Modo"><button type="button" role="radio" data-modo="editar" aria-checked="${!e.navegar}"><b>✏️ Editar</b></button><button type="button" role="radio" data-modo="navegar" aria-checked="${!!e.navegar}"><b>👆 Navegar</b></button></div>
      ${ir}${enPiensa ? "" : `<a class="btn sec" href="#profe">Volver al panel</a>`}<button type="button" class="btn" id="textos-salir">Terminar de editar</button>`;
    b.querySelectorAll("[data-modo]").forEach((x) => (x.onclick = () => { const s = estadoEd(); if (s) { s.navegar = x.dataset.modo === "navegar"; ponerEstado(s); } barra(); }));
    const sel = b.querySelector("#textos-ir"); if (sel) sel.onchange = () => { if (sel.value) location.hash = sel.value === "#" ? "" : sel.value; };
    const cer = b.querySelector("#textos-cerrar"); if (cer) cer.onclick = () => window.close();
    b.querySelector("#textos-salir").onclick = () => { activar(false); };
  }
  function dialogo(n) {
    const orig = original.get(n) || limpio(n.nodeValue), k = clave(orig), hay = mapa[k] != null;
    let d = document.getElementById("textos-dialogo"); if (d) d.remove();
    d = document.createElement("div");
    d.id = "textos-dialogo";
    d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Cambiar texto");
    d.innerHTML = `<div class="td-caja">
      <h3>Cambiar texto</h3>
      <p class="td-donde">Pantalla <b>${esc(pantalla() === "#" ? "portada" : pantalla().slice(1))}</b></p>
      ${hay ? `<p class="td-orig"><b>Texto original:</b> ${esc(orig)}</p>` : ""}
      <textarea rows="4" maxlength="2000">${esc(hay ? mapa[k] : orig)}</textarea>
      <div class="td-acc"><button type="button" class="btn" data-a="guardar">Guardar</button>
      ${hay ? `<button type="button" class="btn sec" data-a="original">Volver al original</button>` : ""}
      <button type="button" class="btn sec" data-a="cancelar">Cancelar</button></div>
      <p class="td-estado" aria-live="polite"></p></div>`;
    document.body.appendChild(d);
    const ta = d.querySelector("textarea"), est = d.querySelector(".td-estado");
    ta.focus(); ta.select();
    d.addEventListener("keydown", (e) => { if (e.key === "Escape") d.remove(); });
    d.addEventListener("click", async (e) => {
      if (e.target === d) { d.remove(); return; }
      const a = e.target.closest("[data-a]"); if (!a) return;
      if (a.dataset.a === "cancelar") { d.remove(); return; }
      const texto = a.dataset.a === "original" ? "" : limpio(ta.value);
      if (a.dataset.a === "guardar" && (!texto || texto === orig) && !hay) { d.remove(); return; }
      d.querySelectorAll("button").forEach((x) => (x.disabled = true));
      est.textContent = "Guardando en la hoja…"; est.dataset.tipo = "";
      const j = await llamar({ accion: "guardarTexto", clave: claveProfe(), id: k, original: orig, texto: texto === orig ? "" : texto });
      if (!j || !j.ok) {
        est.textContent = (j && j.error) || "No se ha podido guardar. Revisa la conexión.";
        est.dataset.tipo = "error";
        d.querySelectorAll("button").forEach((x) => (x.disabled = false));
        return;
      }
      if (texto && texto !== orig) mapa[k] = texto; else delete mapa[k];
      guardarCache();
      restaurarTodo();
      aplicar(document.body);
      d.remove();
    });
  }
  function clic(e) {
    // Solo se edita dentro de las pantallas (main); el menú de arriba sigue funcionando para moverse.
    if (!editandoYa() || !zona(e.target) || e.target.closest("#textos-barra,#textos-dialogo")) return;
    if (e.target.closest("input,select,textarea,svg,canvas,.blockly-area")) return;
    const n = nodoEn(e);
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (n) dialogo(n);
  }
  function activar(si) {
    let k = ""; try { k = sessionStorage.getItem(CLAVE_SES) || ""; } catch (e) {}
    ponerEstado(si ? { clave: k, navegar: false, hasta: Date.now() + 8 * 3600 * 1000 } : null);
    barra();
  }

  function iniciar() {
    aplicar(document.body);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    ["click", "mousedown", "pointerdown"].forEach((ev) => document.addEventListener(ev, (e) => { if (ev === "click") clic(e); else if (editandoYa() && zona(e.target) && !e.target.closest("#textos-barra,#textos-dialogo,input,select,textarea")) e.preventDefault(); }, true));
    window.addEventListener("hashchange", () => { barra(); setTimeout(() => aplicar(document.body), 0); });
    // Si se activa o se termina en otra pestaña (por ejemplo una actividad de Piensa), se actualiza aquí.
    window.addEventListener("storage", (e) => { if (e.key === EDITAR) barra(); if (e.key === CACHE) { try { mapa = JSON.parse(e.newValue || "{}") || {}; } catch (x) {} restaurarTodo(); aplicar(document.body); } });
    barra();
    cargar();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
  return { activar, editando, recargar: cargar, lista: () => Object.assign({}, mapa) };
})();
