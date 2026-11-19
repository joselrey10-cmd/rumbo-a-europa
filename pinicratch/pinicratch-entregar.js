/*
  PINICRATCH · ENTREGAR UN RETO
  -----------------------------
  - pinicratch/?reto=B1 … B6 (desde la ficha del reto en Programa, 6.º): barra con «Comprobar» y «Entregar a la profe».
    Comprobar = corrige el proyecto con pinicratch-rubricas.js y enseña qué falta en cada ruta.
    Entregar  = guarda el .sb3 en el Drive del cole (accion «guardarProyecto» del script) y envía la nota del indicador
                de programación (fila normal de Resultados, Personaje «Pinicratch»). El script solo la apunta si es mejor
                que la que ya tenía y si el profe no ha puesto la suya.
  - pinicratch/?abrir=profe: el panel del profe deja el proyecto en localStorage («pinicratch-abrir») y aquí se carga.
*/
(function () {
  "use strict";
  const RETOS = {
    B1: "El nombre de mi país cobra vida", B2: "Mi guía turístico", B3: "Entrevista para La Piña 3.0",
    B4: "La sintonía de Europa", B5: "EuroRuta 1: preparamos el equipaje", B6: "EuroRuta 2: ¡despegamos!"
  };
  const q = new URLSearchParams(location.search);
  const reto = (q.get("reto") || "").toUpperCase();
  const abrir = q.get("abrir");
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const leer = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const destino = (id) => `Programación · Scratch ${id} · ${RETOS[id]}`.slice(0, 60);

  function vm() { return window.pinicratchVM; }
  function cuandoVM(fn) {
    const listo = () => { const v = vm(); return v && v.runtime && v.runtime.targets && v.runtime.targets.length; };
    const esperar = () => { if (listo()) setTimeout(fn, 400); else setTimeout(esperar, 250); };
    if (vm()) esperar(); else window.addEventListener("pinicratch-vm", esperar, { once: true });
  }
  function proyecto() { return JSON.parse(vm().toJSON()); }

  /* ---------- Barra superior ---------- */
  function barra(html) {
    const b = document.createElement("div");
    b.className = "pc-barra"; b.innerHTML = html;
    document.body.appendChild(b);
    return b;
  }
  function panel(html) {
    let p = document.querySelector(".pc-panel");
    if (!p) { p = document.createElement("div"); p.className = "pc-panel"; p.setAttribute("role", "dialog"); document.body.appendChild(p); }
    p.innerHTML = `<button class="pc-cerrar" aria-label="Cerrar">✕</button>${html}`;
    p.hidden = false;
    p.querySelector(".pc-cerrar").onclick = () => { p.hidden = true; };
    return p;
  }
  function informe(r) {
    const rutas = r.rutas.map((ru) => `<div class="pc-ruta ${ru.completa ? "ok" : ""}"><b>${ru.completa ? "✓" : "○"} Ruta ${esc(ru.nombre.toLowerCase())}</b><ul>${ru.items.map((it) => `<li class="${it.ok ? "ok" : "no"}">${it.ok ? "✓" : "✗"} ${esc(it.texto)}</li>`).join("")}</ul></div>`).join("");
    return `<p class="pc-nota">Nota del indicador <b>${esc(r.indicador)}</b>: <span class="pc-num">${r.nota}</span>/5 <small>(${esc(r.ruta === "Sin completar" ? "ruta sencilla sin completar" : "ruta " + r.ruta.toLowerCase() + " completa")})</small></p>
      <p class="pc-ayuda">Las rutas se suman: sencilla completa = 3, con la intermedia = 4, con la avanzada = 5. Lo demás (idioma, licencias, trabajo en equipo…) lo valora tu profe.</p>${rutas}`;
  }

  /* ---------- Envío a la hoja ---------- */
  async function llamar(cuerpo) {
    const R = window.REGISTRO || {};
    if (!R.url) throw new Error("La web no tiene configurada la hoja de notas.");
    const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(cuerpo) });
    return (await r.text()).trim();
  }
  function enBase64(buf) {
    const b = new Uint8Array(buf); let s = "";
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }
  async function entregar(btn) {
    const s = leer("rumbo-sesion-alumno");
    if (!s || !s.token) {
      panel(`<h3>Antes, entra en Rumbo a Europa</h3><p>Para entregar, abre <a href="../#programa" target="_blank">Rumbo a Europa</a>, entra con tu nombre y tu contraseña y vuelve a pulsar «Entregar». No cierres esta pestaña: no perderás tu proyecto.</p>`);
      return;
    }
    const r = window.PinicratchRubricas.corregir(reto, proyecto());
    btn.disabled = true;
    const p = panel(`<h3>Entregando…</h3><p>Guardando tu proyecto para tu profe. Espera un momento.</p>`);
    try {
      const sb3 = await vm().saveProjectSb3();
      const buf = await sb3.arrayBuffer();
      if (buf.byteLength > 20 * 1024 * 1024) throw new Error("El proyecto es demasiado grande (más de 20 MB). Quita sonidos o imágenes muy grandes.");
      const base = { token: s.token, usuario: s.usuario, nombre: s.nombre, clase: s.clase };
      let id = "";
      const t1 = await llamar(Object.assign({ accion: "guardarProyecto", reto, b64: enBase64(buf) }, base));
      let j1 = null; try { j1 = JSON.parse(t1); } catch (e) {}
      if (j1 && j1.sesion) throw new Error("Tu sesión ha caducado: vuelve a entrar en Rumbo a Europa con tu contraseña.");
      if (j1 && j1.ok) id = j1.id;
      // Hoja con el script antiguo (no conoce «guardarProyecto» y contesta «ok»): no se envía la nota para no pisar la del profe.
      if (!j1 && t1 === "ok") throw new Error("Tu profe todavía tiene que actualizar la hoja de notas para recibir entregas de Pinicratch. De momento, guarda tu proyecto con Archivo → Guardar en tu ordenador.");
      // Si la hoja todavía no sabe guardar proyectos, la nota se envía igual.
      const resumen = r.rutas.map((ru) => `${ru.nombre} ${ru.hechas}/${ru.items.length}`).join(", ");
      const t2 = await llamar(Object.assign({
        fecha: new Date().toISOString(), destino: destino(reto), ciudad: RETOS[reto].slice(0, 40), estrellas: "", bloques: r.bloques, intentos: "",
        personaje: "Pinicratch", programa: `Entrega Pinicratch · Ruta ${r.ruta.toLowerCase()} · ${resumen}${id ? " · Proyecto: " + id : ""}`.slice(0, 490),
        indicador: r.indicador, valoracion: r.nota
      }, base));
      if (t2 === "sesion" || /"sesion"\s*:\s*true/.test(t2)) throw new Error("Tu sesión ha caducado: vuelve a entrar en Rumbo a Europa con tu contraseña.");
      if (t2 !== "ok") throw new Error("La hoja no ha contestado bien. Vuelve a intentarlo en un momento.");
      p.innerHTML = "";
      panel(`<h3>✓ Entregado a tu profe</h3>${id ? "" : `<p class="pc-ayuda">Tu nota ha llegado, pero tu profe todavía no puede guardar el archivo. Guárdalo también con Archivo → Guardar en tu ordenador.</p>`}${informe(r)}
        <p class="pc-ayuda">Cuenta tu mejor entrega: puedes mejorarlo y volver a entregar. Si tu profe pone su nota, vale la suya. Vuelve a la ficha del reto en Rumbo a Europa para el billete de salida y «He terminado el reto».</p>`);
    } catch (e) {
      panel(`<h3>No se ha podido entregar</h3><p>${esc(e.message || "Comprueba la conexión y vuelve a intentarlo.")}</p><p class="pc-ayuda">Mientras tanto, guarda tu proyecto con Archivo → Guardar en tu ordenador.</p>`);
    } finally { btn.disabled = false; }
  }

  /* ---------- Modo reto ---------- */
  function modoReto() {
    const b = barra(`<span class="pc-tit"><b>Reto ${esc(reto)}</b> · ${esc(RETOS[reto])}</span>
      <button type="button" class="pc-btn sec" id="pc-comprobar">🔍 Comprobar</button>
      <button type="button" class="pc-btn" id="pc-entregar">📤 Entregar a la profe</button>`);
    b.querySelector("#pc-comprobar").onclick = () => {
      if (!vm()) return;
      const r = window.PinicratchRubricas.corregir(reto, proyecto());
      panel(`<h3>¿Cómo va tu reto ${esc(reto)}?</h3>${informe(r)}`);
    };
    b.querySelector("#pc-entregar").onclick = (e) => { if (vm()) entregar(e.currentTarget); };
    document.title = `Reto ${reto} · Pinicratch`;
  }

  /* ---------- Modo profe: abrir el proyecto entregado ---------- */
  function modoProfe() {
    const d = leer("pinicratch-abrir");
    if (!d || !d.b64) { barra(`<span class="pc-tit">No hay ningún proyecto para abrir. Vuelve al panel y pulsa «Abrir en Pinicratch».</span>`); return; }
    barra(`<span class="pc-tit">👀 <b>${esc(d.titulo || "Proyecto entregado")}</b></span>`);
    cuandoVM(() => {
      const bin = atob(d.b64), buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      vm().loadProject(buf.buffer).then(() => { try { localStorage.removeItem("pinicratch-abrir"); } catch (e) {} if (reto && window.PinicratchRubricas) { const r = window.PinicratchRubricas.corregir(reto, proyecto()); panel(`<h3>Corrección automática</h3>${informe(r)}`); } })
        .catch(() => panel(`<h3>No se ha podido abrir</h3><p>El archivo no parece un proyecto de Scratch o Pinicratch.</p>`));
    });
  }

  function iniciar() {
    if (abrir === "profe") { modoProfe(); return; }
    if (RETOS[reto]) modoReto();
  }
  // La corrección vive en otro archivo; se carga aquí para no tocar index.html al recompilar.
  const sc = document.createElement("script");
  sc.src = "pinicratch-rubricas.js";
  sc.onload = () => { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar(); };
  document.head.appendChild(sc);
})();
