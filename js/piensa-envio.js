/*
  PIENSA · ENVÍO AUTOMÁTICO DE LAS NOTAS (24-nov-2026, pedido del profe)
  ----------------------------------------------------------------------
  Se carga al final de cada actividad de piensa/*.html. En cuanto el alumno consigue la llave completa,
  las notas de cada indicador de su curso se mandan solas a la hoja (pestaña Resultados → Valoraciones →
  «Notas para el Excel»), igual que si pulsara «Enviar mi llave» en el rincón Piensa.
  El informe para enviar por correo a la profe sigue igual.
  - Mismas filas que js/rincones.js: destino «Piensa · Título», indicador, nota, programa «Llave …».
  - Se apunta también en este ordenador, así el rincón Piensa la ve como enviada.
  - Una misma llave no se manda dos veces. Sin sesión o sin conexión, avisa y se puede enviar desde el rincón.
*/
(function () {
  "use strict";
  if (typeof VAL_CFG === "undefined" || typeof valKey !== "function") return;   // facil.html y otras páginas sin llave
  const P = (window.PIENSA || []).find((p) => p.pre === VAL_CFG.pre);
  if (!P) return;
  const idx = (window.PIENSA || []).indexOf(P), total = (window.PIENSA || []).length;
  const ENVIADAS = "rumbo-piensa-enviadas";
  const leerJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } };
  const ponerJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const alumno = () => (leerJSON("rumbo-a-europa-v1", {}).alumno || {});
  const sesion = () => leerJSON("rumbo-sesion-alumno", null);
  const requiere = () => { try { return localStorage.getItem("rumbo-sesion-requiere") !== "no"; } catch (e) { return true; } };
  const sexto = () => /6/.test(String(alumno().clase || ""));

  function aviso(html, tipo) {
    let t = document.getElementById("piensa-envio-aviso");
    if (!t) {
      t = document.createElement("div"); t.id = "piensa-envio-aviso"; t.setAttribute("role", "status");
      t.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;max-width:min(560px,92vw);padding:12px 16px;border-radius:12px;font:700 1rem/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25)";
      document.body.appendChild(t);
    }
    t.style.background = tipo === "ok" ? "#2f8f5b" : tipo === "error" ? "#b3261e" : "#14225a";
    t.style.color = "#fff"; t.innerHTML = html; t.hidden = false;
    clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), tipo === "error" ? 15000 : 12000);
  }

  // Cifras de la llave → nota de cada indicador del curso (como leerLlave de js/rincones.js).
  function notasDe(llave) {
    const m = /^([A-Z]{3})-(\d*)-(\d*)-(\d+)-([0-9A-Z]{2})$/.exec(String(llave || "").toUpperCase());
    if (!m || m[1] !== P.pre) return null;
    const inds = (sexto() ? P.i6 : P.i5) || [], cifras = sexto() ? m[3] : m[2];
    if (!inds.length || cifras.length !== inds.length) return null;
    return inds.map(([cod], k) => [cod, Math.min(5, +cifras[k] || 0)]);
  }

  let enCurso = "";
  async function enviar(llave) {
    const a = alumno(), s = sesion(), R = window.REGISTRO || {};
    const yaKey = (a.usuario || a.nombre || "") + "|" + llave;
    const env = leerJSON(ENVIADAS, {});
    if (!llave || env[yaKey] || enCurso === yaKey) return;
    const notas = notasDe(llave); if (!notas) return;
    // Ya enviada antes desde el rincón Piensa (mismas notas en este ordenador): no se repite.
    const cursoN = sexto() ? "6" : "5", previas = leerJSON("rumbo-valoraciones-v1", {});
    if (notas.every(([cod, nota]) => { const r = previas[`piensa-${cursoN}-${P.pre}|${cod}`]; return r && Number(r.nota) === nota; })) { env[yaKey] = "rincón"; ponerJSON(ENVIADAS, env); return; }
    if (!R.url) return;
    if (requiere() && !(s && s.token)) { aviso("🔑 Tienes la llave, pero no has entrado con tu contraseña en Rumbo a Europa: vuelve al rincón Piensa y pulsa «Enviar mi llave».", "error"); return; }
    enCurso = yaKey;
    aviso("Enviando tus notas a tu profe…");
    const curso = sexto() ? "6" : "5", destino = ("Piensa · " + P.titulo);
    const base = { fecha: new Date().toISOString(), nombre: a.nombre || "(sin nombre)", usuario: a.usuario || "", clase: a.clase || "",
      destino, ciudad: P.titulo, estrellas: "", bloques: "", intentos: "", personaje: "Piensa", programa: "Llave " + llave };
    const ses = s ? { token: s.token, usuario: s.usuario, nombre: s.nombre, clase: s.clase } : {};
    let ok = true;
    for (const [cod, nota] of notas) {
      try {
        const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({}, base, { indicador: cod, valoracion: nota }, ses)) });
        let t = String(await r.text() || "").trim();
        if (t.charAt(0) === "{") { try { t = JSON.parse(t).ok ? "ok" : "no"; } catch (e) {} }
        if (t !== "ok") ok = false;
      } catch (e) { ok = false; }
    }
    enCurso = "";
    if (!ok) { aviso("No se han podido enviar tus notas. Vuelve al rincón Piensa y pulsa «Enviar mi llave».", "error"); return; }
    // Apuntado en este ordenador: el rincón Piensa la verá como enviada.
    const v = leerJSON("rumbo-valoraciones-v1", {});
    notas.forEach(([cod, nota]) => { v[`piensa-${curso}-${P.pre}|${cod}`] = { nota, codigo: cod, pantalla: "Piensa", actividad: P.titulo, intentos: 0, fecha: new Date().toISOString() }; });
    ponerJSON("rumbo-valoraciones-v1", v);
    env[yaKey] = new Date().toISOString(); ponerJSON(ENVIADAS, env);
    // Código de la parada siguiente (retos encadenados), si el servidor lo da.
    let codigo = "";
    try {
      const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({ accion: "retoCadena", op: "completar", secuencia: "piensa", indice: idx, total }, ses)) });
      const j = await r.json(); if (j && j.ok && j.codigo) codigo = String(j.codigo);
    } catch (e) {}
    aviso(`✓ Tus notas de «${P.titulo}» ya están en la hoja de tu profe.${codigo ? ` Código para la siguiente parada: <b>${codigo.replace(/[<>&]/g, "")}</b>` : ""} No olvides enviarle también tu informe por correo.`, "ok");
  }

  // La llave completa se calcula en valKey (también lo guarda el rincón): se envía en cuanto aparece.
  const orig = valKey;
  valKey = function (v) {
    const k = orig(v);
    try { if ((typeof valComplete !== "function" || valComplete(v.rows)) && k) setTimeout(() => enviar(k), 0); } catch (e) {}
    return k;
  };
  // Llave conseguida antes (por ejemplo, sin conexión): se intenta al abrir la actividad.
  const g = (leerJSON("rumbo-piensa-llaves", {}) || {})[P.pre];
  if (g && g.completa && g.llave) setTimeout(() => enviar(g.llave), 1500);
})();
