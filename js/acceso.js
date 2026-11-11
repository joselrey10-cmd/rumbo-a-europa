/*
  ACCESO DEL ALUMNADO
  Cada alumno elige su contraseña la primera vez. La hoja «Accesos alumnado» del profesor
  conserva la contraseña para poder recuperarla en clase. La sesión del dispositivo se recuerda.
*/
window.Acceso = (function () {
  "use strict";
  const CLAVE = "rumbo-sesion-alumno";
  const REQ = "rumbo-sesion-requiere";
  const G = (t) => (window.normGrupo ? window.normGrupo(t) : String(t || "").trim());
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cajas = new Set();
  function sesion() { try { return JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch (e) { return null; } }
  function ponerSesion(s) {
    const antes = !!(sesion() || {}).adaptado;
    try { if (s) localStorage.setItem(CLAVE, JSON.stringify(s)); else localStorage.removeItem(CLAVE); } catch (e) {}
    if (s && window.Valoraciones) window.Valoraciones.ponerAlumno(s.nombre, s.clase, s.usuario);
    if (antes !== !!(s && s.adaptado)) { location.reload(); return; }
    pintarTodas();
  }
  function requiere() { try { return localStorage.getItem(REQ) !== "no"; } catch (e) { return true; } }
  const token = () => { const s = sesion(); return s ? s.token : ""; };
  function datosEnvio() { const s = sesion(); return s ? { token: s.token, usuario: s.usuario, nombre: s.nombre, clase: s.clase } : {}; }
  async function llamar(cuerpo) {
    const R = window.REGISTRO || {}; if (!R.url) return null;
    try { const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(cuerpo) }); return JSON.parse(await r.text()); }
    catch (e) { return null; }
  }
  function valores(c) {
    const nom = c.campos.nombre, sel = nom && nom.parentElement && nom.parentElement.querySelector(".lista-nombres");
    return { clase: G(c.campos.clase.value), nombre: (sel && !sel.hidden ? sel.value : nom.value).trim(), usuario: (c.campos.usuario.value || "").trim() };
  }
  function montar(form, campos) {
    if (!form || form.dataset.acceso) return;
    form.dataset.acceso = "1";
    const caja = document.createElement("div"); caja.className = "acceso"; caja.setAttribute("aria-live", "polite");
    form.insertAdjacentElement("afterend", caja);
    const c = { form, caja, campos, paso: "inicio", msg: "", tipo: "" }; cajas.add(c);
    caja.addEventListener("click", (e) => {
      const b = e.target.closest("[data-acc]"); if (!b) return;
      if (b.dataset.acc === "entrar") entrar(c);
      else if (b.dataset.acc === "ver") verPass(c);
      else if (b.dataset.acc === "salir") { if (window.SalirAlumno) { window.SalirAlumno.salir(); return; } ponerSesion(null); c.paso = "inicio"; c.msg = ""; pintar(c); }
      else if (b.dataset.acc === "cambiar") { c.paso = "cambiar"; c.msg = ""; pintar(c); const i = c.caja.querySelector(".acceso-act"); if (i) i.focus(); }
      else if (b.dataset.acc === "cancelar") { c.paso = "inicio"; c.msg = ""; pintar(c); }
      else if (b.dataset.acc === "guardar") cambiar(c);
    });
    const directo = async () => {
      if (sesion()) return;
      const v = valores(c); if (!v.clase || !v.nombre) return;
      const j = await llamar({ accion: "alumnoDirecto", clase: v.clase, nombre: v.nombre });
      if (j && j.ok && j.token && !sesion()) ponerSesion({ token: j.token, usuario: j.usuario, nombre: j.nombre, clase: j.clase, adaptado: !!j.adaptado });
    };
    campos.nombre.addEventListener("change", directo);
    caja.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (e.target.matches(".acceso-pass")) { e.preventDefault(); entrar(c); }
      else if (e.target.matches(".acceso-act, .acceso-nuevo, .acceso-rep")) { e.preventDefault(); cambiar(c); }
    });
    pintar(c);
  }
  async function entrar(c) {
    const pass = (c.caja.querySelector(".acceso-pass") || {}).value || "";
    const v = valores(c);
    if (!v.clase || !v.nombre || !v.usuario) { c.msg = "Primero elige tu grupo y tu nombre y escribe tu usuario de Educacyl."; c.tipo = "error"; pintar(c); return; }
    if (pass.trim().length < 4 || pass.trim().length > 24) { c.msg = "Elige una contraseña de entre 4 y 24 caracteres."; c.tipo = "error"; pintar(c); return; }
    c.msg = "Comprobando…"; c.tipo = ""; pintar(c, true);
    const j = await llamar(Object.assign({ accion: "alumnoEntrar", password: pass }, v));
    if (!j) { c.msg = "No hay conexión con la hoja. Inténtalo otra vez."; c.tipo = "error"; pintar(c); return; }
    if (!j.ok) { c.msg = j.error || "No se ha podido entrar."; c.tipo = "error"; pintar(c); return; }
    c.paso = "inicio"; c.msg = j.creada ? "✓ Tu contraseña se ha guardado. Si la olvidas, tu profe puede consultarla en la hoja." : ""; c.tipo = "ok";
    ponerSesion({ token: j.token, usuario: j.usuario, nombre: j.nombre, clase: j.clase, adaptado: !!j.adaptado });
  }
  async function cambiar(c) {
    const q = (k) => { const i = c.caja.querySelector(k); return i ? i.value : ""; };
    const actual = q(".acceso-act"), nuevo = q(".acceso-nuevo"), rep = q(".acceso-rep");
    const fallo = (t) => { c.msg = t; c.tipo = "error"; pintar(c, false, { actual, nuevo, rep }); };
    if (!actual) return fallo("Escribe tu contraseña actual.");
    if (nuevo.trim().length < 4 || nuevo.trim().length > 24) return fallo("La nueva contraseña debe tener entre 4 y 24 caracteres.");
    if (nuevo !== rep) return fallo("Las dos contraseñas nuevas no coinciden.");
    c.msg = "Guardando…"; c.tipo = ""; pintar(c, true, { actual, nuevo, rep });
    const s = sesion() || {};
    const j = await llamar({ accion: "alumnoCambiarCodigo", usuario: s.usuario, token: s.token, actual, nuevo });
    if (!j) return fallo("No hay conexión con la hoja. Inténtalo otra vez.");
    if (!j.ok) return fallo(j.error || "No se ha podido cambiar la contraseña.");
    c.paso = "inicio"; c.msg = "✓ Contraseña cambiada y guardada en la hoja del profesor."; c.tipo = "ok"; pintar(c);
  }
  function bloquear(c, si) {
    const nom = c.campos.nombre, sel = nom.parentElement && nom.parentElement.querySelector(".lista-nombres");
    [c.campos.clase, nom, sel, c.campos.usuario].forEach((el) => { if (el) el.disabled = si; });
  }
  function pintar(c, ocupado, val) {
    if (!c.caja.isConnected) { cajas.delete(c); return; }
    const s = sesion();
    if (!requiere() && !s) { c.caja.hidden = true; bloquear(c, false); return; }
    c.caja.hidden = false;
    const msg = c.msg ? `<p class="acceso-msg" data-tipo="${c.tipo}">${esc(c.msg)}</p>` : "";
    if (s) {
      const nom = c.campos.nombre, sel = nom.parentElement && nom.parentElement.querySelector(".lista-nombres");
      if (nom.value !== s.nombre) nom.value = s.nombre;
      if (c.campos.usuario.value !== s.usuario) c.campos.usuario.value = s.usuario;
      if (G(c.campos.clase.value) !== s.clase) { c.campos.clase.value = s.clase; c.campos.clase.dispatchEvent(new Event("change", { bubbles: true })); }
      if (sel && [...sel.options].some((o) => o.value === s.nombre)) sel.value = s.nombre;
      bloquear(c, true); c.caja.dataset.estado = "dentro";
      if (c.paso === "cambiar") {
        const v = val || {}, dis = ocupado ? " disabled" : ""; c.caja.dataset.estado = "cambiar";
        c.caja.innerHTML = `<p class="acceso-t">🔑 <b>Cambiar mi contraseña.</b> Usa entre 4 y 24 caracteres y elige una que puedas recordar.</p>
          <div class="acceso-fila">
          <label class="acceso-lab">Contraseña actual<input class="acceso-cod acceso-act" type="${tipoPass(c)}" autocomplete="current-password" value="${esc(v.actual || "")}"></label>
          <label class="acceso-lab">Nueva contraseña<input class="acceso-cod acceso-nuevo" type="${tipoPass(c)}" autocomplete="new-password" value="${esc(v.nuevo || "")}"></label>
          <label class="acceso-lab">Repite la nueva<input class="acceso-cod acceso-rep" type="${tipoPass(c)}" autocomplete="new-password" value="${esc(v.rep || "")}"></label>${botonVer(c)}</div>
          <div class="acceso-fila" style="margin-top:8px"><button type="button" class="btn" data-acc="guardar"${dis}>Guardar</button>
          <button type="button" class="btn sec" data-acc="cancelar"${dis}>Cancelar</button></div>${msg}`;
        return;
      }
      c.caja.innerHTML = `<p class="acceso-t">🔓 Has entrado como <b>${esc(s.nombre)}</b> · ${esc(s.clase)}. Tus notas llegan a tu profe.</p>
        <button type="button" class="btn sec" data-acc="cambiar">🔑 Cambiar mi contraseña</button>
        <button type="button" class="btn sec" data-acc="salir">Salir (no soy yo)</button>${msg}`;
      return;
    }
    bloquear(c, false); c.caja.dataset.estado = c.paso;
    const dis = ocupado ? " disabled" : "";
    const viejo = c.caja.querySelector(".acceso-pass"), escrito = viejo ? viejo.value : "";
    c.caja.innerHTML = `<p class="acceso-t">🔐 <b>Elige tu contraseña</b> si entras por primera vez. En las próximas visitas, escribe la misma. Tu profe podrá recuperarla desde la hoja «Accesos alumnado».</p>
      <div class="acceso-fila"><input class="acceso-cod acceso-pass" type="${tipoPass(c)}" autocomplete="current-password" maxlength="24" placeholder="Tu contraseña (4–24 caracteres)" aria-label="Tu contraseña" value="${esc(escrito)}" spellcheck="false" autocapitalize="off">${botonVer(c)}
      <button type="button" class="btn" data-acc="entrar"${dis}>Entrar / Crear contraseña</button></div>
      <p class="acceso-t">¿La has olvidado? Pide ayuda a tu profe para consultarla en la hoja de cálculo.</p>${msg}`;
  }
  // Botón «Ver»: enseña u oculta lo escrito para que el alumno pueda revisarlo.
  const tipoPass = (c) => (c.ver ? "text" : "password");
  const botonVer = (c) => `<button type="button" class="btn sec acceso-ver" data-acc="ver" aria-pressed="${!!c.ver}">${c.ver ? "🙈 Ocultar" : "👁 Ver"}</button>`;
  function verPass(c) {
    c.ver = !c.ver;
    c.caja.querySelectorAll(".acceso-cod").forEach((i) => { i.type = tipoPass(c); });
    c.caja.querySelectorAll(".acceso-ver").forEach((b) => { b.outerHTML = botonVer(c); });
    const i = c.caja.querySelector(".acceso-pass, .acceso-act"); if (i) i.focus();
  }
  function pintarTodas() { cajas.forEach((c) => pintar(c)); }
  async function comprobar() {
    const s = sesion() || {};
    const j = await llamar({ accion: "alumnoSesion", usuario: s.usuario || "", token: s.token || "" });
    if (!j || !j.ok) return;
    try { localStorage.setItem(REQ, j.requiere === false ? "no" : "si"); } catch (e) {}
    if (s.token && !j.valida) ponerSesion(null);
    else if (j.valida && j.alumno) ponerSesion(Object.assign({}, s, j.alumno));
    else pintarTodas();
  }
  function avisar() {
    let t = document.getElementById("acceso-aviso");
    if (!t) { t = document.createElement("div"); t.id = "acceso-aviso"; t.setAttribute("role", "alert"); document.body.appendChild(t); }
    t.innerHTML = `🔐 Tus notas no se han enviado: primero <a href="#">entra con tu contraseña</a> en la portada de Rincones.`;
    t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 7000);
  }
  window.addEventListener("storage", (e) => { if (e.key === CLAVE) pintarTodas(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", comprobar); else setTimeout(comprobar, 0);
  return { montar, sesion, token, datosEnvio, requiere, avisar, salir: () => ponerSesion(null) };
})();
