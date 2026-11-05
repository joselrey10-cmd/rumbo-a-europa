/*
  PANEL DEL PROFESOR (#profe)
  Lee la pestaña "Valoraciones" de la hoja de Google con la clave del profesor (CLAVE_PROFE en el script)
  y permite ver por grupo y por alumno las notas de los cuatro rincones, y poner o corregir notas.
  Las notas que pone el profe se envían a la misma hoja como "Nota del profe".
*/
window.Profe = (function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const GRUPOS = ["5ºA", "5ºB", "6ºA", "6ºB"];
  const RINC = [
    { id: "crea", nombre: "Crea", color: "#e07a1f" }, { id: "prog", nombre: "Programa", color: "#3a7bd5" },
    { id: "rob", nombre: "Robótica", color: "#2f8f5b" }, { id: "piensa", nombre: "Piensa", color: "#8a4fd8" }
  ];
  const CLAVE_SES = "rumbo-profe-clave";
  let raiz = null, datos = null, grupo = "5ºA", alumnoSel = null, extra = [];

  const cursoDe = (g) => (/^\s*6/.test(g || "") ? "6º" : "5º");
  const igual = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
  const textoInd = (c, cod) => ((window.INDICADORES || {})[c] || {})[cod] || "";
  const columna = (destino, cod) => String(destino).slice(0, 60) + " · Ind. " + cod;

  /* Todas las actividades de un curso, con su texto de "Actividad" tal como llega a la hoja. */
  function catalogo(c) {
    const L = [];
    ((window.CREA || {})[c] || []).forEach((a) => L.push({ rincon: "crea", titulo: `${a.sa} ${a.s} · ${a.titulo}`, destino: `Crea · ${a.sa} ${a.s} · ${a.titulo}`, ciudad: a.titulo, inds: a.ind }));
    (window.PROG_NIVELES || []).forEach((n, i) => {
      const cod = ((window.INDICADOR_PROGRAMACION || {})[c] || {})[n.ciudad];
      L.push({ rincon: "prog", titulo: `${i + 1}. ${n.ciudad}`, destino: `Programación · ${i + 1}. ${n.ciudad}`, ciudad: n.ciudad, inds: cod ? [cod] : [] });
    });
    const R = window.Robotica || {};
    Object.keys(R.MODOS || {}).forEach((k) => (R.RETOS || []).forEach((r, i) => {
      const cod = (((window.INDICADOR_ROBOTICA || {})[c] || {})[k] || [])[i];
      L.push({ rincon: "rob", titulo: `${R.MODOS[k].nombre} · ${r.titulo}`, destino: `Robótica · ${R.MODOS[k].nombre} · reto ${i + 1}`, ciudad: r.titulo, inds: cod ? [cod] : [] });
    }));
    (window.PIENSA || []).forEach((p) => L.push({ rincon: "piensa", titulo: p.titulo, destino: `Piensa · ${p.titulo}`, ciudad: p.titulo, inds: (c === "6º" ? p.i6 : p.i5).map((x) => x[0]) }));
    return L;
  }

  /* Convierte la hoja en alumnos: { nombre, usuario, clase, notas: { columna: nota } } */
  function alumnos() {
    if (!datos) return [];
    const cab = datos.cab.map(String);
    const iN = cab.indexOf("Nombre"), iU = cab.indexOf("Usuario Educacyl"), iC = cab.indexOf("Clase");
    const lista = datos.filas.map((f) => {
      const notas = {};
      cab.forEach((t, i) => { if (/ · Ind\. /.test(t) && f[i] !== "" && f[i] != null) notas[t] = Number(f[i]); });
      return { nombre: String(f[iN] || ""), usuario: iU >= 0 ? String(f[iU] || "") : "", clase: String(f[iC] || ""), notas, terminados: {} };
    });
    // Retos de Crea terminados (aunque el alumno aún no tenga notas)
    (datos.hechos || []).forEach(([nombre, usuario, clase, destino, programa, fecha]) => {
      let a = lista.find((x) => usuario ? igual(x.usuario, usuario) : (igual(x.nombre, nombre) && igual(x.clase, clase)));
      if (!a) { a = { nombre: String(nombre || ""), usuario: String(usuario || ""), clase: String(clase || ""), notas: {}, terminados: {} }; lista.push(a); }
      a.terminados[String(destino)] = { ruta: String(programa || "").replace(/^Terminado ·\s*/, ""), fecha };
    });
    extra.forEach((x) => { x.terminados = x.terminados || {}; if (!lista.some((a) => igual(a.nombre, x.nombre) && igual(a.clase, x.clase))) lista.push(x); });
    return lista;
  }
  const delGrupo = () => alumnos().filter((a) => igual(a.clase, grupo)).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  function resumen(a, c) {
    const cat = catalogo(c), out = {};
    RINC.forEach((r) => {
      const notas = [], total = cat.filter((x) => x.rincon === r.id).reduce((n, x) => n + x.inds.length, 0);
      cat.filter((x) => x.rincon === r.id).forEach((x) => x.inds.forEach((cod) => { const v = a.notas[columna(x.destino, cod)]; if (v !== undefined) notas.push(v); }));
      out[r.id] = { retos: r.id === "crea" ? cat.filter((x) => x.rincon === "crea" && a.terminados && a.terminados[x.destino.slice(0, 60)]).length : 0, nRetos: cat.filter((x) => x.rincon === r.id).length, hechas: notas.length, total, media: notas.length ? Math.round(notas.reduce((s, v) => s + v, 0) / notas.length * 10) / 10 : null };
    });
    return out;
  }
  function mediasInd(lista, c) {
    const cat = catalogo(c), por = {};
    lista.forEach((a) => cat.forEach((x) => x.inds.forEach((cod) => {
      const v = a.notas[columna(x.destino, cod)];
      if (v !== undefined) (por[cod] = por[cod] || []).push(v);
    })));
    return Object.keys(por).sort((x, y) => x.localeCompare(y, "es", { numeric: true })).map((cod) => ({ cod, n: por[cod].length, media: Math.round(por[cod].reduce((s, v) => s + v, 0) / por[cod].length * 10) / 10 }));
  }

  /* ---------- Pintar ---------- */
  function cab(sub) {
    return `<header class="rincon-cab" style="--rc:#14225a"><div class="envoltura">
      <a class="volver-r" href="#">← Rincones</a>
      <div class="rincon-tit"><span class="rincon-ico" aria-hidden="true">🧑‍🏫</span><div><h1>Panel del profesor</h1><p>${sub}</p></div></div>
    </div></header>`;
  }
  function pintarClave(error) {
    let guardada = ""; try { guardada = sessionStorage.getItem(CLAVE_SES) || ""; } catch (e) {}
    raiz.innerHTML = cab("Mira las notas de cada grupo y de cada alumno, y pon o corrige notas desde tu ordenador.") +
      `<div class="envoltura seccion"><form class="alumno" id="p-form" autocomplete="off">
        <label for="p-clave">Clave del profesor<input id="p-clave" type="password" value="${esc(guardada)}" placeholder="La que pusiste en el script"></label>
        <button class="btn" type="submit" id="p-entrar">Entrar</button>
        <span class="estado" data-tipo="${error ? "error" : ""}" id="p-estado">${esc(error || "")}</span>
      </form>
      <p class="intro" style="margin-top:16px">La clave se escribe en el script de la hoja de Google (CLAVE_PROFE). El alumnado no la ve.</p></div>`;
    $("#p-form").addEventListener("submit", (e) => { e.preventDefault(); cargar($("#p-clave").value.trim()); });
    if (guardada && !error && !datos) cargar(guardada);
  }
  async function cargar(clave) {
    const R = window.REGISTRO || {}, est = $("#p-estado");
    if (!R.url) { if (est) { est.textContent = "La hoja de Google no está configurada (REGISTRO.url)."; est.dataset.tipo = "error"; } return; }
    if (!clave) return;
    if (est) { est.textContent = "Cargando…"; est.dataset.tipo = ""; }
    try {
      const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ accion: "datos", clave }) });
      const t = await r.text();
      let j; try { j = JSON.parse(t); } catch (e) { throw new Error("La hoja no ha devuelto datos. Pega el script nuevo en Apps Script y crea una nueva versión."); }
      if (!j.ok) throw new Error(j.error || "No se han podido leer los datos.");
      try { sessionStorage.setItem(CLAVE_SES, clave); } catch (e) {}
      datos = j; pintarGrupo();
    } catch (e) {
      try { sessionStorage.removeItem(CLAVE_SES); } catch (x) {}
      pintarClave(e.message === "Failed to fetch" ? "No se ha podido conectar con la hoja de Google." : e.message);
    }
  }

  function barraGrupos() {
    return `<div class="p-barra"><div class="rutas p-grupos" role="radiogroup" aria-label="Grupo">${GRUPOS.map((g) => `<button type="button" role="radio" class="ruta p-grupo" aria-checked="${g === grupo}" data-g="${g}"><b>${g}</b></button>`).join("")}</div>
      <button type="button" class="btn sec" id="p-recargar">Recargar datos</button><button type="button" class="btn sec" id="p-salir">Salir</button></div>`;
  }
  function pintarGrupo() {
    alumnoSel = null;
    const c = cursoDe(grupo), lista = delGrupo();
    raiz.innerHTML = cab(`Grupo ${grupo} · indicadores de ${c}. Pulsa un alumno para ver y poner sus notas.`) +
      `<div class="envoltura seccion">${barraGrupos()}
      <h2 class="sa-tit">Alumnado de ${grupo} (${lista.length})</h2>
      ${lista.length ? `<div class="tabla-scroll"><table class="p-tabla"><thead><tr><th>Alumno</th><th>Usuario Educacyl</th>${RINC.map((r) => `<th style="color:${r.color}">${r.nombre}</th>`).join("")}<th>Media</th></tr></thead><tbody>
        ${lista.map((a, i) => {
          const res = resumen(a, c), todas = RINC.map((r) => res[r.id]).filter((x) => x.media !== null);
          const hechas = todas.reduce((s, x) => s + x.hechas, 0);
          const media = hechas ? Math.round(todas.reduce((s, x) => s + x.media * x.hechas, 0) / hechas * 10) / 10 : "–";
          return `<tr><td><button type="button" class="p-alumno" data-i="${i}">${esc(a.nombre || "(sin nombre)")}</button></td><td>${esc(a.usuario)}</td>
            ${RINC.map((r) => `<td>${res[r.id].media === null ? "–" : `<b>${res[r.id].media}</b>`}<small>${res[r.id].hechas}/${res[r.id].total} notas</small>${r.id === "crea" ? `<small>✓ ${res.crea.retos}/${res.crea.nRetos} retos</small>` : ""}</td>`).join("")}<td><b>${media}</b></td></tr>`;
        }).join("")}</tbody></table></div>` : `<p class="intro">Todavía no hay notas de este grupo en la hoja.</p>`}
      <form class="alumno p-nuevo" id="p-nuevo" autocomplete="off">
        <label>Añadir alumno a ${grupo}<input id="p-n-nombre" maxlength="30" placeholder="Nombre y apellido"></label>
        <label>Usuario Educacyl<input id="p-n-usuario" maxlength="60" placeholder="nombre.apellido"></label>
        <button class="btn sec" type="submit">Añadir y poner notas</button>
      </form>
      <h2 class="sa-tit">Media de cada indicador en ${grupo}</h2>
      ${mediasTabla(lista, c)}
      </div>`;
    $("#p-nuevo").addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre = $("#p-n-nombre").value.trim(); if (!nombre) return;
      const a = { nombre, usuario: $("#p-n-usuario").value.trim(), clase: grupo, notas: {} };
      extra.push(a); pintarAlumno(a);
    });
    raiz.querySelectorAll(".p-alumno").forEach((b) => b.onclick = () => pintarAlumno(lista[+b.dataset.i]));
  }
  function mediasTabla(lista, c) {
    const m = mediasInd(lista, c);
    if (!m.length) return `<p class="intro">Sin datos todavía.</p>`;
    return `<div class="tabla-scroll"><table class="p-tabla p-medias"><thead><tr><th>Ind.</th><th>Indicador de logro</th><th>Notas</th><th>Media</th></tr></thead><tbody>
      ${m.map((x) => `<tr><td><span class="cod-p">${x.cod}</span></td><td>${esc(textoInd(c, x.cod))}</td><td>${x.n}</td><td><b>${x.media}</b></td></tr>`).join("")}</tbody></table></div>`;
  }

  function chips(col, valor) {
    return `<div class="chips" role="radiogroup" aria-label="Nota de 0 a 5" data-col="${esc(col)}">${[0, 1, 2, 3, 4, 5].map((n) =>
      `<button type="button" role="radio" aria-checked="${valor === n}" data-n="${n}">${n}</button>`).join("")}</div>`;
  }
  function pintarAlumno(a) {
    alumnoSel = a;
    const c = cursoDe(a.clase), cat = catalogo(c), res = resumen(a, c);
    raiz.innerHTML = cab(`${esc(a.nombre)} · ${esc(a.clase)}${a.usuario ? " · " + esc(a.usuario) : ""} · indicadores de ${c}`) +
      `<div class="envoltura seccion">
      <p class="p-barra"><button type="button" class="btn sec" id="p-volver">← Volver a ${esc(a.clase)}</button></p>
      <div class="p-resumen">${RINC.map((r) => `<div style="--rc:${r.color}"><b>${r.nombre}</b><span>${res[r.id].media === null ? "–" : res[r.id].media}</span><small>${res[r.id].hechas} de ${res[r.id].total} con nota${r.id === "crea" ? ` · ✓ ${res.crea.retos}/${res.crea.nRetos} retos terminados` : ""}</small></div>`).join("")}</div>
      <p class="intro">Las casillas marcadas son las notas que ya hay en la hoja. En Crea, el alumno solo marca el reto como terminado: la nota de cada indicador la pones tú aquí. Cambia las que quieras y pulsa Enviar en esa actividad.</p>
      ${RINC.map((r) => `<details class="p-rincon" ${r.id === "crea" ? "open" : ""}><summary style="color:${r.color}">${r.nombre}</summary>
        <div class="retos-r">${cat.map((x, k) => ({ x, k })).filter(({ x }) => x.rincon === r.id && x.inds.length).map(({ x, k }) => `
          <article class="reto-r" data-k="${k}">
            <div class="reto-r-cab"><h3>${esc(x.titulo)}</h3>${x.rincon === "crea" ? (() => { const t = (a.terminados || {})[x.destino.slice(0, 60)]; return t ? `<span class="p-hecho">✓ Terminado${t.ruta && t.ruta !== "Todos" ? " · " + esc(t.ruta) : ""}${t.fecha && !isNaN(new Date(t.fecha)) ? " · " + new Date(t.fecha).toLocaleDateString("es-ES") : ""}</span>` : `<span class="p-hecho no">Sin terminar</span>`; })() : ""}</div>
            <div class="inds">${x.inds.map((cod) => { const col = columna(x.destino, cod); return `<div class="fila-ind"><div class="fila-ind-t"><span class="cod">Ind. ${cod}</span> ${esc(textoInd(c, cod))}</div>${chips(col, a.notas[col])}</div>`; }).join("")}</div>
            <div class="enviar-fila"><button type="button" class="btn enviar-p">Enviar</button><span class="estado" aria-live="polite"></span></div>
          </article>`).join("")}</div></details>`).join("")}
      </div>`;
    $("#p-volver").onclick = pintarGrupo;
    window.scrollTo(0, 0);
  }

  async function enviarProfe(caja) {
    const a = alumnoSel, x = catalogo(cursoDe(a.clase))[+caja.dataset.k], est = $(".estado", caja), filas = [];
    caja.querySelectorAll(".chips").forEach((g, i) => {
      const b = g.querySelector('[aria-checked="true"]');
      if (!b) return;
      const nota = +b.dataset.n, cod = x.inds[i];
      if (a.notas[g.dataset.col] === nota) return;   // sin cambios
      filas.push({ col: g.dataset.col, nota, d: { nombre: a.nombre, usuario: a.usuario, clase: a.clase, destino: x.destino, ciudad: x.ciudad, personaje: "Profe", programa: "Nota del profe", indicador: cod, valoracion: nota } });
    });
    if (!filas.length) { est.textContent = "No hay notas nuevas o cambiadas."; est.dataset.tipo = "error"; return; }
    const btn = $(".enviar-p", caja); btn.disabled = true; est.textContent = "Enviando…"; est.dataset.tipo = "";
    const ok = await window.Valoraciones.enviarVarias(filas.map((f) => f.d));
    btn.disabled = false;
    if (ok) filas.forEach((f) => { a.notas[f.col] = f.nota; });
    est.textContent = ok ? `✓ Enviado: ${filas.length} ${filas.length === 1 ? "nota" : "notas"}.` : "No se ha podido enviar. Revisa la conexión.";
    est.dataset.tipo = ok ? "ok" : "error";
  }

  function pintar(r) {
    raiz = r;
    if (!r.dataset.profe) {
      r.dataset.profe = "1";
      r.addEventListener("click", (e) => {
        if (location.hash !== "#profe") return;
        const chip = e.target.closest(".chips button");
        if (chip) { chip.parentElement.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b === chip))); return; }
        const g = e.target.closest(".p-grupo"); if (g) { grupo = g.dataset.g; pintarGrupo(); return; }
        if (e.target.closest("#p-recargar")) { let k = ""; try { k = sessionStorage.getItem(CLAVE_SES) || ""; } catch (x) {} datos = null; pintarClave(); cargar(k); return; }
        if (e.target.closest("#p-salir")) { try { sessionStorage.removeItem(CLAVE_SES); } catch (x) {} datos = null; pintarClave(); return; }
        const env = e.target.closest(".enviar-p"); if (env) enviarProfe(env.closest(".reto-r"));
      }, true);
    }
    if (!datos) pintarClave();
    else if (alumnoSel) pintarAlumno(alumnoSel);
    else pintarGrupo();
  }
  return { pintar, catalogo };
})();
