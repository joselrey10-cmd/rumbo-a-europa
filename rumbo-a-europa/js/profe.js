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
    // 1) Alumnado importado (pestaña Alumnado): nombre, apellidos, usuario, clase, correo de la familia
    const lista = (datos.alumnado || []).filter((f) => f[2]).map((f) => ({
      nombre: `${f[0] || ""} ${f[1] || ""}`.trim(), usuario: String(f[2] || ""), clase: String(f[3] || ""), correo: String(f[4] || ""), notas: {}, terminados: {}, registrado: true
    }));
    // 2) Notas de la pestaña Valoraciones
    datos.filas.forEach((f) => {
      const notas = notasDe(cab, f);
      const u = iU >= 0 ? String(f[iU] || "") : "", n = String(f[iN] || ""), c = String(f[iC] || "");
      let a = lista.find((x) => u ? igual(x.usuario, u) : (igual(x.nombre, n) && igual(x.clase, c)));
      if (a) Object.assign(a.notas, notas);
      else lista.push({ nombre: n, usuario: u, clase: c, correo: "", notas, terminados: {} });
    });
    // Autoevaluación (pestaña aparte)
    const av = datos.autoeval || [];
    if (av.length > 1) {
      const ac = av[0].map(String);
      av.slice(1).forEach((f) => {
        const u = String(f[2] || ""), n = String(f[1] || ""), c = String(f[3] || "");
        let a = lista.find((x) => u ? igual(x.usuario, u) : (igual(x.nombre, n) && igual(x.clase, c)));
        if (!a) { a = { nombre: n, usuario: u, clase: c, correo: "", notas: {}, terminados: {} }; lista.push(a); }
        a.auto = {}; a.autoFecha = f[0];
        ac.forEach((t, i) => { if (/ · Ind\. /.test(t) && f[i] !== "" && f[i] != null) a.auto[t] = Number(f[i]); });
      });
    }
    // Retos de Crea terminados (aunque el alumno aún no tenga notas)
    (datos.hechos || []).forEach(([nombre, usuario, clase, destino, programa, fecha]) => {
      let a = lista.find((x) => usuario ? igual(x.usuario, usuario) : (igual(x.nombre, nombre) && igual(x.clase, clase)));
      if (!a) { a = { nombre: String(nombre || ""), usuario: String(usuario || ""), clase: String(clase || ""), notas: {}, terminados: {} }; lista.push(a); }
      a.terminados[String(destino)] = { ruta: String(programa || "").replace(/^Terminado ·\s*/, ""), fecha };
    });
    extra.forEach((x) => { x.terminados = x.terminados || {}; if (!lista.some((a) => igual(a.nombre, x.nombre) && igual(a.clase, x.clase))) lista.push(x); });
    return lista;
  }
  function notasDe(cab, f) {
    const notas = {};
    (cab || []).forEach((t, i) => { t = String(t); if (/ · Ind\. /.test(t) && f && f[i] !== "" && f[i] != null) notas[t] = Number(f[i]); });
    return notas;
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
          return `<tr><td><button type="button" class="p-alumno" data-i="${i}">${esc(a.nombre || "(sin nombre)")}</button></td><td>${esc(a.usuario)}${a.correo ? ` <span title="${esc(a.correo)}">✉️</span>` : ""}</td>
            ${RINC.map((r) => `<td>${res[r.id].media === null ? "–" : `<b>${res[r.id].media}</b>`}<small>${res[r.id].hechas}/${res[r.id].total} notas</small>${r.id === "crea" ? `<small>✓ ${res.crea.retos}/${res.crea.nRetos} retos</small>` : ""}</td>`).join("")}<td><b>${media}</b></td></tr>`;
        }).join("")}</tbody></table></div>` : `<p class="intro">Todavía no hay notas de este grupo en la hoja.</p>`}
      <details class="p-import"><summary>Importar alumnado desde un CSV</summary>
        <p class="intro">Columnas: <b>nombre; apellidos; usuario</b> (de Educacyl). Opcionales: <b>curso</b> (5ºA, 5ºB, 6ºA, 6ºB) y <b>correo</b> de la familia (para que pueda consultar los resultados). Si el CSV no trae el curso, se ponen en ${grupo}. Si un alumno ya está, se actualizan sus datos.</p>
        <div class="p-barra"><input type="file" id="p-csv" accept=".csv,text/csv,text/plain"><button type="button" class="btn sec" id="p-plantilla">Descargar plantilla CSV</button></div>
        <div id="p-csv-vista"></div>
      </details>
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
    $("#p-plantilla").onclick = () => descargar("plantilla_alumnado.csv", "nombre;apellidos;usuario;curso;correo\nLucía;Martín Pérez;lucia.martper;5ºA;familia.martin@ejemplo.com\n");
    $("#p-csv").onchange = (e) => leerCSV(e.target.files[0]);
  }

  /* ---------- Importar CSV ---------- */
  function descargar(nombre, texto) {
    const url = URL.createObjectURL(new Blob(["\ufeff" + texto], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = nombre; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 3000);
  }
  function partirCSV(texto) {
    const sep = (texto.split("\n")[0].match(/;/g) || []).length >= (texto.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
    const filas = []; let fila = [], campo = "", comillas = false;
    for (let i = 0; i < texto.length; i++) {
      const ch = texto[i];
      if (comillas) { if (ch === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else comillas = false; } else campo += ch; }
      else if (ch === '"') comillas = true;
      else if (ch === sep) { fila.push(campo); campo = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && texto[i + 1] === "\n") i++; fila.push(campo); filas.push(fila); fila = []; campo = ""; }
      else campo += ch;
    }
    if (campo || fila.length) { fila.push(campo); filas.push(fila); }
    return filas.map((f) => f.map((x) => x.trim())).filter((f) => f.some((x) => x));
  }
  const normal = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  function claseValida(t) {
    const m = /([56])\s*[º°o.]*\s*([ab])/i.exec(normal(t).replace(/primaria|curso/g, ""));
    return m ? `${m[1]}º${m[2].toUpperCase()}` : "";
  }
  async function leerCSV(archivo) {
    const vista = $("#p-csv-vista"); if (!archivo) return;
    const buf = await archivo.arrayBuffer();
    let texto = new TextDecoder("utf-8").decode(buf);
    if (texto.includes("\ufffd")) texto = new TextDecoder("windows-1252").decode(buf);   // CSV guardado con Excel
    texto = texto.replace(/^\ufeff/, "");
    const filas = partirCSV(texto);
    if (!filas.length) { vista.innerHTML = `<p class="estado" data-tipo="error">El archivo está vacío.</p>`; return; }
    const cab = filas[0].map(normal);
    const col = (...p) => cab.findIndex((c) => p.some((x) => c.includes(x)));
    let iN = col("nombre"), iA = col("apellido"), iU = col("usuario", "educacyl", "user"), iC = col("curso", "clase", "grupo"), iE = col("correo", "email", "mail");
    let datosF = filas.slice(1);
    if (iN < 0 && iU < 0) { iN = 0; iA = 1; iU = 2; iC = filas[0].length > 3 ? 3 : -1; iE = filas[0].length > 4 ? 4 : -1; datosF = filas; }   // sin cabecera
    const alumnosCSV = datosF.map((f) => ({
      nombre: f[iN] || "", apellidos: iA >= 0 ? f[iA] || "" : "", usuario: (f[iU] || "").replace(/@.*$/, ""),
      clase: (iC >= 0 && claseValida(f[iC])) || grupo, correo: iE >= 0 ? (f[iE] || "").toLowerCase() : ""
    }));
    const validos = alumnosCSV.filter((a) => a.usuario && a.nombre), malos = alumnosCSV.length - validos.length;
    vista.innerHTML = `<p><b>${validos.length}</b> alumnos listos para importar${malos ? ` · ${malos} filas sin nombre o sin usuario (no se importan)` : ""}.</p>
      <div class="tabla-scroll"><table class="p-tabla"><thead><tr><th>Nombre</th><th>Apellidos</th><th>Usuario</th><th>Curso</th><th>Correo familia</th></tr></thead><tbody>
      ${validos.slice(0, 200).map((a) => `<tr><td>${esc(a.nombre)}</td><td>${esc(a.apellidos)}</td><td>${esc(a.usuario)}</td><td>${esc(a.clase)}</td><td>${esc(a.correo)}</td></tr>`).join("")}</tbody></table></div>
      <div class="enviar-fila" style="margin-top:10px"><button type="button" class="btn" id="p-importar"${validos.length ? "" : " disabled"}>Importar ${validos.length} alumnos</button><span class="estado" id="p-imp-estado"></span></div>`;
    const b = $("#p-importar"); if (b) b.onclick = () => importar(validos, $("#p-imp-estado"), b);
  }
  async function llamar(cuerpo) {
    const R = window.REGISTRO || {};
    let k = ""; try { k = sessionStorage.getItem(CLAVE_SES) || ""; } catch (e) {}
    const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({ clave: k }, cuerpo)) });
    const t = await r.text(); try { return JSON.parse(t); } catch (e) { return { ok: false, error: "La hoja no responde bien. ¿Has pegado el script nuevo y creado una nueva versión?" }; }
  }
  async function importar(lista, est, btn) {
    btn.disabled = true; est.textContent = "Importando…"; est.dataset.tipo = "";
    try {
      const j = await llamar({ accion: "importar", alumnos: lista });
      if (!j.ok) throw new Error(j.error);
      est.textContent = `✓ ${j.nuevos} nuevos y ${j.cambiados} actualizados.`; est.dataset.tipo = "ok";
      const d = await llamar({ accion: "datos" }); if (d.ok) { datos = d; setTimeout(pintarGrupo, 1200); }
    } catch (e) { est.textContent = e.message === "Failed to fetch" ? "No se ha podido conectar con la hoja." : e.message; est.dataset.tipo = "error"; btn.disabled = false; }
  }
  function mediasTabla(lista, c) {
    const m = mediasInd(lista, c);
    if (!m.length) return `<p class="intro">Sin datos todavía.</p>`;
    return `<div class="tabla-scroll"><table class="p-tabla p-medias"><thead><tr><th>Ind.</th><th>Indicador de logro</th><th>Notas</th><th>Media</th></tr></thead><tbody>
      ${m.map((x) => `<tr><td><span class="cod-p">${x.cod}</span></td><td>${esc(textoInd(c, x.cod))}</td><td>${x.n}</td><td><b>${x.media}</b></td></tr>`).join("")}</tbody></table></div>`;
  }

  function autoTabla(a, c) {
    const k = Object.keys(a.auto || {});
    const frases = (window.AUTOEVAL || {})[c] || {}, ESC = window.ESCALA_AUTO || [];
    if (!k.length) return `<details class="p-rincon"><summary style="color:#14225a">Autoevaluación</summary><p class="intro">Todavía no ha hecho la autoevaluación de Programa y Robótica.</p></details>`;
    const fecha = a.autoFecha && !isNaN(new Date(a.autoFecha)) ? ` · ${new Date(a.autoFecha).toLocaleDateString("es-ES")}` : "";
    return `<details class="p-rincon" open><summary style="color:#14225a">Autoevaluación del alumno${fecha}</summary>
      <div class="tabla-scroll"><table class="p-tabla"><thead><tr><th>Rincón</th><th>Lo que dice que sabe hacer</th><th>0-5</th></tr></thead><tbody>
      ${k.sort().map((t) => { const m = /^(.*) · Ind\. (.*)$/.exec(t) || ["", t, ""]; return `<tr><td>${esc(m[1])}</td><td><span class="cod-p">${esc(m[2])}</span> ${esc(frases[m[2]] || textoInd(c, m[2]))}</td><td><b>${a.auto[t]}</b><small>${esc(ESC[a.auto[t]] || "")}</small></td></tr>`; }).join("")}
      </tbody></table></div></details>`;
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
      <form class="alumno p-correo" id="p-correo" autocomplete="off">
        <label>Correo de la familia<input id="p-correo-in" type="email" maxlength="120" value="${esc(a.correo || "")}" placeholder="familia@ejemplo.com"></label>
        <button class="btn sec" type="submit"${a.usuario ? "" : " disabled title=\"Hace falta el usuario de Educacyl\""}>Guardar correo</button>
        <span class="estado" id="p-correo-est">${a.usuario ? "Con este correo la familia puede ver los resultados en la pestaña Familias." : "Este alumno no tiene usuario de Educacyl: impórtalo con su usuario."}</span>
      </form>
      <div class="p-resumen">${RINC.map((r) => `<div style="--rc:${r.color}"><b>${r.nombre}</b><span>${res[r.id].media === null ? "–" : res[r.id].media}</span><small>${res[r.id].hechas} de ${res[r.id].total} con nota${r.id === "crea" ? ` · ✓ ${res.crea.retos}/${res.crea.nRetos} retos terminados` : ""}</small></div>`).join("")}</div>
      <p class="intro">Las casillas marcadas son las notas que ya hay en la hoja. En Crea, el alumno solo marca el reto como terminado: la nota de cada indicador la pones tú aquí. Cambia las que quieras y pulsa Enviar en esa actividad.</p>
      ${autoTabla(a, c)}
      ${RINC.map((r) => `<details class="p-rincon" ${r.id === "crea" ? "open" : ""}><summary style="color:${r.color}">${r.nombre}</summary>
        <div class="retos-r">${cat.map((x, k) => ({ x, k })).filter(({ x }) => x.rincon === r.id && x.inds.length).map(({ x, k }) => `
          <article class="reto-r" data-k="${k}">
            <div class="reto-r-cab"><h3>${esc(x.titulo)}</h3>${x.rincon === "crea" ? (() => { const t = (a.terminados || {})[x.destino.slice(0, 60)]; return t ? `<span class="p-hecho">✓ Terminado${t.ruta && t.ruta !== "Todos" ? " · " + esc(t.ruta) : ""}${t.fecha && !isNaN(new Date(t.fecha)) ? " · " + new Date(t.fecha).toLocaleDateString("es-ES") : ""}</span>` : `<span class="p-hecho no">Sin terminar</span>`; })() : ""}</div>
            <div class="inds">${x.inds.map((cod) => { const col = columna(x.destino, cod); return `<div class="fila-ind"><div class="fila-ind-t"><span class="cod">Ind. ${cod}</span> ${esc(textoInd(c, cod))}</div>${chips(col, a.notas[col])}</div>`; }).join("")}</div>
            <div class="enviar-fila"><button type="button" class="btn enviar-p">Enviar</button><span class="estado" aria-live="polite"></span></div>
          </article>`).join("")}</div></details>`).join("")}
      </div>`;
    $("#p-volver").onclick = pintarGrupo;
    $("#p-correo").addEventListener("submit", async (e) => {
      e.preventDefault();
      const correo = $("#p-correo-in").value.trim().toLowerCase(), est = $("#p-correo-est");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) { est.textContent = "Escribe un correo válido."; est.dataset.tipo = "error"; return; }
      const partes = a.nombre.split(" ");
      const j = await llamar({ accion: "importar", alumnos: [{ nombre: a.registrado ? "" : partes[0], apellidos: a.registrado ? "" : partes.slice(1).join(" "), usuario: a.usuario, clase: a.clase, correo }] }).catch(() => ({ ok: false, error: "No se ha podido conectar con la hoja." }));
      if (j.ok) { a.correo = correo; a.registrado = true; est.textContent = "✓ Correo guardado."; est.dataset.tipo = "ok"; } else { est.textContent = j.error; est.dataset.tipo = "error"; }
    });
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
  return { pintar, catalogo, notasDe, resumen, columna, RINC, textoInd, mediasInd };
})();
