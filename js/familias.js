/*
  CONSULTA DE LAS FAMILIAS (#familias)
  La familia escribe su correo (el que el profe tiene en la pestaña Alumnado), recibe un código de 6 cifras
  por correo y, con él, ve solo los resultados de su hijo o hija. Todo lo comprueba el script de la hoja.
*/
window.Familias = (function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let raiz = null, correo = "", hijos = null, cab = [];

  async function llamar(cuerpo) {
    const R = window.REGISTRO || {};
    if (!R.url) return { ok: false, error: "La web no está conectada a la hoja del colegio." };
    try {
      const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(cuerpo) });
      const t = await r.text();
      try { return JSON.parse(t); } catch (e) { return { ok: false, error: "El servicio del colegio no está disponible ahora mismo." }; }
    } catch (e) { return { ok: false, error: "No se ha podido conectar. Revisa tu conexión a internet." }; }
  }

  function cabecera(sub) {
    return `<header class="rincon-cab" style="--rc:#2f6f8f"><div class="envoltura">
      <a class="volver-r" href="#">← Rincones</a>
      <div class="rincon-tit"><span class="rincon-ico" aria-hidden="true">👨‍👩‍👧</span><div><h1>Familias</h1><p>${sub}</p></div></div>
    </div></header>`;
  }

  function pintarAcceso(paso, aviso, tipo) {
    raiz.innerHTML = cabecera("Consulta los resultados de tu hijo o hija en Rumbo a Europa.") +
      `<div class="envoltura seccion">
        <form class="alumno" id="f-correo" autocomplete="on">
          <label for="f-email">Correo electrónico de la familia<input id="f-email" type="email" maxlength="120" value="${esc(correo)}" placeholder="El que diste en el colegio" autocomplete="email"></label>
          <button class="btn${paso === 2 ? " sec" : ""}" type="submit">${paso === 2 ? "Enviar otro código" : "Enviarme el código"}</button>
          ${paso === 2 ? "" : `<button class="btn sec" type="button" id="f-tengo">Ya tengo un código</button>`}
        </form>
        ${paso === 2 ? `<form class="alumno" id="f-cod" autocomplete="off" style="margin-top:16px">
          <label for="f-codigo">Código de 6 cifras<input id="f-codigo" inputmode="numeric" maxlength="6" placeholder="123456" autocomplete="one-time-code"></label>
          <button class="btn" type="submit">Ver resultados</button>
        </form>` : ""}
        <p class="estado" id="f-estado" data-tipo="${tipo || ""}" style="margin-top:12px">${esc(aviso || "")}</p>
        <p class="intro" style="margin-top:16px">Te mandaremos un código a tu correo. Solo verás los resultados del alumnado que el colegio tiene asociado a ese correo. El código que pides aquí caduca a los 15 minutos; el que te envía el profe por correo vale unos días.</p>
      </div>`;
    $("#f-correo").addEventListener("submit", async (e) => {
      e.preventDefault();
      correo = $("#f-email").value.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) { pintarAcceso(paso, "Escribe un correo válido.", "error"); return; }
      const est = $("#f-estado"); est.textContent = "Enviando…"; est.dataset.tipo = "";
      const j = await llamar({ accion: "familiaCodigo", correo });
      if (!j.ok) { pintarAcceso(paso, j.error, "error"); return; }
      pintarAcceso(2, j.mensaje + " Mira también la carpeta de correo no deseado.", "ok");
      const c = $("#f-codigo"); if (c) c.focus();
    });
    const tengo = $("#f-tengo");
    if (tengo) tengo.onclick = () => {
      correo = $("#f-email").value.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) { pintarAcceso(1, "Escribe primero tu correo.", "error"); return; }
      pintarAcceso(2, "Escribe el código que te llegó por correo.", "");
      const c = $("#f-codigo"); if (c) c.focus();
    };
    const fc = $("#f-cod");
    if (fc) fc.addEventListener("submit", async (e) => {
      e.preventDefault();
      const codigo = $("#f-codigo").value.trim(), est = $("#f-estado");
      if (!/^\d{6}$/.test(codigo)) { est.textContent = "El código tiene 6 cifras."; est.dataset.tipo = "error"; return; }
      est.textContent = "Comprobando…"; est.dataset.tipo = "";
      const j = await llamar({ accion: "familiaDatos", correo, codigo });
      if (!j.ok) { est.textContent = j.error; est.dataset.tipo = "error"; return; }
      hijos = j.hijos || []; cab = j.cab || [];
      pintarResultados();
    });
  }

  /* ---------- Resultados (rediseño 25-nov) ----------
     1) Qué ha hecho y qué le falta, rincón a rincón, solo de lo que ya está abierto (js/sa-abiertas.js).
     2) Indicadores de logro en lenguaje sencillo: qué retos agrupa cada uno, cuáles faltan y la nota con lo hecho.
     La nota de cada indicador se calcula como «Notas para el Excel» del script (prepararExcel):
       - Crea, Piensa, PiniCraft y Scratch: la nota de cada actividad en ese indicador (la última; la del profe manda).
       - Programa (pantallas de los países): mejor nota de cada pantalla, sumadas y divididas entre todas las del
         indicador (las no hechas cuentan 0).
       - Robótica: igual, por modalidad, y vale la modalidad en la que mejor va.
       - Al final, media de todo lo anterior, redondeada a un número entero. */
  const APROBADO = 2.5;
  const ICONO = { crea: "🎨", prog: "💻", rob: "🤖", piensa: "🧠" };
  const simple = (c, cod, a) => {
    const P = window.Profe;
    if (a && a.adaptado && ((window.INDICADORES_AC || {})[c] || {})[cod]) return window.INDICADORES_AC[c][cod];
    return ((window.INDICADORES_FAMILIAS || {})[c] || {})[cod] || String(P.textoInd(c, cod, a)).replace(/^[A-Z0-9 ·]+:\s*/, "");
  };
  const fmt = (v) => String(Math.round(v * 10) / 10).replace(".", ",");

  // ¿Está abierta? "si", "extra" (Piensa ExtraTIC: voluntaria) o "no".
  function abierta(x, c) {
    const S = window.SA;
    if (!S) return "si";
    if (x.rincon === "crea") { const m = /^(SA\d)/.exec(x.titulo); return !m || S.abierta(m[1]) ? "si" : "no"; }
    if (x.rincon === "prog") return x.sa ? (S.abierta(x.sa) ? "si" : "no") : Number.isInteger(x.idx) ? (S.programa(x.grupo) ? "si" : "no") : "si";
    if (x.rincon === "rob") return S.robotica(x.grupo, x.n - 1) ? "si" : "no";
    if (x.rincon === "piensa") {
      const p = (window.PIENSA || []).find((q) => q.titulo === x.titulo) || {}, ses = (c === "6º" ? p.sa6 : p.sa5) || "";
      if (/extra/i.test(ses)) return window.EXTRATIC_ABIERTO ? "extra" : "no";
      return S.abierta(ses) ? "si" : "no";
    }
    return "si";
  }

  // Todas las notas de una actividad (también con códigos antiguos de indicador).
  function notasAct(a, x) {
    const pre = String(x.destino).slice(0, 60) + " · Ind. ";
    return Object.keys(a.notas).filter((k) => k.indexOf(pre) === 0).map((k) => normal(x, a.notas[k]));
  }
  // Las pantallas de 6.º B del 10-nov llevan decimales (reparto de 5 puntos): son pantallas superadas → 3.
  const normal = (x, v) => (x.rincon === "prog" && v % 1 !== 0 ? 3 : v);
  function notaInd(a, x, cod, c) {
    let v = a.notas[window.Profe.columna(x.destino, cod)];
    // 6.º: la presentación de PowerPoint (Crea SA1 S2) era el 3.1.2 y ahora es el 3.1.4 (igual que prepararExcel).
    if (v === undefined && c === "6º" && cod === "3.1.4" && /SA1 S2/.test(x.titulo)) v = a.notas[window.Profe.columna(x.destino, "3.1.2")];
    return v === undefined ? null : normal(x, v);
  }
  // "ok" superado · "corregir" terminado y sin nota del profe · "mejorar" hecho con nota baja · "falta" sin hacer
  function estado(a, x) {
    const v = notasAct(a, x);
    if (v.length) return v.reduce((s, n) => s + n, 0) / v.length >= APROBADO ? "ok" : "mejorar";
    if ((x.rincon === "crea" || x.terminable) && a.terminados[x.destino.slice(0, 60)]) return "corregir";
    return "falta";
  }
  const hecho = (e) => e === "ok" || e === "corregir";
  const TXT = { ok: "✓ Superado", corregir: "✓ Terminado · falta la nota del profe", mejorar: "↻ Hecho, pero se puede mejorar", falta: "○ Le falta" };

  function datosHijo(h) {
    const P = window.Profe, c = /6/.test(h.clase || "") ? "6º" : "5º";
    const a = { notas: P.notasDe(cab, h.fila, c), terminados: {}, adaptado: !!h.adaptado };
    (h.hechos || []).forEach(([destino, programa, fecha]) => { a.terminados[String(destino).slice(0, 60)] = { ruta: String(programa || "").replace(/^Terminado ·\s*/, ""), fecha }; });
    const items = P.catalogo(c, a).filter((x) => x.inds.length).map((x) => Object.assign({}, x, { ab: abierta(x, c) }));
    items.forEach((x) => (x.est = estado(a, x)));
    // Solo lo abierto, salvo que ya tenga trabajo hecho en algo cerrado.
    const vis = items.filter((x) => x.ab !== "no" || x.est !== "falta");
    return { c, a, vis, com: h.comentarios || {} };
  }

  /* ---- 1) Retos por rincón ---- */
  function filaAct(d, x, conCom) {
    const P = window.Profe;
    const notas = x.inds.map((cod) => notaInd(d.a, x, cod, d.c)).filter((v) => v !== null);
    const coms = conCom ? x.inds.map((cod) => [cod, d.com[P.columna(x.destino, cod)]]).filter((p) => p[1]) : [];
    const t = d.a.terminados[x.destino.slice(0, 60)];
    return `<li class="fa-item ${x.est}"><span class="fa-marca" aria-hidden="true">${x.est === "ok" || x.est === "corregir" ? "✓" : x.est === "mejorar" ? "↻" : "○"}</span>
      <div><b>${esc(x.titulo)}</b>${x.ab === "extra" ? ` <span class="fa-extra">extra · voluntaria</span>` : ""}
      <small>${TXT[x.est]}${t && t.ruta ? ` · ruta ${esc(t.ruta)}` : ""}${notas.length ? ` · nota media <b>${fmt(notas.reduce((s, v) => s + v, 0) / notas.length)}</b> de 5` : ""}</small>
      ${coms.length ? `<ul class="fa-com">${coms.map((p) => `<li>💬 <span>${esc(simple(d.c, p[0], d.a).replace(/\.$/, ""))}:</span> ${esc(p[1])}</li>`).join("")}</ul>` : ""}</div></li>`;
  }
  function chipsPantallas(lista) {
    return `<div class="fa-chips">${lista.map((x) => `<span class="fa-chip ${x.est}" title="${esc(TXT[x.est])}">${x.est === "ok" ? "✓ " : x.est === "mejorar" ? "↻ " : ""}${esc(x.ciudad || x.titulo)}</span>`).join("")}</div>`;
  }
  const faltanTxt = (lista, uno, varios) => {
    const f = lista.filter((x) => x.est === "falta"), m = lista.filter((x) => x.est === "mejorar");
    const L = [];
    if (f.length) L.push(`<b>Le ${f.length === 1 ? "falta 1 " + uno : "faltan " + f.length + " " + varios}:</b> ${f.map((x) => esc(x.ciudad || x.titulo)).join(", ")}.`);
    if (m.length) L.push(`<b>Para mejorar (nota de 2 o menos):</b> ${m.map((x) => esc(x.ciudad || x.titulo)).join(", ")}.`);
    return L.length ? `<p class="fa-falta">${L.join("<br>")}</p>` : `<p class="fa-falta ok">¡Todo superado! 🎉</p>`;
  };

  function rinconHTML(d, r) {
    const xs = d.vis.filter((x) => x.rincon === r.id);
    let cuerpo = "", hechos = 0, total = 0;
    if (r.id === "crea" || r.id === "piensa") {
      const obl = xs.filter((x) => x.ab !== "extra"), ext = xs.filter((x) => x.ab === "extra");
      hechos = obl.filter((x) => hecho(x.est)).length; total = obl.length;
      const extHechas = ext.filter((x) => x.est !== "falta");
      cuerpo = (obl.length ? `<ul class="fa-lista">${obl.map((x) => filaAct(d, x, r.id === "crea")).join("")}</ul>` : `<p class="intro">Todavía no hay actividades abiertas.</p>`) +
        (ext.length ? `<p class="fa-nota">Actividades extra (voluntarias): ${extHechas.length ? `ha hecho ${extHechas.map((x) => "«" + esc(x.titulo) + "»").join(", ")}` : "todavía no ha hecho ninguna"}. ${ext.length - extHechas.length ? `Puede hacer también: ${ext.filter((x) => x.est === "falta").map((x) => "«" + esc(x.titulo) + "»").join(", ")}.` : ""}</p>` +
          (extHechas.length ? `<ul class="fa-lista">${extHechas.map((x) => filaAct(d, x, false)).join("")}</ul>` : "") : "");
    } else if (r.id === "prog") {
      const grupos = {};
      xs.forEach((x) => { const k = String(x.grupo); (grupos[k] = grupos[k] || { nombre: x.nombreGrupo || ((window.AVENTURAS || [])[x.grupo] || {}).nombre || "Aventura", items: [] }).items.push(x); });
      cuerpo = Object.keys(grupos).map((k) => {
        const g = grupos[k], term = g.items.some((x) => x.terminable);
        const ok = g.items.filter((x) => hecho(x.est)).length; hechos += ok; total += g.items.length;
        if (term) return `<h4 class="fa-sub">${esc(g.nombre)} <span>${ok} de ${g.items.length}</span></h4><ul class="fa-lista">${g.items.map((x) => filaAct(d, x, false)).join("")}</ul>`;
        return `<h4 class="fa-sub">${esc(g.nombre)} <span>${ok} de ${g.items.length} pantallas</span></h4>${chipsPantallas(g.items)}${faltanTxt(g.items, "pantalla", "pantallas")}`;
      }).join("") || `<p class="intro">Todavía no hay pantallas abiertas.</p>`;
    } else if (r.id === "rob") {
      const modos = {};
      xs.forEach((x) => (modos[x.grupo] = modos[x.grupo] || []).push(x));
      const nombre = (k) => ((((window.Robotica || {}).MODOS || {})[k]) || {}).nombre || k;
      const empezados = Object.keys(modos).filter((k) => modos[k].some((x) => x.est !== "falta"));
      // Para el resumen cuenta la modalidad en la que más retos lleva (en la nota vale la mejor).
      Object.keys(modos).forEach((k) => { const ok = modos[k].filter((x) => hecho(x.est)).length; if (ok > hechos || !total) { hechos = Math.max(hechos, ok); total = modos[k].length; } });
      cuerpo = `<p class="fa-nota">Hay ${Object.keys(modos).length} modalidades (${Object.keys(modos).map(nombre).join(", ")}). Cada alumno trabaja la suya: para la nota vale la modalidad en la que mejor va.</p>` +
        (empezados.length ? empezados.map((k) => {
          const ok = modos[k].filter((x) => hecho(x.est)).length;
          return `<h4 class="fa-sub">${esc(nombre(k))} <span>${ok} de ${modos[k].length} retos</span></h4>${chipsPantallas(modos[k].map((x) => Object.assign({}, x, { ciudad: `${x.n}. ${x.reto}` })))}${faltanTxt(modos[k].map((x) => Object.assign({}, x, { ciudad: `${x.n}. ${x.reto}` })), "reto", "retos")}`;
        }).join("") : `<p class="fa-falta"><b>Todavía no ha empezado ninguna modalidad.</b></p>`);
    }
    const pct = total ? Math.round(100 * hechos / total) : 0;
    return { hechos, total, html: `<section class="fa-rincon" style="--rc:${r.color}">
        <h3><span aria-hidden="true">${ICONO[r.id]}</span> ${r.nombre} <span class="fa-cuenta">${hechos} de ${total}</span></h3>
        <div class="fa-barra" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${hechos}"><span style="width:${pct}%"></span></div>
        ${cuerpo}</section>` };
  }

  /* ---- 2) Indicadores ---- */
  function indicadores(d) {
    const por = {};
    const de = (cod) => (por[cod] = por[cod] || { acts: [], prog: null, rob: {} });
    d.vis.forEach((x) => {
      if (x.rincon === "prog" && Number.isInteger(x.idx)) {
        x.inds.slice(0, 1).forEach((cod) => { const o = de(cod); o.prog = o.prog || { items: [] }; o.prog.items.push(x); });
      } else if (x.rincon === "rob") {
        x.inds.slice(0, 1).forEach((cod) => { const o = de(cod); (o.rob[x.grupo] = o.rob[x.grupo] || []).push(x); });
      } else x.inds.forEach((cod) => de(cod).acts.push(x));
    });
    const reparto = (items) => {
      let s = 0, h = 0;
      items.forEach((x) => { const v = notaInd(d.a, x, x.inds[0], d.c); if (v !== null) { s += v; h++; } });
      return h ? Math.round(s / items.length) : null;
    };
    return Object.keys(por).sort((x, y) => x.localeCompare(y, "es", { numeric: true })).map((cod) => {
      const o = por[cod], partes = [], falta = [], vals = [];
      o.acts.forEach((x) => {
        const v = notaInd(d.a, x, cod, d.c);
        if (x.ab === "extra" && v === null) return;   // extra no hecha: ni cuenta ni falta
        if (v !== null) vals.push(v);
        const nom = `${ICONO[x.rincon]} ${x.rincon === "crea" ? "Crea" : x.rincon === "piensa" ? "Piensa" : "Programa"} · ${x.titulo}`;
        const sinNota = v === null && x.est !== "falta";   // hecho o terminado, pero sin nota en este indicador
        partes.push(`<li class="${v !== null ? x.est : sinNota ? "corregir" : "falta"}">${esc(nom)}${x.ab === "extra" ? " (extra)" : ""} · ${v !== null ? `<b>${fmt(v)}</b>` : sinNota ? "hecho, falta la nota del profe" : "le falta"}</li>`);
        if (v === null && !sinNota) falta.push(esc(nom));
      });
      if (o.prog) {
        const it = o.prog.items, n = reparto(it), ok = it.filter((x) => hecho(x.est)).length;
        if (n !== null) vals.push(n);
        partes.push(`<li class="${ok === it.length ? "ok" : ok ? "mejorar" : "falta"}">💻 Programa · ${it.length} pantallas (${esc(it[0].ciudad)}…${esc(it[it.length - 1].ciudad)}) · ${ok} superadas${n !== null ? ` · <b>${n}</b>` : ""}</li>`);
        const f = it.filter((x) => x.est !== "ok");
        if (f.length) falta.push(`💻 Programa: ${f.map((x) => esc(x.ciudad)).join(", ")}`);
      }
      const mods = Object.keys(o.rob);
      if (mods.length) {
        const nombre = (k) => ((((window.Robotica || {}).MODOS || {})[k]) || {}).nombre || k;
        let mejor = null, km = null;
        mods.forEach((k) => { const n = reparto(o.rob[k]); if (n !== null && (mejor === null || n > mejor)) { mejor = n; km = k; } });
        if (mejor !== null) vals.push(mejor);
        if (km) {
          const it = o.rob[km], ok = it.filter((x) => hecho(x.est)).length;
          partes.push(`<li class="${ok === it.length ? "ok" : "mejorar"}">🤖 Robótica · ${esc(nombre(km))} · ${ok} de ${it.length} retos · <b>${mejor}</b></li>`);
          const f = it.filter((x) => x.est !== "ok");
          if (f.length) falta.push(`🤖 Robótica ${esc(nombre(km))}: retos ${f.map((x) => x.n).join(", ")}`);
        } else {
          partes.push(`<li class="falta">🤖 Robótica · ${o.rob[mods[0]].length} retos de una modalidad (${mods.map(nombre).join(", ")}) · le falta</li>`);
          falta.push("🤖 Robótica: empezar los retos de su modalidad");
        }
      }
      if (!partes.length) return "";
      const nota = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null;
      return `<article class="fa-ind">
        <div class="fa-ind-cab"><div><span class="cod-p">${esc(cod)}</span> <b>${esc(simple(d.c, cod, d.a))}</b></div>
          <div class="fa-nota-ind${nota === null ? " sin" : nota < 3 ? " baja" : ""}" title="Nota con lo hecho hasta hoy">${nota === null ? "–" : nota}<small>${nota === null ? "sin nota" : "de 5"}</small></div></div>
        <ul class="fa-partes">${partes.join("")}</ul>
        ${falta.length ? `<p class="fa-falta"><b>Le falta:</b> ${falta.join(" · ")}</p>` : nota === null ? `<p class="fa-falta">Hecho ✓ · falta que el profe ponga la nota.</p>` : `<p class="fa-falta ok">Todo hecho ✓</p>`}
      </article>`;
    }).join("");
  }

  function pintarResultados() {
    const P = window.Profe;
    if (!hijos.length) { raiz.innerHTML = cabecera("No hay alumnado asociado a este correo.") + `<div class="envoltura seccion"><p class="intro">Habla con el tutor o la tutora para que registre tu correo.</p></div>`; return; }
    const sa = window.SA ? window.SA.lista() : "";
    raiz.innerHTML = cabecera("Lo que ha hecho tu hijo o hija en los Rincones TIC y lo que le falta.") +
      `<div class="envoltura seccion">
        <p class="p-barra"><button type="button" class="btn sec" id="f-salir">Salir</button></p>
        ${hijos.map((h) => {
          const d = datosHijo(h), rs = P.RINC.map((r) => Object.assign({ r }, rinconHTML(d, r)));
          return `<section class="f-hijo">
            <h2 class="sa-tit">${esc(`${h.nombre || ""} ${h.apellidos || ""}`.trim())} · ${esc(window.normGrupo ? window.normGrupo(h.clase) : h.clase)}</h2>
            ${sa ? `<p class="intro">Solo aparece lo que ya se ha abierto en clase (ahora, la <b>${esc(sa)}</b>). Lo demás se irá añadiendo durante el curso.</p>` : ""}
            <h3 class="fa-tit">1. Retos: qué ha hecho y qué le falta</h3>
            <div class="p-resumen">${rs.map((x) => `<div style="--rc:${x.r.color}"><b>${ICONO[x.r.id]} ${x.r.nombre}</b><span>${x.hechos}/${x.total}</span><small>${x.total && x.hechos === x.total ? "¡todo hecho!" : x.total ? `le ${x.total - x.hechos === 1 ? "falta 1" : "faltan " + (x.total - x.hechos)}` : "nada abierto aún"}</small></div>`).join("")}</div>
            <p class="fa-leyenda"><span class="fa-chip ok">✓ superado</span> <span class="fa-chip mejorar">↻ se puede mejorar</span> <span class="fa-chip falta">le falta</span></p>
            ${rs.map((x) => x.html).join("")}
            <h3 class="fa-tit">2. Indicadores de logro y notas</h3>
            <p class="intro">Cada indicador es algo que tiene que aprender. Debajo de cada uno están los retos que lo trabajan, lo que le falta y la <b>nota de 0 a 5 que tiene con lo hecho hasta hoy</b>. En Programa y Robótica, las pantallas o retos sin hacer cuentan como 0, así que la nota sube al completarlos. Si el profe ha corregido una nota, vale la suya.</p>
            <div class="fa-inds">${indicadores(d) || `<p class="intro">Todavía no hay notas.</p>`}</div>
          </section>`;
        }).join("")}
        <p class="intro">Escala: 0 no hecho · 1 lo ha intentado · 2 ha conseguido una parte · 3 conseguido con ayuda · 4 casi del todo · 5 perfectamente.</p>
      </div>`;
    $("#f-salir").onclick = () => { hijos = null; cab = []; pintarAcceso(1); };
  }

  function pintar(r) {
    raiz = r;
    if (hijos) pintarResultados(); else pintarAcceso(1);
  }
  return { pintar };
})();
