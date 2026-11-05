/*
  RINCONES: portada con los datos del alumno y los 4 rincones (Crea, Programa, Robótica, Piensa).
  - #            portada
  - #crea        retos de Crea del curso del alumno
  - #piensa      paradas del Pasaporte TIC (actividades en piensa/)
  - #notas-prog  notas de Programa (se pueden revisar y enviar)
  - #notas-rob   notas de Robótica
  Programa (#programa) y Robótica (#robotica) siguen en js/juego.js y js/robotica.js.
  Todas las notas van a la misma hoja de Google (REGISTRO.url), una fila por indicador.
*/
window.Rincones = (function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const V = () => window.Valoraciones;
  const raiz = $("#rincones");
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const CLASES = ["5ºA", "5ºB", "6ºA", "6ºB"];
  const LLAVES = "rumbo-piensa-llaves";
  const ESCALA = ["No hecho", "Lo ha intentado sin conseguirlo", "Ha conseguido una parte", "Conseguido con bastante ayuda", "Conseguido casi del todo", "Conseguido perfectamente"];

  const RINCONES = [
    { id: "crea", nombre: "Crea", color: "#e07a1f", icono: "🎨", texto: "Busca, escribe, diseña y graba: Word, PDF, correo, Excel, Canva y pódcast.", ir: "#crea", accion: "Ver los retos" },
    { id: "prog", nombre: "Programa", color: "#3a7bd5", icono: "💻", texto: "Rumbo a Europa: programa con bloques el camino de ciudad en ciudad.", ir: "#programa", accion: "Jugar", notas: "#notas-prog", notasTxt: "Autoevaluación" },
    { id: "rob", nombre: "Robótica", color: "#2f8f5b", icono: "🤖", texto: "Programa el robot por el tapete de Europa: Robot, SPIKE Essential y SPIKE Prime.", ir: "#robotica", accion: "Ir a los retos", notas: "#notas-rob", notasTxt: "Autoevaluación" },
    { id: "piensa", nombre: "Piensa", color: "#8a4fd8", icono: "🧠", texto: "Pasaporte TIC: ciberseguridad, contraseñas, correo, netiqueta, redes y uso responsable.", ir: "#piensa", accion: "Ver las paradas" }
  ];

  const cursoN = () => (V().curso() === "6º" ? "6" : "5");
  const crea = () => (window.CREA || {})[V().curso()] || [];
  const destinoCrea = (a) => `Crea · ${a.sa} ${a.s} · ${a.titulo}`;
  const claveHecho = (a) => `crea-hecho-${cursoN()}-${a.sa}-${a.s}`;
  const hecho = (a) => !!(a && (V().leer()[claveHecho(a)] || {}).hecho);
  const indPiensa = (p) => (cursoN() === "6" ? p.i6 : p.i5);
  const destinoPiensa = (p) => `Piensa · ${p.titulo}`;
  const clavePiensa = (p, cod) => `piensa-${cursoN()}-${p.pre}|${cod}`;
  const textoInd = (cod) => ((window.INDICADORES || {})[V().curso()] || {})[cod] || "";

  function definir() {
    // En Crea el alumno solo marca el reto como terminado; la nota de los indicadores la pone el profe (panel Profe).
    V().definirActividades("crea", () => crea().map((a) => ({
      clave: claveHecho(a), pantalla: "Crea", actividad: `${a.sa} ${a.s} · ${a.titulo}`, destino: destinoCrea(a), ciudad: a.titulo, tipo: "fijo", ref: ""
    })));
    V().definirActividades("piensa", () => [].concat(...(window.PIENSA || []).map((p) => indPiensa(p).map(([cod]) => ({
      clave: clavePiensa(p, cod), pantalla: "Piensa", actividad: p.titulo, destino: destinoPiensa(p), ciudad: p.titulo, tipo: "fijo", ref: cod
    })))));
  }

  /* ---------- Piezas comunes ---------- */
  function chips(clave, valor) {
    return `<div class="chips" role="radiogroup" aria-label="Nota de 0 a 5" data-clave="${esc(clave)}">${[0, 1, 2, 3, 4, 5].map((n) =>
      `<button type="button" role="radio" aria-checked="${valor === n}" data-n="${n}" title="${n}: ${ESCALA[n]}">${n}</button>`).join("")}</div>`;
  }
  function filaInd(clave, cod, texto, valor) {
    return `<div class="fila-ind"><div class="fila-ind-t"><span class="cod">Ind. ${esc(cod)}</span> ${esc(texto)}</div>${chips(clave, valor)}</div>`;
  }
  function valorDe(clave) { const r = V().leer()[clave]; return r ? r.nota : null; }
  function leerChips(caja) {
    const out = [];
    caja.querySelectorAll(".chips").forEach((g) => {
      const b = g.querySelector('[aria-checked="true"]');
      if (b) out.push({ clave: g.dataset.clave, nota: +b.dataset.n });
    });
    return out;
  }
  function faltanDatos() { const a = V().alumno(); return !a.nombre || !a.clase; }
  const avisoDatos = `Antes de enviar, escribe tu nombre y elige tu curso en <a href="#">Rincones</a>.`;
  function estado(caja, html, tipo) { const e = caja.querySelector(".estado"); if (e) { e.innerHTML = html; e.dataset.tipo = tipo || ""; } }

  function cabecera(r, titulo, sub) {
    const a = V().alumno();
    const quien = a.nombre ? `${esc(a.nombre)} · ${esc(a.clase || "sin curso")}` : "Sin datos";
    return `<header class="rincon-cab" style="--rc:${r.color}"><div class="envoltura">
      <a class="volver-r" href="#">← Rincones</a>
      <div class="rincon-tit"><span class="rincon-ico" aria-hidden="true">${r.icono}</span><div><h1>${esc(titulo)}</h1><p>${sub}</p></div></div>
      <div class="rincon-quien">${quien} · indicadores de ${V().curso()}${a.clase ? "" : ' <a href="#">elige tu curso</a>'}</div>
    </div></header>`;
  }

  /* ---------- Portada ---------- */
  function contar(id) {
    if (id === "crea") { const l = crea(); return { crea: true, total: l.length, hechas: l.filter(hecho).length }; }
    const f = V().filas().filter((r) => r.grupo === id);
    const hechas = f.filter((r) => r.nota > 0);
    const media = hechas.length ? hechas.reduce((s, r) => s + r.nota, 0) / hechas.length : 0;
    return { total: f.length, hechas: hechas.length, media: Math.round(media * 10) / 10 };
  }
  function pintarPortada() {
    const a = V().alumno(), C = window.COLEGIO || {};
    raiz.innerHTML = `
    <header class="portada"><div class="envoltura">
      <div class="marca">${C.logo ? `<img src="${esc(C.logo)}" alt="Escudo del colegio">` : ""}<span>${esc(C.nombre || "")}</span></div>
      <h1 style="margin-top:20px">Rincones TIC <span>Rumbo a Europa</span></h1>
      <p class="sub">Cuatro rincones para 5.º y 6.º. En cada actividad verás los indicadores de tu curso. En Crea marcas los retos que terminas y tu profe pone la nota; en los demás rincones envías tu nota de 0 a 5.</p>
    </div></header>
    <section class="seccion"><div class="envoltura">
      <span class="etiqueta">Paso 1</span>
      <h2>Tus datos</h2>
      <p class="intro">Tu curso decide qué indicadores ves: los de 5.º o los de 6.º.</p>
      <form class="alumno" id="r-form" autocomplete="off">
        <label for="r-nombre">Nombre y apellido<input id="r-nombre" maxlength="30" placeholder="Por ejemplo: Lucía Martín" value="${esc(a.nombre)}"></label>
        <label for="r-usuario">Usuario Educacyl<input id="r-usuario" maxlength="60" placeholder="nombre.apellido" value="${esc(a.usuario)}"></label>
        <label for="r-clase">Curso<select id="r-clase"><option value="">Elige</option>${CLASES.map((c) => `<option${a.clase === c ? " selected" : ""}>${c}</option>`).join("")}</select></label>
        <span class="alumno-ok" id="r-ok"></span>
      </form>
    </div></section>
    <section class="seccion" style="padding-top:0"><div class="envoltura">
      <span class="etiqueta">Paso 2</span>
      <h2>Elige un rincón</h2>
      <div class="rincones" id="r-lista"></div>
      <div class="excel-fila"><button class="btn sec" id="r-excel">Descargar mi valoración (Excel)</button><span>Todas tus notas de los cuatro rincones y la media de cada indicador.</span></div>
    </div></section>
    <section class="seccion" style="padding-top:0"><div class="envoltura">
      <h2>Escala de notas</h2>
      <ol class="escala" start="0">${ESCALA.map((t, n) => `<li><b>${n}</b> ${t}</li>`).join("")}</ol>
    </div></section>`;
    pintarTarjetas();
    const n = $("#r-nombre"), u = $("#r-usuario"), c = $("#r-clase");
    const ok = () => { const x = V().alumno(); $("#r-ok").textContent = x.nombre && x.clase ? `✓ ${x.nombre}, ${x.clase}: indicadores de ${V().curso()}` : ""; };
    const cambiar = () => { V().ponerAlumno(n.value, c.value, u.value); n.classList.toggle("falta", !n.value.trim()); ok(); pintarTarjetas(); };
    [n, u].forEach((el) => el.addEventListener("input", cambiar));
    c.addEventListener("change", cambiar);
    $("#r-form").addEventListener("submit", (e) => e.preventDefault());
    $("#r-excel").onclick = () => V().excel();
    ok();
  }
  function pintarTarjetas() {
    const l = $("#r-lista"); if (!l) return;
    l.innerHTML = RINCONES.map((r) => {
      const k = contar(r.id);
      return `<article class="rincon" style="--rc:${r.color}">
        <div class="rincon-ico" aria-hidden="true">${r.icono}</div>
        <h3>${r.nombre}</h3>
        <p>${r.texto}</p>
        <div class="rincon-dato">${k.crea ? `${k.hechas} de ${k.total} retos terminados` : `${k.hechas} de ${k.total} indicadores con nota${k.hechas ? ` · media ${k.media}` : ""}`}</div>
        <div class="rincon-acc"><a class="btn" href="${r.ir}">${r.accion}</a>${r.notas ? `<a class="btn sec" href="${r.notas}">${r.notasTxt || "Mis notas"}</a>` : ""}</div>
      </article>`;
    }).join("");
  }

  /* ---------- Crea ---------- */
  function pintarCrea() {
    const r = RINCONES[0], lista = crea();
    const porSA = {};
    lista.forEach((a, i) => (porSA[a.sa] = porSA[a.sa] || []).push(i));
    raiz.innerHTML = cabecera(r, "Crea", `Retos de ${V().curso()} en orden. Elige tu ruta, haz el reto y pulsa «He terminado el reto» para abrir el siguiente. La nota de los indicadores la pone tu profe.`) +
      `<div class="envoltura seccion">${Object.keys(porSA).map((sa) => `
        <h2 class="sa-tit">${sa}</h2>
        <div class="retos-r">${porSA[sa].map((i) => tarjetaCrea(lista[i], i)).join("")}</div>`).join("")}</div>`;
  }
  function tarjetaCrea(a, i) {
    const lista = crea(), h = V().leer()[claveHecho(a)] || {};
    if (i > 0 && !hecho(lista[i - 1])) {
      return `<article class="reto-r bloqueado" data-tipo="crea" data-i="${i}">
      <div class="reto-r-cab"><span class="ses">${a.sa} · ${a.s}</span><h3>🔒 ${esc(a.titulo)}</h3></div>
      <p>${esc(a.que)}</p>
      <p class="aviso-bloq">Se abre cuando termines el reto anterior: <b>${esc(lista[i - 1].titulo)}</b>.</p>
    </article>`;
    }
    const rutaGuardada = h.ruta || (V().leer()[`crea-ruta-${cursoN()}-${a.sa}-${a.s}`] || {}).ruta;
    const nombres = ["Ruta sencilla", "Ruta intermedia", "Ruta avanzada"];
    const rutas = a.rutas.length === 1
      ? `<p class="rutas-todos"><b>Todos:</b> la misma tarea para toda la clase.</p>`
      : `<div class="rutas" role="radiogroup" aria-label="Ruta">${a.rutas.map((t, k) => `<button type="button" role="radio" class="ruta" aria-checked="${rutaGuardada === nombres[k]}" data-ruta="${nombres[k]}"><b>${nombres[k]}</b><span>${esc(t)}</span></button>`).join("")}</div>`;
    return `<article class="reto-r" data-tipo="crea" data-i="${i}">
      <div class="reto-r-cab"><span class="ses">${a.sa} · ${a.s}</span><h3>${esc(a.titulo)}</h3></div>
      <p>${esc(a.que)}</p>
      ${rutas}
      ${a.extra ? `<p class="extra"><b>ExtraTIC:</b> ${esc(a.extra)}</p>` : ""}
      <div class="inds"><p class="inds-t">Indicadores que valorará tu profe</p>${a.ind.map((cod) => `<div class="fila-ind"><div class="fila-ind-t"><span class="cod">Ind. ${esc(cod)}</span> ${esc(textoInd(cod))}</div></div>`).join("")}</div>
      ${h.hecho
        ? `<p class="hecho-ok">✓ Reto terminado${h.ruta && h.ruta !== "Todos" ? ` · ${esc(h.ruta)}` : ""}${h.fecha ? ` · ${new Date(h.fecha).toLocaleDateString("es-ES")}` : ""}</p>`
        : `<div class="enviar-fila"><button type="button" class="btn terminar">He terminado el reto</button><span class="estado" aria-live="polite"></span></div>`}
    </article>`;
  }

  /* ---------- Piensa ---------- */
  function llaves() { try { return JSON.parse(localStorage.getItem(LLAVES) || "{}") || {}; } catch (e) { return {}; } }
  function leerLlave(texto, p) {
    const m = /^([A-Z]{3})-(\d*)-(\d*)-(\d+)-([0-9A-Z]{2})$/.exec(String(texto || "").trim().toUpperCase().replace(/\s+/g, ""));
    if (!m) return { error: "La llave no tiene el formato correcto (por ejemplo ITV-555555-555555-0-AB)." };
    const raw = `${m[1]}-${m[2]}-${m[3]}-${m[4]}`;
    let h = 0; for (let i = 0; i < raw.length; i++) h = (h + raw.charCodeAt(i) * (i + 7)) % 1296;
    if (h.toString(36).toUpperCase().padStart(2, "0") !== m[5]) return { error: "Esta llave no es válida. Cópiala otra vez de la actividad." };
    if (m[1] !== p.pre) return { error: `Esta llave es de otra parada (${m[1]}).` };
    const cifras = cursoN() === "6" ? m[3] : m[2];
    if (cifras.length !== indPiensa(p).length) return { error: "La llave no corresponde a esta actividad." };
    return { notas: cifras.split("").map((d) => Math.min(5, +d)), llave: m[0] };
  }
  const enviada = (p) => indPiensa(p).every(([cod]) => valorDe(clavePiensa(p, cod)) !== null);
  function pintarPiensa() {
    const r = RINCONES[3], L = llaves();
    raiz.innerHTML = cabecera(r, "Piensa · Pasaporte TIC", `Diez paradas de ciudadanía digital. Abre la actividad, termínala y vuelve aquí: la llave se rellena sola (o pégala). Pulsa «Enviar mi llave» y tu profe verá tu resultado.`) +
      `<div class="envoltura seccion"><div class="retos-r">${(window.PIENSA || []).map((p, i) => {
        const g = L[p.pre], auto = g ? leerLlave(g.llave, p) : {};
        return `<article class="reto-r" data-tipo="piensa" data-i="${i}">
          <div class="reto-r-cab"><span class="ses">Parada ${i + 1}</span><h3>${esc(p.titulo)}</h3></div>
          <p><a class="btn sec abrir" href="piensa/${p.slug}.html" target="_blank" rel="noopener">Abrir la actividad ↗</a></p>
          <div class="llave-fila"><label>Llave<input class="llave" placeholder="${p.pre}-…" value="${esc(g ? g.llave : "")}" autocomplete="off" spellcheck="false"></label></div>
          ${g ? `<p class="nota-llave">${g.completa ? "🔑 Llave conseguida en la actividad." : "Llave de una actividad sin terminar: termínala para conseguir la llave completa."}</p>` : ""}
          <div class="inds"><p class="inds-t">Indicadores de tu curso</p>${indPiensa(p).map(([cod, t]) => `<div class="fila-ind"><div class="fila-ind-t"><span class="cod">Ind. ${esc(cod)}</span> ${esc(t)}</div></div>`).join("")}</div>
          ${enviada(p) ? `<p class="hecho-ok">✓ Llave enviada a tu profe</p>` : ""}
          <div class="enviar-fila"><button type="button" class="btn enviar-llave">${enviada(p) ? "Volver a enviar la llave" : "Enviar mi llave"}</button><span class="estado" aria-live="polite"></span></div>
        </article>`;
      }).join("")}</div></div>`;
  }

  /* ---------- Notas de Programa y Robótica ---------- */
  function pintarNotas(id) {
    const r = RINCONES.find((x) => x.id === id);
    const f = V().filas().filter((x) => x.grupo === id);
    const cods = [...new Set(f.map((x) => x.codigo).filter(Boolean))].sort();
    const frases = (window.AUTOEVAL || {})[V().curso()] || {}, ESC = window.ESCALA_AUTO || ESCALA;
    const guardada = (cod) => { const g = V().leer()[`auto-${cursoN()}-${id}|${cod}`]; return g ? g.nota : null; };
    raiz.innerHTML = cabecera(r, `Mis notas y autoevaluación · ${r.nombre}`, `Primero dinos lo que sabes hacer. Debajo tienes las notas que has conseguido jugando (se ponen solas).`) +
      `<div class="envoltura seccion">
        <article class="reto-r auto-r" data-tipo="auto" data-rincon="${id}">
          <div class="reto-r-cab"><span class="ses">Autoevaluación</span><h3>¿Qué sé hacer en ${r.nombre}?</h3></div>
          <p>Elige de 0 a 5 en cada frase. Sé sincero o sincera: sirve para que tu profe sepa en qué ayudarte.</p>
          <ol class="escala escala-auto" start="0">${ESC.map((t, n) => `<li><b>${n}</b> ${t}</li>`).join("")}</ol>
          <div class="inds">${cods.map((cod) => `<div class="fila-ind"><div class="fila-ind-t"><span class="cod">Ind. ${esc(cod)}</span> <b>${esc(frases[cod] || textoInd(cod))}</b></div>${chips(`auto-${cursoN()}-${id}|${cod}`, guardada(cod))}</div>`).join("")}</div>
          <div class="enviar-fila"><button type="button" class="btn enviar-auto">Enviar mi autoevaluación</button><span class="estado" aria-live="polite"></span></div>
        </article>
        <h2 class="sa-tit" style="margin-top:24px">Mis notas jugando</h2>
        <p><a class="btn" href="${r.ir}">${r.accion}</a></p>
        <div class="lista-notas">${f.map((x) => `<article class="reto-r nota-act">
          <div class="reto-r-cab"><span class="ses">${esc(x.pantalla)}${x.codigo ? " · Ind. " + esc(x.codigo) : ""}</span><h3>${esc(x.actividad)}</h3></div>
          <p class="nota-fija">${V().leer()[x.clave] ? `Nota: <b>${x.nota}</b> de 5` : "Todavía sin hacer"}</p>
        </article>`).join("")}</div>
      </div>`;
  }

  /* ---------- Clics ---------- */
  raiz.addEventListener("click", async (e) => {
    const chip = e.target.closest(".chips button, .rutas .ruta");
    if (chip) {
      chip.parentElement.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b === chip)));
      return;
    }
    const usar = e.target.closest(".usar");
    if (usar) {
      const caja = usar.closest(".reto-r"), p = window.PIENSA[+caja.dataset.i];
      const res = leerLlave($(".llave", caja).value, p);
      if (res.error) { estado(caja, res.error, "error"); return; }
      caja.querySelectorAll(".chips").forEach((g, k) => g.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(+b.dataset.n === res.notas[k]))));
      estado(caja, "Notas puestas con la llave. Ahora pulsa Enviar notas.", "ok");
      return;
    }
    const el = e.target.closest(".enviar-llave");
    if (el) {
      const caja = el.closest(".reto-r"), p = window.PIENSA[+caja.dataset.i];
      if (faltanDatos()) { estado(caja, avisoDatos, "error"); return; }
      const texto = $(".llave", caja).value.trim();
      if (!texto) { estado(caja, "Termina la actividad para conseguir la llave (o pégala aquí).", "error"); return; }
      const res = leerLlave(texto, p);
      if (res.error) { estado(caja, res.error, "error"); return; }
      const filas = indPiensa(p).map(([cod], k) => {
        V().registrar(clavePiensa(p, cod), { nota: res.notas[k], codigo: cod, pantalla: "Piensa", actividad: p.titulo }, true);
        return { destino: destinoPiensa(p), ciudad: p.titulo, personaje: "Piensa", programa: "Llave " + res.llave, indicador: cod, valoracion: res.notas[k] };
      });
      el.disabled = true; estado(caja, "Enviando…", "");
      const ok = await V().enviarVarias(filas);
      el.disabled = false;
      if (ok) { pintarPiensa(); const c2 = raiz.querySelector(`.reto-r[data-i="${caja.dataset.i}"]`); if (c2) { estado(c2, "✓ Enviada.", "ok"); c2.scrollIntoView({ block: "center" }); } }
      else estado(caja, "No se ha podido enviar. Revisa la conexión y vuelve a pulsar.", "error");
      return;
    }
    const au = e.target.closest(".enviar-auto");
    if (au) {
      const caja = au.closest(".reto-r"), id = caja.dataset.rincon, r = RINCONES.find((x) => x.id === id);
      if (faltanDatos()) { estado(caja, avisoDatos, "error"); return; }
      const notas = leerChips(caja);
      if (!notas.length) { estado(caja, "Elige de 0 a 5 en al menos una frase.", "error"); return; }
      const obj = {};
      notas.forEach((n) => { V().registrar(n.clave, { nota: n.nota }, true); obj[n.clave.split("|")[1]] = n.nota; });
      au.disabled = true; estado(caja, "Enviando…", "");
      const ok = await V().enviar({ accion: "autoevaluacion", rincon: r.nombre, notas: obj });
      au.disabled = false;
      estado(caja, ok ? "✓ Autoevaluación enviada a tu profe." : "No se ha podido enviar. Revisa la conexión y vuelve a pulsar.", ok ? "ok" : "error");
      return;
    }
    const fin = e.target.closest(".terminar");
    if (fin) {
      const caja = fin.closest(".reto-r"), a = crea()[+caja.dataset.i];
      if (faltanDatos()) { estado(caja, avisoDatos, "error"); return; }
      const rb = caja.querySelector('.ruta[aria-checked="true"]');
      const ruta = a.rutas.length === 1 ? "Todos" : rb ? rb.dataset.ruta : "";
      if (!ruta) { estado(caja, "Marca primero la ruta que has hecho.", "error"); return; }
      fin.disabled = true; estado(caja, "Enviando…", "");
      V().registrar(claveHecho(a), { nota: "✓ Terminado", hecho: true, ruta, pantalla: "Crea", actividad: a.titulo }, true);
      await V().enviar({ destino: destinoCrea(a), ciudad: a.titulo, personaje: "Crea", programa: "Terminado · " + ruta });
      pintarCrea();
      const sig = raiz.querySelector(`.reto-r[data-i="${+caja.dataset.i + 1}"]`);
      if (sig) sig.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const env = e.target.closest(".enviar");
    if (!env) return;
    const caja = env.closest(".reto-r");
    if (faltanDatos()) { estado(caja, avisoDatos, "error"); return; }
    const notas = leerChips(caja);
    if (!notas.length) { estado(caja, "Elige una nota de 0 a 5 en al menos un indicador.", "error"); return; }
    const tipo = caja.dataset.tipo, filas = [];
    if (tipo === "crea") {
      const a = crea()[+caja.dataset.i];
      const rb = caja.querySelector('.ruta[aria-checked="true"]');
      const ruta = a.rutas.length === 1 ? "Todos" : rb ? rb.dataset.ruta : "";
      if (a.rutas.length > 1 && !ruta) { estado(caja, "Elige primero tu ruta.", "error"); return; }
      V().registrar(`crea-ruta-${cursoN()}-${a.sa}-${a.s}`, { nota: 0, ruta }, true);
      notas.forEach((n) => {
        const cod = n.clave.split("|")[1];
        V().registrar(n.clave, { nota: n.nota, codigo: cod, pantalla: "Crea", actividad: a.titulo }, true);
        filas.push({ destino: destinoCrea(a), ciudad: a.titulo, personaje: "Crea", programa: ruta, indicador: cod, valoracion: n.nota });
      });
    } else if (tipo === "piensa") {
      const p = window.PIENSA[+caja.dataset.i], llave = $(".llave", caja).value.trim().toUpperCase();
      notas.forEach((n) => {
        const cod = n.clave.split("|")[1];
        V().registrar(n.clave, { nota: n.nota, codigo: cod, pantalla: "Piensa", actividad: p.titulo }, true);
        filas.push({ destino: destinoPiensa(p), ciudad: p.titulo, personaje: "Piensa", programa: llave ? "Llave " + llave : "", indicador: cod, valoracion: n.nota });
      });
    } else {
      const x = V().filas().find((f) => f.clave === caja.dataset.clave), n = notas[0];
      const prev = V().leer()[x.clave] || {};
      V().registrar(x.clave, Object.assign({}, prev, { nota: n.nota, codigo: x.codigo, pantalla: x.pantalla, actividad: x.actividad }), true);
      filas.push({ destino: x.destino, ciudad: x.ciudad, personaje: x.pantalla, programa: "Nota revisada", intentos: x.intentos || "", bloques: x.bloques, indicador: x.codigo, valoracion: n.nota });
    }
    env.disabled = true; estado(caja, "Enviando…", "");
    const ok = await V().enviarVarias(filas);
    env.disabled = false;
    estado(caja, !window.REGISTRO || !window.REGISTRO.url ? "Nota guardada en este ordenador (la hoja de Google no está configurada)."
      : ok ? `✓ Enviado: ${filas.length} ${filas.length === 1 ? "nota" : "notas"} a la hoja.` : "Guardado aquí, pero no se ha podido enviar. Revisa la conexión y vuelve a pulsar.", ok ? "ok" : "error");
  });

  /* ---------- Rutas ---------- */
  function ruta(hash) {
    const h = hash || "";
    let hecho = true;
    if (h === "" || h === "#" || h === "#inicio") pintarPortada();
    else if (h === "#crea") pintarCrea();
    else if (h === "#piensa") pintarPiensa();
    else if (h === "#notas-prog") pintarNotas("prog");
    else if (h === "#notas-rob") pintarNotas("rob");
    else if (h === "#profe" && window.Profe) window.Profe.pintar(raiz);
    else if (h === "#familias" && window.Familias) window.Familias.pintar(raiz);
    else hecho = false;
    raiz.hidden = !hecho;
    if (hecho) window.scrollTo(0, 0);
    return hecho;
  }

  definir();
  // Si la actividad de Piensa está abierta en otra pestaña, al volver se ve la llave nueva.
  window.addEventListener("storage", (e) => { if (e.key === LLAVES && location.hash === "#piensa") pintarPiensa(); });
  window.addEventListener("focus", () => { if (location.hash === "#piensa") pintarPiensa(); });
  return { ruta, leerLlave };
})();
