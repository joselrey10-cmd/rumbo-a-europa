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
  const GRUPOS = ["P5A", "P5B", "P6A", "P6B"];
  const RINC = [
    { id: "crea", nombre: "Crea", color: "#e07a1f" }, { id: "prog", nombre: "Programa", color: "#3a7bd5" },
    { id: "rob", nombre: "Robótica", color: "#2f8f5b" }, { id: "piensa", nombre: "Piensa", color: "#8a4fd8" }
  ];
  const CLAVE_SES = "rumbo-profe-clave";
  let raiz = null, datos = null, grupo = "P5A", alumnoSel = null, extra = [], cambios = {};

  const G = (t) => (window.normGrupo ? window.normGrupo(t) : String(t || ""));
  const cursoDe = (g) => (/6/.test(g || "") ? "6º" : "5º");
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
      nombre: `${f[0] || ""} ${f[1] || ""}`.trim(), nom: String(f[0] || "").trim(), apellidos: String(f[1] || "").trim(), usuario: String(f[2] || ""), clase: G(f[3]), correo: String(f[4] || ""), notas: {}, terminados: {}, registrado: true
    }));
    // 2) Notas de la pestaña Valoraciones
    datos.filas.forEach((f) => {
      const notas = notasDe(cab, f);
      const u = iU >= 0 ? String(f[iU] || "") : "", n = String(f[iN] || ""), c = G(f[iC]);
      let a = lista.find((x) => u ? igual(x.usuario, u) : (igual(x.nombre, n) && igual(x.clase, c)));
      if (a) Object.assign(a.notas, notas);
      else lista.push({ nombre: n, usuario: u, clase: c, correo: "", notas, terminados: {} });
    });
    // Autoevaluación (pestaña aparte)
    const av = datos.autoeval || [];
    if (av.length > 1) {
      const ac = av[0].map(String);
      av.slice(1).forEach((f) => {
        const u = String(f[2] || ""), n = String(f[1] || ""), c = G(f[3]);
        let a = lista.find((x) => u ? igual(x.usuario, u) : (igual(x.nombre, n) && igual(x.clase, c)));
        if (!a) { a = { nombre: n, usuario: u, clase: c, correo: "", notas: {}, terminados: {} }; lista.push(a); }
        a.auto = {}; a.autoFecha = f[0];
        ac.forEach((t, i) => { if (/ · Ind\. /.test(t) && f[i] !== "" && f[i] != null) a.auto[t] = Number(f[i]); });
      });
    }
    // Retos de Crea terminados (aunque el alumno aún no tenga notas)
    (datos.hechos || []).forEach(([nombre, usuario, clase0, destino, programa, fecha]) => {
      const clase = G(clase0);
      let a = lista.find((x) => usuario ? igual(x.usuario, usuario) : (igual(x.nombre, nombre) && igual(x.clase, clase)));
      if (!a) { a = { nombre: String(nombre || ""), usuario: String(usuario || ""), clase: String(clase || ""), notas: {}, terminados: {} }; lista.push(a); }
      a.terminados[String(destino)] = { ruta: String(programa || "").replace(/^Terminado ·\s*/, ""), fecha };
    });
    // Notas puestas en esta sesión (aún no recargadas de la hoja)
    lista.forEach((a) => Object.assign(a.notas, cambios[idDe(a)] || {}));
    extra.forEach((x) => { x.terminados = x.terminados || {}; if (!lista.some((a) => igual(a.nombre, x.nombre) && igual(a.clase, x.clase))) lista.push(x); });
    return lista;
  }
  const idDe = (a) => (a.usuario ? "u:" + String(a.usuario).trim().toLowerCase() : "n:" + String(a.nombre || "").trim().toLowerCase() + "|" + G(a.clase));
  function notasDe(cab, f) {
    const notas = {};
    (cab || []).forEach((t, i) => { t = String(t); if (/ · Ind\. /.test(t) && f && f[i] !== "" && f[i] != null) notas[t] = Number(f[i]); });
    return notas;
  }
  /* Orden y nombre por apellidos: "Martín Pérez, Lucía". Si no está importado, los apellidos son lo que va tras la primera palabra. */
  function partes(a) {
    if (a.apellidos != null) return [a.apellidos, a.nom || ""];
    const t = String(a.nombre || "").trim();
    if (t.indexOf(", ") > 0) { const q = t.split(", "); return [q[0], q.slice(1).join(", ")]; }
    const p = t.split(/\s+/); const n = p.shift() || ""; return [p.join(" "), n];
  }
  const verNombre = (a) => { const [ap, n] = partes(a); return ap ? `${ap}, ${n}` : n || a.nombre || "(sin nombre)"; };
  const delGrupo = () => alumnos().filter((a) => igual(G(a.clase), grupo)).sort((a, b) => {
    const x = partes(a), y = partes(b); return x[0].localeCompare(y[0], "es", { sensitivity: "base" }) || x[1].localeCompare(y[1], "es", { sensitivity: "base" });
  });

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
      ${lista.length ? `<div class="tabla-scroll"><table class="p-tabla"><thead><tr><th>Alumno</th><th>Usuario Educacyl</th>${RINC.map((r) => `<th style="color:${r.color}">${r.nombre}</th>`).join("")}<th>Media</th><th><span class="vh">Dar de baja</span></th></tr></thead><tbody>
        ${lista.map((a, i) => {
          const res = resumen(a, c), todas = RINC.map((r) => res[r.id]).filter((x) => x.media !== null);
          const hechas = todas.reduce((s, x) => s + x.hechas, 0);
          const media = hechas ? Math.round(todas.reduce((s, x) => s + x.media * x.hechas, 0) / hechas * 10) / 10 : "–";
          return `<tr><td><button type="button" class="p-alumno" data-i="${i}">${esc(verNombre(a))}</button></td><td>${esc(a.usuario)}${a.correo ? ` <span title="${esc(a.correo)}">✉️</span>` : ""}</td>
            ${RINC.map((r) => `<td>${res[r.id].media === null ? "–" : `<b>${res[r.id].media}</b>`}<small>${res[r.id].hechas}/${res[r.id].total} notas</small>${r.id === "crea" ? `<small>✓ ${res.crea.retos}/${res.crea.nRetos} retos</small>` : ""}</td>`).join("")}<td><b>${media}</b></td><td><button type="button" class="p-papelera" data-i="${i}" title="Dar de baja a ${esc(verNombre(a))}" aria-label="Dar de baja a ${esc(verNombre(a))}">🗑️</button></td></tr>`;
        }).join("")}</tbody></table></div>` : `<p class="intro">Todavía no hay notas de este grupo en la hoja.</p>`}
      ${barraCodigos(lista)}
      <details class="p-import"><summary>Importar alumnado desde un CSV</summary>
        <p class="intro">Columnas obligatorias: <b>nombre; apellidos; usuario</b> (de Educacyl) y <b>curso</b>. Solo se importan las filas con el curso escrito exactamente <b>P5A, P5B, P6A o P6B</b>; el resto (Infantil, otros cursos o vacío) se salta. Opcionales: hasta dos <b>correos</b> de los tutores (columnas «correo tutor 1» y «correo tutor 2») para que la familia pueda consultar los resultados. Si un alumno ya está, se actualizan sus datos.</p>
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
    const bg = $("#p-cod-grupo"); if (bg) bg.onclick = () => mandarCodigos(lista, bg, `las familias de ${grupo}`);
    const bt = $("#p-cod-todos"); if (bt) bt.onclick = () => mandarCodigos(alumnos().filter((x) => GRUPOS.indexOf(G(x.clase)) >= 0), bt, "las familias de todos los grupos");
    raiz.querySelectorAll(".p-papelera").forEach((b) => b.onclick = () => darDeBaja(lista[+b.dataset.i], b, null));
    $("#p-plantilla").onclick = () => descargar("plantilla_alumnado.csv", "nombre;apellidos;usuario;curso;correo tutor 1;correo tutor 2\nLucía;Martín Pérez;lucia.martper;P5A;madre.martin@ejemplo.com;padre.martin@ejemplo.com\n");
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
    const g = String(t || "").trim();   // exactamente P5A, P5B, P6A o P6B (ni Infantil ni otros cursos)
    return GRUPOS.indexOf(g) >= 0 ? g : "";
  }
  /* Hasta dos correos de tutores por alumno: se guardan juntos, separados por coma, en "Correo familia". */
  const separarCorreos = (t) => String(t || "").toLowerCase().split(/[;,\s]+/).filter((x) => x);
  const unirCorreos = (lista) => [...new Set(lista.flatMap(separarCorreos))].slice(0, 2).join(", ");
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
    const iEs = cab.map((c, i) => (/correo|email|mail/.test(c) ? i : -1)).filter((i) => i >= 0);
    let datosF = filas.slice(1);
    if (iN < 0 && iU < 0) { iN = 0; iA = 1; iU = 2; iC = filas[0].length > 3 ? 3 : -1; iE = filas[0].length > 4 ? 4 : -1; iEs.length = 0; for (let k = 4; k < filas[0].length; k++) iEs.push(k); datosF = filas; }   // sin cabecera
    const alumnosCSV = datosF.map((f) => ({
      nombre: f[iN] || "", apellidos: iA >= 0 ? f[iA] || "" : "", usuario: (f[iU] || "").replace(/@.*$/, ""),
      clase: iC >= 0 ? claseValida(f[iC]) : "", otroCurso: !(iC >= 0 && claseValida(f[iC])), correo: unirCorreos(iEs.map((k) => f[k]))
    }));
    const otros = alumnosCSV.filter((a) => a.otroCurso).length;
    const validos = alumnosCSV.filter((a) => a.usuario && a.nombre && !a.otroCurso).map(({ otroCurso, ...a }) => a), malos = alumnosCSV.length - validos.length - otros;
    vista.innerHTML = `<p><b>${validos.length}</b> alumnos listos para importar${otros ? ` · ${otros} sin grupo P5A, P5B, P6A o P6B (no se importan)` : ""}${malos ? ` · ${malos} filas sin nombre o sin usuario (no se importan)` : ""}.</p>
      <div class="tabla-scroll"><table class="p-tabla"><thead><tr><th>Nombre</th><th>Apellidos</th><th>Usuario</th><th>Curso</th><th>Correos de la familia</th></tr></thead><tbody>
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
    raiz.innerHTML = cab(`${esc(verNombre(a))} · ${esc(a.clase)}${a.usuario ? " · " + esc(a.usuario) : ""} · indicadores de ${c}`) +
      `<div class="envoltura seccion">
      <p class="p-barra"><button type="button" class="btn sec" id="p-volver">← Volver a ${esc(a.clase)}</button>
        <button type="button" class="btn sec p-borrar" id="p-borrar">🗑️ Dar de baja</button><span class="estado" id="p-borrar-est" aria-live="polite"></span></p>
      <form class="alumno p-correo" id="p-correo" autocomplete="off">
        <label>Correo tutor 1<input id="p-correo-in" type="email" maxlength="120" value="${esc(separarCorreos(a.correo)[0] || "")}" placeholder="tutor1@ejemplo.com"></label>
        <label>Correo tutor 2 <small>(opcional)</small><input id="p-correo-in2" type="email" maxlength="120" value="${esc(separarCorreos(a.correo)[1] || "")}" placeholder="tutor2@ejemplo.com"></label>
        <button class="btn sec" type="submit"${a.usuario ? "" : " disabled title=\"Hace falta el usuario de Educacyl\""}>Guardar correos</button>
        <button class="btn sec" type="button" id="p-cod-uno"${a.usuario && a.correo ? "" : " disabled"}>✉️ Enviar código</button>
        <span class="estado" id="p-correo-est">${a.usuario ? "Con cualquiera de estos correos la familia puede ver los resultados en la pestaña Familias." : "Este alumno no tiene usuario de Educacyl: impórtalo con su usuario."}</span>
      </form>
      <div class="p-resumen">${RINC.map((r) => `<div style="--rc:${r.color}"><b>${r.nombre}</b><span>${res[r.id].media === null ? "–" : res[r.id].media}</span><small>${res[r.id].hechas} de ${res[r.id].total} con nota${r.id === "crea" ? ` · ✓ ${res.crea.retos}/${res.crea.nRetos} retos terminados` : ""}</small></div>`).join("")}</div>
      <p class="intro">Las casillas marcadas son las notas que ya hay en la hoja. En Crea, el alumno solo marca el reto como terminado: la nota de cada indicador la pones tú aquí. Al pulsar una nota se guarda sola en la hoja (verás «✓ Guardada»).</p>
      ${autoTabla(a, c)}
      ${RINC.map((r) => `<details class="p-rincon" ${r.id === "crea" ? "open" : ""}><summary style="color:${r.color}">${r.nombre}</summary>
        <div class="retos-r">${cat.map((x, k) => ({ x, k })).filter(({ x }) => x.rincon === r.id && x.inds.length).map(({ x, k }) => `
          <article class="reto-r" data-k="${k}">
            <div class="reto-r-cab"><h3>${esc(x.titulo)}</h3>${x.rincon === "crea" ? (() => { const t = (a.terminados || {})[x.destino.slice(0, 60)]; return t ? `<span class="p-hecho">✓ Terminado${t.ruta && t.ruta !== "Todos" ? " · " + esc(t.ruta) : ""}${t.fecha && !isNaN(new Date(t.fecha)) ? " · " + new Date(t.fecha).toLocaleDateString("es-ES") : ""}</span>` : `<span class="p-hecho no">Sin terminar</span>`; })() : ""}</div>
            <div class="inds">${x.inds.map((cod) => { const col = columna(x.destino, cod); return `<div class="fila-ind"><div class="fila-ind-t"><span class="cod">Ind. ${cod}</span> ${esc(textoInd(c, cod))}</div>${chips(col, a.notas[col])}</div>`; }).join("")}</div>
            <div class="enviar-fila"><button type="button" class="btn sec enviar-p">Volver a enviar</button><span class="estado" aria-live="polite"></span></div>
          </article>`).join("")}</div></details>`).join("")}
      </div>`;
    $("#p-volver").onclick = pintarGrupo;
    $("#p-borrar").onclick = () => darDeBaja(a, $("#p-borrar"), $("#p-borrar-est"));
    $("#p-cod-uno").onclick = () => mandarCodigos([a], $("#p-cod-uno"), `la familia de ${verNombre(a)}`, $("#p-correo-est"));
    $("#p-correo").addEventListener("submit", async (e) => {
      e.preventDefault();
      const est = $("#p-correo-est"), lista = [$("#p-correo-in").value, $("#p-correo-in2").value].map((x) => x.trim().toLowerCase()).filter((x) => x);
      if (lista.some((x) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x))) { est.textContent = "Revisa los correos: alguno no es válido."; est.dataset.tipo = "error"; return; }
      const correo = unirCorreos(lista);
      const partes = a.nombre.split(" ");
      const j = await llamar({ accion: "importar", alumnos: [{ nombre: a.registrado ? "" : partes[0], apellidos: a.registrado ? "" : partes.slice(1).join(" "), usuario: a.usuario, clase: a.clase, correo: correo || "-" }] }).catch(() => ({ ok: false, error: "No se ha podido conectar con la hoja." }));
      if (j.ok) { a.correo = correo; a.registrado = true; $("#p-cod-uno").disabled = !correo; est.textContent = correo ? "✓ Correos guardados." : "✓ Correos borrados."; est.dataset.tipo = "ok"; } else { est.textContent = j.error; est.dataset.tipo = "error"; }
    });
    window.scrollTo(0, 0);
  }

  /* ---------- Enviar el código a las familias ---------- */
  const conCorreo = (l) => l.filter((x) => x.usuario && String(x.correo || "").trim());
  function barraCodigos(lista) {
    const n = conCorreo(lista).length, t = conCorreo(alumnos().filter((x) => GRUPOS.indexOf(G(x.clase)) >= 0)).length;
    return `<div class="p-codigos"><div><b>✉️ Acceso de las familias</b><p class="intro">Envía a cada familia un correo con las instrucciones y su código (vale 7 días). Solo a los alumnos con correo guardado.</p></div>
      <div class="enviar-fila"><button type="button" class="btn sec" id="p-cod-grupo"${n ? "" : " disabled"}>Enviar a ${grupo} (${n})</button>
      <button type="button" class="btn sec" id="p-cod-todos"${t ? "" : " disabled"}>Enviar a todos los grupos (${t})</button>
      <span class="estado" id="p-cod-est" aria-live="polite"></span></div></div>`;
  }
  async function mandarCodigos(lista, btn, quien, est) {
    est = est || $("#p-cod-est");
    const l = conCorreo(lista);
    if (!l.length) { est.textContent = "Ningún alumno tiene correo de familia."; est.dataset.tipo = "error"; return; }
    if (!confirm(`¿Enviar el correo con el código a ${quien}?\n\nSe enviará a ${l.length} ${l.length === 1 ? "alumno" : "alumnos"} con correo guardado. Cada código vale 7 días y anula el anterior.`)) return;
    btn.disabled = true; est.textContent = "Enviando… (puede tardar un poco)"; est.dataset.tipo = "";
    const j = await llamar({ accion: "enviarCodigos", usuarios: l.map((x) => x.usuario) }).catch(() => ({ ok: false, error: "No se ha podido conectar con la hoja." }));
    btn.disabled = false;
    if (!j.ok) { est.textContent = j.error || "No se ha podido enviar."; est.dataset.tipo = "error"; return; }
    est.textContent = `✓ Enviados ${j.enviados} ${j.enviados === 1 ? "correo" : "correos"}${j.fallos && j.fallos.length ? ` · no se pudo enviar a: ${j.fallos.join(", ")}` : ""}.`;
    est.dataset.tipo = j.fallos && j.fallos.length ? "error" : "ok";
  }

  async function darDeBaja(a, btn, est) {
      if (!confirm(`¿Dar de baja a ${verNombre(a)} (${a.clase})?\n\nSe borrarán de la hoja de Google sus datos, sus notas, su autoevaluación y su historial. No se puede deshacer.`)) return;
      btn.disabled = true; if (est) { est.textContent = "Borrando…"; est.dataset.tipo = ""; }
      const j = await llamar({ accion: "borrar", usuario: a.usuario, nombre: a.nombre, clase: a.clase }).catch(() => ({ ok: false, error: "No se ha podido conectar con la hoja." }));
      if (!j.ok) { if (est) { est.textContent = j.error; est.dataset.tipo = "error"; } else alert(j.error); btn.disabled = false; return; }
      extra = extra.filter((x) => !(igual(x.nombre, a.nombre) && igual(x.clase, a.clase)));
      const d = await llamar({ accion: "datos" }).catch(() => null);
      if (d && d.ok) datos = d;
      pintarGrupo();
  }

  async function enviarProfe(caja, todas) {
    const a = alumnoSel, x = catalogo(cursoDe(a.clase))[+caja.dataset.k], est = $(".estado", caja), filas = [];
    caja.querySelectorAll(".chips").forEach((g, i) => {
      const b = g.querySelector('[aria-checked="true"]');
      if (!b) return;
      const nota = +b.dataset.n, cod = x.inds[i];
      if (!todas && a.notas[g.dataset.col] === nota) return;   // sin cambios
      filas.push({ col: g.dataset.col, nota, d: { nombre: a.nombre, usuario: a.usuario, clase: a.clase, destino: x.destino, ciudad: x.ciudad, personaje: "Profe", programa: "Nota del profe", indicador: cod, valoracion: nota } });
    });
    if (!filas.length) { if (todas) { est.textContent = "Elige al menos una nota."; est.dataset.tipo = "error"; } return; }
    const btn = $(".enviar-p", caja); btn.disabled = true; est.textContent = "Enviando…"; est.dataset.tipo = "";
    const ok = await window.Valoraciones.enviarVarias(filas.map((f) => f.d));
    btn.disabled = false;
    if (ok) filas.forEach((f) => { a.notas[f.col] = f.nota; (cambios[idDe(a)] = cambios[idDe(a)] || {})[f.col] = f.nota; });
    est.textContent = ok ? `✓ Guardada${filas.length > 1 ? "s " + filas.length + " notas" : ""} en la hoja · ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}` : "No se ha podido guardar. Revisa la conexión y pulsa «Volver a enviar».";
    est.dataset.tipo = ok ? "ok" : "error";
  }

  function pintar(r) {
    raiz = r;
    if (!r.dataset.profe) {
      r.dataset.profe = "1";
      r.addEventListener("click", (e) => {
        if (location.hash !== "#profe") return;
        const chip = e.target.closest(".chips button");
        if (chip) { chip.parentElement.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b === chip))); const caja = chip.closest(".reto-r"); if (caja && alumnoSel) enviarProfe(caja); return; }
        const g = e.target.closest(".p-grupo"); if (g) { grupo = g.dataset.g; pintarGrupo(); return; }
        if (e.target.closest("#p-recargar")) { let k = ""; try { k = sessionStorage.getItem(CLAVE_SES) || ""; } catch (x) {} datos = null; pintarClave(); cargar(k); return; }
        if (e.target.closest("#p-salir")) { try { sessionStorage.removeItem(CLAVE_SES); } catch (x) {} datos = null; cambios = {}; pintarClave(); return; }
        const env = e.target.closest(".enviar-p"); if (env) enviarProfe(env.closest(".reto-r"), true);
      }, true);
    }
    if (!datos) pintarClave();
    else if (alumnoSel) pintarAlumno(alumnoSel);
    else pintarGrupo();
  }
  return { pintar, catalogo, notasDe, resumen, columna, RINC, textoInd, mediasInd };
})();
