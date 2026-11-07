/*
  ENTRADA DEL ALUMNADO CON CÓDIGO
  El alumno elige su grupo y su nombre y escribe su usuario de Educacyl. Pulsa «Enviarme el código» y le llega
  un código de 3 cifras a usuario@educa.jcyl.es. Con el código, ese ordenador queda con su sesión (se recuerda
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
    try { if (s) localStorage.setItem(CLAVE, JSON.stringify(s)); else localStorage.removeItem(CLAVE); } catch (e) {}
    if (s && window.Valoraciones) window.Valoraciones.ponerAlumno(s.nombre, s.clase, s.usuario);
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
      else if (b.dataset.acc === "salir") { ponerSesion(null); c.paso = "inicio"; c.msg = ""; pintar(c); }
      else if (b.dataset.acc === "otro") { c.paso = "inicio"; c.msg = ""; pintar(c); pedir(c); }
    });
    caja.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches(".acceso-cod")) { e.preventDefault(); entrar(c); } });
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
    c.paso = "codigo"; c.correo = j.correo || ""; c.datos = v;
    c.msg = j.mensaje || ""; c.tipo = ""; pintar(c);
    const i = c.caja.querySelector(".acceso-cod"); if (i) i.focus();
  }
  async function entrar(c) {
    const i = c.caja.querySelector(".acceso-cod"), cod = (i ? i.value : "").replace(/\D/g, "");
    if (cod.length !== 3) { c.msg = "El código tiene 3 cifras."; c.tipo = "error"; pintar(c); return; }
    c.msg = "Comprobando…"; c.tipo = ""; pintar(c, true);
    const j = await llamar(Object.assign({ accion: "alumnoEntrar", codigo: cod }, c.datos || valores(c)));
    if (!j) { c.msg = "No hay conexión con la hoja. Inténtalo otra vez."; c.tipo = "error"; pintar(c); return; }
    if (!j.ok) { c.msg = j.error || "Código incorrecto."; c.tipo = "error"; if (/caducado|Demasiados/.test(c.msg)) c.paso = "inicio"; pintar(c); return; }
    c.paso = "inicio"; c.msg = "";
    ponerSesion({ token: j.token, usuario: j.usuario, nombre: j.nombre, clase: j.clase });
  }
  function bloquear(c, si) {
    const nom = c.campos.nombre, sel = nom.parentElement && nom.parentElement.querySelector(".lista-nombres");
    [c.campos.clase, nom, sel, c.campos.usuario].forEach((el) => { if (el) el.disabled = si; });
  }
  function pintar(c, ocupado) {
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
      c.caja.innerHTML = `<p class="acceso-t">🔓 Has entrado como <b>${esc(s.nombre)}</b> · ${esc(s.clase)}. Tus notas llegan a tu profe.</p>
        <button type="button" class="btn sec" data-acc="salir">Salir (no soy yo)</button>`;
      return;
    }
    bloquear(c, false);
    c.caja.dataset.estado = c.paso;
    c.caja.innerHTML = c.paso === "codigo"
      ? `<p class="acceso-t">📧 Te hemos enviado un código de 3 cifras a <b>${esc(c.correo)}</b>. Abre tu correo de Educacyl y escríbelo aquí:</p>
        <div class="acceso-fila"><input class="acceso-cod" inputmode="numeric" maxlength="3" autocomplete="one-time-code" placeholder="000" aria-label="Código de 3 cifras">
        <button type="button" class="btn" data-acc="entrar"${ocupado ? " disabled" : ""}>Entrar</button>
        <button type="button" class="btn sec" data-acc="otro"${ocupado ? " disabled" : ""}>Enviarme otro código</button></div>${msg}`
      : `<p class="acceso-t">🔐 <b>Entra con tu código</b> para que tus notas lleguen a tu profe. Te llega a tu correo de Educacyl.</p>
        <div class="acceso-fila"><button type="button" class="btn" data-acc="pedir"${ocupado ? " disabled" : ""}>Enviarme el código</button></div>${msg}`;
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
