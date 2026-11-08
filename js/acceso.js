/*
  ENTRADA DEL ALUMNADO CON CÓDIGO
  El alumno elige su grupo y su nombre, escribe su usuario de Educacyl y su código. El código es FIJO (de 3 a 6 cifras):
  lo apunta en la agenda. Si no lo sabe, «Enviarme mi código» se lo manda a usuario@educa.jcyl.es (o se lo da el profe).
  Ya dentro, puede cambiarlo por otro que recuerde mejor. Con el código, ese ordenador queda con su sesión (se recuerda
  varios meses) y sus notas llegan a la hoja. Sin sesión, la hoja no guarda las notas (CODIGO_ALUMNO en el script).
  Así un compañero no puede enviar notas con el nombre de otro.
*/
window.Acceso = (function () {
  "use strict";
  const CLAVE = "rumbo-sesion-alumno";
  const REQ = "rumbo-sesion-requiere";
  const G = (t) => (window.normGrupo ? window.normGrupo(t) : String(t || "").trim());
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const cajas = new Set();

  function sesion() { try { return JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch (e) { return null; } }
  function ponerSesion(s) {
    const antes = !!(sesion() || {}).adaptado;
    try { if (s) localStorage.setItem(CLAVE, JSON.stringify(s)); else localStorage.removeItem(CLAVE); } catch (e) {}
    if (s && window.Valoraciones) window.Valoraciones.ponerAlumno(s.nombre, s.clase, s.usuario);
    // Con adaptación curricular las pantallas son otras: se vuelve a cargar la página.
    if (antes !== !!(s && s.adaptado)) { location.reload(); return; }
    pintarTodas();
  }
  // false solo si la hoja ha dicho que no hace falta código (CODIGO_ALUMNO = false).
  function requiere() { try { return localStorage.getItem(REQ) !== "no"; } catch (e) { return true; } }
  const token = () => { const s = sesion(); return s ? s.token : ""; };
  // Lo que se añade a cada nota que se envía.
  function datosEnvio() { const s = sesion(); return s ? { token: s.token, usuario: s.usuario, nombre: s.nombre, clase: s.clase } : {}; }

  async function llamar(cuerpo) {
    const R = window.REGISTRO || {};
    if (!R.url) return null;
    try {
      const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(cuerpo) });
      return JSON.parse(await r.text());
    } catch (e) { return null; }
  }

  /* caja: se pone debajo del formulario del alumno. campos: { clase, nombre, usuario } (los del formulario). */
  function montar(form, campos) {
    if (!form || form.dataset.acceso) return;
    form.dataset.acceso = "1";
    const caja = document.createElement("div");
    caja.className = "acceso";
    caja.setAttribute("aria-live", "polite");
    form.insertAdjacentElement("afterend", caja);
    const c = { form, caja, campos, paso: "inicio", correo: "", msg: "", tipo: "" };
    cajas.add(c);
    caja.addEventListener("click", (e) => {
      const b = e.target.closest("[data-acc]"); if (!b) return;
      if (b.dataset.acc === "pedir") pedir(c);
      else if (b.dataset.acc === "entrar") entrar(c);
      else if (b.dataset.acc === "salir") { if (window.SalirAlumno) { window.SalirAlumno.salir(); return; } ponerSesion(null); c.paso = "inicio"; c.msg = ""; pintar(c); }
      else if (b.dataset.acc === "otro") { c.paso = "inicio"; c.msg = ""; pintar(c); pedir(c); }
      else if (b.dataset.acc === "cambiar") { c.paso = "cambiar"; c.msg = ""; pintar(c); const i = c.caja.querySelector(".acceso-act"); if (i) i.focus(); }
      else if (b.dataset.acc === "cancelar") { c.paso = "inicio"; c.msg = ""; pintar(c); }
      else if (b.dataset.acc === "guardar") cambiar(c);
    });
    // Alumnado con adaptación curricular: entra solo con elegir su nombre (sin código).
    const directo = async () => {
      if (sesion()) return;
      const v = valores(c);
      if (!v.clase || !v.nombre) return;
      const j = await llamar({ accion: "alumnoDirecto", clase: v.clase, nombre: v.nombre });
      if (j && j.ok && j.token && !sesion()) ponerSesion({ token: j.token, usuario: j.usuario, nombre: j.nombre, clase: j.clase, adaptado: !!j.adaptado });
    };
    campos.nombre.addEventListener("change", directo);
    caja.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (e.target.matches(".acceso-cod")) { e.preventDefault(); entrar(c); }
      else if (e.target.matches(".acceso-act, .acceso-nuevo, .acceso-rep")) { e.preventDefault(); cambiar(c); }
    });
    pintar(c);
  }
  function valores(c) {
    const nom = c.campos.nombre, sel = nom && nom.parentElement && nom.parentElement.querySelector(".lista-nombres");
    return { clase: G(c.campos.clase.value), nombre: (sel && !sel.hidden ? sel.value : nom.value).trim(), usuario: (c.campos.usuario.value || "").trim() };
  }
  async function pedir(c) {
    const v = valores(c);
    if (!v.clase || !v.nombre || !v.usuario) { c.msg = "Primero elige tu grupo y tu nombre y escribe tu usuario de Educacyl."; c.tipo = "error"; pintar(c); return; }
    c.msg = "Enviando el código a tu correo…"; c.tipo = ""; pintar(c, true);
    const j = await llamar(Object.assign({ accion: "alumnoCodigo" }, v));
    if (!j) { c.msg = "No hay conexión con la hoja. Inténtalo otra vez."; c.tipo = "error"; pintar(c); return; }
    if (!j.ok) { c.msg = j.error || "No se ha podido enviar el código."; c.tipo = "error"; pintar(c); return; }
    c.paso = "codigo"; c.correo = j.correo || "";
    c.msg = j.mensaje || ""; c.tipo = ""; pintar(c);
    const i = c.caja.querySelector(".acceso-cod"); if (i) i.focus();
  }
  async function entrar(c) {
    const i = c.caja.querySelector(".acceso-cod"), cod = (i ? i.value : "").replace(/\D/g, "");
    const v = valores(c);
    if (!v.clase || !v.nombre || !v.usuario) { c.msg = "Primero elige tu grupo y tu nombre y escribe tu usuario de Educacyl."; c.tipo = "error"; pintar(c); return; }
    if (cod.length < 3 || cod.length > 6) { c.msg = "Escribe tu código (de 3 a 6 números)."; c.tipo = "error"; pintar(c); return; }
    c.msg = "Comprobando…"; c.tipo = ""; pintar(c, true);
    const j = await llamar(Object.assign({ accion: "alumnoEntrar", codigo: cod }, v));
    if (!j) { c.msg = "No hay conexión con la hoja. Inténtalo otra vez."; c.tipo = "error"; pintar(c); return; }
    if (!j.ok) { c.msg = j.error || "Código incorrecto."; c.tipo = "error"; pintar(c); return; }
    c.paso = "inicio"; c.msg = "";
    ponerSesion({ token: j.token, usuario: j.usuario, nombre: j.nombre, clase: j.clase, adaptado: !!j.adaptado });
  }
  // Ya dentro: cambiar el código por otro que recuerde mejor.
  async function cambiar(c) {
    const q = (k) => { const i = c.caja.querySelector(k); return i ? i.value.replace(/\D/g, "") : ""; };
    const actual = q(".acceso-act"), nuevo = q(".acceso-nuevo"), rep = q(".acceso-rep");
    const fallo = (t) => { c.msg = t; c.tipo = "error"; pintar(c, false, { actual, nuevo, rep }); };
    if (!actual) return fallo("Escribe tu código de ahora.");
    if (nuevo.length < 3 || nuevo.length > 6) return fallo("El código nuevo tiene que tener de 3 a 6 números.");
    if (nuevo !== rep) return fallo("Los dos códigos nuevos no son iguales.");
    c.msg = "Guardando…"; c.tipo = ""; pintar(c, true, { actual, nuevo, rep });
    const s = sesion() || {};
    const j = await llamar({ accion: "alumnoCambiarCodigo", usuario: s.usuario, token: s.token, actual, nuevo });
    if (!j) return fallo("No hay conexión con la hoja. Inténtalo otra vez.");
    if (!j.ok) return fallo(j.error || "No se ha podido cambiar el código.");
    c.paso = "inicio"; c.msg = "✓ Código cambiado. Apunta el nuevo en tu agenda: " + nuevo; c.tipo = "ok"; pintar(c);
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
      if (c.campos.usuario.value !== s.usuario) c.campos.usuario.value = s.usuario;
      bloquear(c, true);
      c.caja.dataset.estado = "dentro";
      if (c.paso === "cambiar") {
        const v = val || {}, dis = ocupado ? " disabled" : "";
        c.caja.dataset.estado = "cambiar";
        c.caja.innerHTML = `<p class="acceso-t">🔑 <b>Cambiar mi código.</b> Elige uno de 3 a 6 números que recuerdes bien (no vale 111 ni 123) y apúntalo en tu agenda.</p>
          <div class="acceso-fila">
          <label class="acceso-lab">Código de ahora<input class="acceso-cod acceso-act" type="password" inputmode="numeric" maxlength="6" autocomplete="current-password" value="${esc(v.actual || "")}"></label>
          <label class="acceso-lab">Código nuevo<input class="acceso-cod acceso-nuevo" inputmode="numeric" maxlength="6" autocomplete="new-password" value="${esc(v.nuevo || "")}"></label>
          <label class="acceso-lab">Repite el nuevo<input class="acceso-cod acceso-rep" inputmode="numeric" maxlength="6" autocomplete="new-password" value="${esc(v.rep || "")}"></label></div>
          <div class="acceso-fila" style="margin-top:8px"><button type="button" class="btn" data-acc="guardar"${dis}>Guardar</button>
          <button type="button" class="btn sec" data-acc="cancelar"${dis}>Cancelar</button></div>${msg}`;
        return;
      }
      c.caja.innerHTML = `<p class="acceso-t">🔓 Has entrado como <b>${esc(s.nombre)}</b> · ${esc(s.clase)}. Tus notas llegan a tu profe.</p>
        <button type="button" class="btn sec" data-acc="cambiar">🔑 Cambiar mi código</button>
        <button type="button" class="btn sec" data-acc="salir">Salir (no soy yo)</button>${msg}`;
      return;
    }
    bloquear(c, false);
    c.caja.dataset.estado = c.paso;
    if (c.paso === "cambiar") c.paso = "inicio";
    const dis = ocupado ? " disabled" : "";
    const viejo = c.caja.querySelector(".acceso-cod"), escrito = viejo ? viejo.value : "";
    c.caja.innerHTML = (c.paso === "codigo"
      ? `<p class="acceso-t">📧 Te hemos enviado tu código a <b>${esc(c.correo)}</b>. Es siempre el mismo: <b>apúntalo en tu agenda</b> y escríbelo aquí.</p>`
      : `<p class="acceso-t">🔐 <b>Escribe tu código</b> para abrir los retos y que tus notas lleguen a tu profe. Es siempre el mismo (el que tienes apuntado en la agenda).</p>`) +
      `<div class="acceso-fila"><input class="acceso-cod" type="password" inputmode="numeric" maxlength="6" autocomplete="current-password" placeholder="•••" aria-label="Tu código (de 3 a 6 números)" value="${esc(escrito)}">
        <button type="button" class="btn" data-acc="entrar"${dis}>Entrar</button>
        <button type="button" class="btn sec" data-acc="pedir"${dis}>${c.paso === "codigo" ? "Enviármelo otra vez" : "No sé mi código: enviármelo al correo"}</button></div>${msg}`;
  }
  function pintarTodas() { cajas.forEach((c) => pintar(c)); }

  // Al cargar: comprueba que la sesión sigue valiendo y si la hoja pide código.
  async function comprobar() {
    const s = sesion() || {};
    const j = await llamar({ accion: "alumnoSesion", usuario: s.usuario || "", token: s.token || "" });
    if (!j || !j.ok) return;
    try { localStorage.setItem(REQ, j.requiere === false ? "no" : "si"); } catch (e) {}
    if (s.token && !j.valida) ponerSesion(null);
    else if (j.valida && j.alumno) ponerSesion(Object.assign({}, s, j.alumno));
    else pintarTodas();
  }
  // Aviso si se intenta enviar sin haber entrado.
  function avisar() {
    let t = document.getElementById("acceso-aviso");
    if (!t) { t = document.createElement("div"); t.id = "acceso-aviso"; t.setAttribute("role", "alert"); document.body.appendChild(t); }
    t.innerHTML = `🔐 Tus notas no se han enviado: primero <a href="#">entra con tu código</a> en la portada de Rincones.`;
    t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 7000);
  }
  window.addEventListener("storage", (e) => { if (e.key === CLAVE) pintarTodas(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", comprobar); else setTimeout(comprobar, 0);
  return { montar, sesion, token, datosEnvio, requiere, avisar, salir: () => ponerSesion(null) };
})();
