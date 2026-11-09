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
  const CLASES = ["P5A", "P5B", "P6A", "P6B"];
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
        <label for="r-clase">Curso<select id="r-clase"><option value="">Elige</option>${CLASES.map((c) => `<option${a.clase === c ? " selected" : ""}>${c}</option>`).join("")}</select></label>
        <label for="r-nombre">Nombre<input id="r-nombre" maxlength="60" placeholder="Por ejemplo: Lucía Martín" value="${esc(a.nombre)}"></label>
        <label for="r-usuario">Usuario Educacyl<input id="r-usuario" maxlength="60" placeholder="nombre.apellido" value="${esc(a.usuario)}"></label>
        <span class="alumno-ok" id="r-ok"></span>
      </form>
    </div></section>
    <section class="seccion" style="padding-top:0"><div class="envoltura">
      <span class="etiqueta">Paso 2</span>
      <h2>Elige un rincón</h2>
      <div class="rincones" id="r-lista"></div>
      <div class="excel-fila"><a class="btn sec" href="#insignias">🏅 Mis insignias</a><button class="btn sec" id="r-excel">Descargar mi valoración (Excel)</button><span>Todas tus notas de los cuatro rincones y la media de cada indicador.</span></div>
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
    if (window.ListaAlumnos) window.ListaAlumnos.montar(n, c, u);
    if (window.Acceso) window.Acceso.montar($("#r-form"), { clase: c, nombre: n, usuario: u });
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
    const AC = !!window.ADAPTADO && lista.some((a) => a.ac);
    const pais = paisAC();
    raiz.innerHTML = cabecera(r, "Crea", AC ? "Mira la ficha, escúchala 🔊 y escribe la palabra que falta." : `Retos de ${V().curso()} en orden. Elige tu ruta, haz el reto y pulsa «He terminado el reto» para abrir el siguiente. La nota de los indicadores la pone tu profe.`) +
      (AC ? `<div class="envoltura seccion ac-paises"><h2>Elige tu país</h2><div class="ac-flags">${Object.keys(window.PAISES_AC).map((k) =>
        `<button type="button" class="ac-flag" data-pais="${k}" aria-pressed="${k === pais}"><span>${window.PAISES_AC[k].flag}</span>${k}</button>`).join("")}</div></div>` : "") +
      `<div class="envoltura seccion">${Object.keys(porSA).map((sa) => `
        <h2 class="sa-tit">${sa}</h2>
        <div class="retos-r">${porSA[sa].map((i) => tarjetaCrea(lista[i], i)).join("")}</div>`).join("")}</div>`;
  }
  function paisAC() { try { const p = localStorage.getItem("rumbo-pais-ac"); return window.PAISES_AC && window.PAISES_AC[p] ? p : "Francia"; } catch (e) { return "Francia"; } }
  // Cambia {capital}, {pais}… por los datos del país elegido.
  function rellenar(t) { const k = paisAC(), P = Object.assign({ pais: k }, window.PAISES_AC[k]); return String(t).replace(/\{(\w+)\}/g, (m, x) => (P[x] != null ? P[x] : m)); }
  function respuestaOk(q, v) {
    const n = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zñ0-9 ]/g, "").trim();
    const esp = q[1][0] === "=" ? q[1].slice(1).split("|") : [rellenar("{" + q[1] + "}")];
    return esp.some((x) => n(x) && (n(v) === n(x) || n(v).split(" ").includes(n(x))));
  }
  function tarjetaCreaAC(a, i) {
    const x = a.ac, lista = crea(), h = V().leer()[claveHecho(a)] || {};
    if (i > 0 && !hecho(lista[i - 1])) {
      return `<article class="reto-r bloqueado ac-reto" data-tipo="crea" data-i="${i}"><div class="reto-r-cab"><span class="ses">${a.sa} · ${a.s}</span><h3>🔒 ${esc(x.facil)}</h3></div>
        <p class="aviso-bloq">Primero termina: <b>${esc(lista[i - 1].ac ? lista[i - 1].ac.facil : lista[i - 1].titulo)}</b>.</p></article>`;
    }
    const ficha = rellenar(x.ficha), guard = h.respuestas || [];
    return `<article class="reto-r ac-reto" data-tipo="crea" data-i="${i}">
      <div class="reto-r-cab"><span class="ses">${a.sa} · ${a.s}</span><h3>${esc(x.facil)}</h3></div>
      <ol class="ac-pasos">${x.pasos.map((p) => `<li>${esc(p)}</li>`).join("")}</ol>
      <div class="ac-ficha"><p>${esc(ficha)}</p><button type="button" class="btn sec leer" data-leer="${esc(ficha)}" aria-label="Escuchar la ficha">🔊 Escuchar</button>
        ${window.FichaDocx ? `<button type="button" class="btn sec ac-docx">📄 Descargar ficha (Word)</button>` : ""}</div>
      <div class="ac-preguntas">${x.preguntas.map((q, k) => `<label class="ac-preg"><span><button type="button" class="leer mini" data-leer="${esc(q[0])}" aria-label="Escuchar la pregunta">🔊</button> ${esc(q[0])}</span>
        <input class="ac-resp" data-k="${k}" maxlength="30" autocomplete="off" value="${esc(guard[k] || "")}"><b class="ac-ok" aria-live="polite"></b></label>`).join("")}</div>
      <div class="inds"><p class="inds-t">Lo que valora tu profe</p>${a.ind.map((cod) => `<div class="fila-ind"><div class="fila-ind-t"><span class="cod">Ind. ${esc(cod)}</span> ${esc(textoInd(cod))}</div></div>`).join("")}</div>
      ${h.hecho
        ? `<p class="hecho-ok">✓ ¡Muy bien! Reto terminado 😊</p>`
        : `<div class="enviar-fila"><button type="button" class="btn terminar">✅ He terminado</button><span class="estado" aria-live="polite"></span></div>`}
    </article>`;
  }
  function tarjetaCrea(a, i) {
    if (window.ADAPTADO && a.ac) return tarjetaCreaAC(a, i);
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
    if (window.ADAPTADO && window.PIENSA_AC) return pintarPiensaAC(r, L);
    raiz.innerHTML = cabecera(r, "Piensa · Pasaporte TIC", `Diez paradas de ciudadanía digital. Abre la actividad, termínala y vuelve aquí: la llave se rellena sola (o pégala). Pulsa «Enviar mi llave» y tu profe verá tu resultado.`) +
      `<div class="envoltura seccion"><div class="retos-r">${(window.PIENSA || []).map((p, i) => {
        const g = L[p.pre], auto = g ? leerLlave(g.llave, p) : {};
        return `<article class="reto-r" data-tipo="piensa" data-i="${i}">
          <div class="reto-r-cab"><span class="ses">Parada ${i + 1}</span><h3>${esc(p.titulo)}</h3></div>
          <p><a class="btn sec abrir" href="piensa/${window.ADAPTADO && window.PIENSA_AC && window.PIENSA_AC[p.slug] ? "facil.html?p=" + p.slug : p.slug + ".html"}" target="_blank" rel="noopener">Abrir la actividad ↗</a></p>
          <div class="llave-fila"><label>Llave<input class="llave" placeholder="${p.pre}-…" value="${esc(g ? g.llave : "")}" autocomplete="off" spellcheck="false"></label></div>
          ${g ? `<p class="nota-llave">${g.completa ? "🔑 Llave conseguida en la actividad." : "Llave de una actividad sin terminar: termínala para conseguir la llave completa."}</p>` : ""}
          <div class="inds"><p class="inds-t">Indicadores de tu curso</p>${indPiensa(p).map(([cod, t]) => `<div class="fila-ind"><div class="fila-ind-t"><span class="cod">Ind. ${esc(cod)}</span> ${esc(t)}</div></div>`).join("")}</div>
          ${enviada(p) ? `<p class="hecho-ok">✓ Llave enviada a tu profe</p>` : ""}
          <div class="enviar-fila"><button type="button" class="btn enviar-llave">${enviada(p) ? "Volver a enviar la llave" : "Enviar mi llave"}</button><span class="estado" aria-live="polite"></span></div>
        </article>`;
      }).join("")}</div></div>`;
  }

  /* Piensa con adaptación curricular: solo título, dibujo, «Empezar» y «Enviar». Sin llaves ni indicadores a la vista. */
  function pintarPiensaAC(r, L) {
    const intro = "Elige una parada. Lee, mira el vídeo y juega. Al volver, pulsa «Enviar».";
    raiz.innerHTML = cabecera(r, "Piensa", `${esc(intro)} <button type="button" class="leer mini" data-leer="${esc(intro)}" aria-label="Escuchar">🔊</button>`) +
      `<div class="envoltura seccion"><div class="retos-r ac-piensa">${(window.PIENSA || []).map((p, i) => {
        const A = window.PIENSA_AC[p.slug]; if (!A) return "";
        const g = L[p.pre], hecha = enviada(p);
        return `<article class="reto-r ac-reto" data-tipo="piensa" data-i="${i}">
          <div class="reto-r-cab"><span class="ses">${i + 1}</span><h3><span aria-hidden="true">${A.juego[0][0]}</span> ${esc(p.titulo)}</h3></div>
          <input type="hidden" class="llave" value="${esc(g ? g.llave : "")}">
          ${g ? `<p class="nota-llave">⭐ ¡Terminada!</p>` : ""}
          <p><a class="btn abrir" href="piensa/facil.html?p=${p.slug}" target="_blank" rel="noopener">▶ Empezar</a></p>
          ${hecha ? `<p class="hecho-ok">✓ Enviada</p>` : ""}
          <div class="enviar-fila"${g ? "" : " hidden"}><button type="button" class="btn enviar-llave">📨 Enviar</button><span class="estado" aria-live="polite"></span></div>
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
          <p><button type="button" class="btn sec oir" data-oir="${esc("Elige de 0 a 5 en cada frase. " + ESC.map((t, n) => n + ": " + String(t).replace(/<[^>]+>/g, "")).join(". "))}">🔊 Escuchar cómo se puntúa</button></p>
          <ol class="escala escala-auto" start="0">${ESC.map((t, n) => `<li><button type="button" class="leer mini oir" data-oir="${esc(n + ". " + String(t).replace(/<[^>]+>/g, ""))}" aria-label="Escuchar">🔊</button> <b>${n}</b> ${t}</li>`).join("")}</ol>
          <div class="inds">${cods.map((cod) => `<div class="fila-ind"><div class="fila-ind-t"><button type="button" class="leer mini oir" data-oir="${esc(frases[cod] || textoInd(cod))}" aria-label="Escuchar la frase">🔊</button> <span class="cod">Ind. ${esc(cod)}</span> <b>${esc(frases[cod] || textoInd(cod))}</b></div>${chips(`auto-${cursoN()}-${id}|${cod}`, guardada(cod))}</div>`).join("")}</div>
          <div class="enviar-fila"><button type="button" class="btn enviar-auto">Enviar mi autoevaluación</button><span class="estado" aria-live="polite"></span></div>
        </article>
        <h2 class="sa-tit" style="margin-top:24px">Mis notas jugando</h2>
        <p><a class="btn" href="${r.ir}">${r.accion}</a></p>
        <div class="que-nota">
          <h3>¿Qué significa mi nota?</h3>
          <p>Cada actividad se valora de <b>0 a 5</b> según lo que has conseguido en ese indicador de logro. La nota se pone sola al jugar y tu profe la puede revisar:</p>
          <ul><li>Si llegas en 1 o 2 intentos: <b>5</b>. En 3 o 4 intentos: <b>4</b>. Con más intentos: <b>3</b>.</li>
            <li>Si usas más bloques de los necesarios, baja un poco (nunca de 3 si lo has conseguido).</li>
            <li>Si no llegas al final: <b>2</b> si has hecho una parte, <b>1</b> si lo has intentado.</li></ul>
          <ol class="escala" start="0">${ESCALA.map((t, n) => `<li><b>${n}</b> ${t}</li>`).join("")}</ol>
          <p>Si tienes poca nota en algo, vuelve a jugar esa actividad: se guarda tu mejor nota.</p>
        </div>
        <div class="lista-notas">${f.map((x) => `<article class="reto-r nota-act">
          <div class="reto-r-cab"><span class="ses">${esc(x.pantalla)}${x.codigo ? " · Ind. " + esc(x.codigo) : ""}</span><h3>${esc(x.actividad)}</h3></div>
          <p class="nota-fija">${V().leer()[x.clave] ? `Nota: <b>${x.nota}</b> de 5 · ${esc(ESCALA[x.nota] || "")}` : "Todavía sin hacer (cuenta como 0)"}</p>
        </article>`).join("")}</div>
      </div>`;
  }

  /* ---------- Clics ---------- */
  raiz.addEventListener("input", (e) => {
    const r = e.target.closest(".ac-resp"); if (!r) return;
    const caja = r.closest(".reto-r"), a = crea()[+caja.dataset.i], q = a.ac.preguntas[+r.dataset.k], ok = r.parentElement.querySelector(".ac-ok");
    ok.textContent = r.value.trim() && respuestaOk(q, r.value) ? "✅" : "";
  });
  raiz.addEventListener("click", async (e) => {
    const oir = e.target.closest(".oir");
    if (oir) { e.preventDefault(); if (window.LeerAC) window.LeerAC(oir.dataset.oir); return; }
    const dx = e.target.closest(".ac-docx");
    if (dx) {
      const a = crea()[+dx.closest(".reto-r").dataset.i], q = a && a.ac, al = V().alumno();
      if (q) window.FichaDocx({ titulo: `${q.facil} · ${paisAC()}`, nombre: al.nombre, clase: al.clase, pasos: q.pasos, ficha: rellenar(q.ficha),
        preguntas: q.preguntas.map((x) => x[0]), archivo: `Ficha ${a.sa} ${a.s} ${paisAC()}${al.nombre ? " " + al.nombre : ""}`.replace(/[\\/:*?"<>|]/g, "") });
      return;
    }
    const fl = e.target.closest(".ac-flag");
    if (fl) { try { localStorage.setItem("rumbo-pais-ac", fl.dataset.pais); } catch (x) {} pintarCrea(); return; }
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
      const indiceCadena = +caja.dataset.i, totalCadena = (window.PIENSA || []).length;
      if (window.RetosCadena && !(await window.RetosCadena.entrar("piensa", indiceCadena, totalCadena))) { estado(caja, "Necesitas el código de la parada anterior para continuar.", "error"); return; }
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
      if (ok) {
        const indice = +caja.dataset.i, total = (window.PIENSA || []).length;
        const cadena = window.RetosCadena ? await window.RetosCadena.completar("piensa", indice, total) : null;
        pintarPiensa(); const c2 = raiz.querySelector(`.reto-r[data-i="${indice}"]`);
        if (c2) {
          estado(c2, cadena && cadena.ok && cadena.codigo ? `✓ Enviada. Código para la siguiente parada: <b>${esc(cadena.codigo)}</b>. Guárdalo.` : cadena && !cadena.ok ? `✓ Enviada, pero no se pudo generar el código: ${esc(cadena.error || "error de conexión")}` : "✓ Enviada.", cadena && !cadena.ok ? "error" : "ok");
          c2.scrollIntoView({ block: "center" });
        }
      }
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
      let ruta = a.rutas.length === 1 ? "Todos" : rb ? rb.dataset.ruta : "", respuestas = null;
      if (window.ADAPTADO && a.ac) {
        respuestas = [...caja.querySelectorAll(".ac-resp")].map((x) => x.value.trim());
        if (respuestas.some((v) => !v)) { estado(caja, "✏️ Escribe una palabra en cada pregunta.", "error"); return; }
        const bien = a.ac.preguntas.filter((q, k) => respuestaOk(q, respuestas[k])).length;
        ruta = `Adaptada · ${paisAC()} · ${bien} de ${respuestas.length} bien (${respuestas.join(", ")})`;
      }
      if (!ruta) { estado(caja, "Marca primero la ruta que has hecho.", "error"); return; }
      fin.disabled = true; estado(caja, "Enviando…", "");
      V().registrar(claveHecho(a), Object.assign({ nota: "✓ Terminado", hecho: true, ruta, pantalla: "Crea", actividad: a.titulo }, respuestas ? { respuestas } : {}), true);
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


  /* ---------- Insignias y pasaporte final ---------- */
  function datosInsignias() {
    const a = V().alumno(), registros = V().leer(), filas = V().filas();
    const mapa = new Map();
    filas.forEach((f) => {
      if (!f.destino || !f.clave) return;
      const k = f.grupo + "|" + f.destino;
      if (!mapa.has(k)) mapa.set(k, { grupo: f.grupo, destino: f.destino, actividad: f.actividad || f.destino, notas: [], total: 0, registradas: 0 });
      const g = mapa.get(k), r = registros[f.clave];
      g.total++;
      if (r && typeof r.nota === "number") { g.notas.push(r.nota); g.registradas++; }
    });
    // Los retos Crea también requieren que el alumno haya marcado que los ha terminado.
    const resultado = Array.from(mapa.values()).map((g) => {
      const media = g.notas.length ? g.notas.reduce((x,y)=>x+y,0)/g.notas.length : 0;
      const completa = g.total > 0 && g.registradas === g.total;
      return Object.assign(g, { media: Math.round(media*10)/10, completa, ganada: completa && media >= 2.5 });
    });
    return resultado.sort((x,y) => x.grupo.localeCompare(y.grupo) || x.destino.localeCompare(y.destino));
  }
  function pintarInsignias() {
    const a = V().alumno(), lista = datosInsignias(), ganadas = lista.filter(x=>x.ganada).length;
    const todas = lista.length > 0 && ganadas === lista.length;
    const grupoNombre = { crea:"Crea", prog:"Programación", rob:"Robótica", piensa:"Piensa" };
    raiz.innerHTML = `<header class="portada insignias-portada"><div class="envoltura"><a class="volver-r" href="#">← Rincones</a>
      <h1>🏅 Mis insignias <span>Rumbo a Europa</span></h1>
      <p class="sub">${esc(a.nombre || "Alumno/a")} · ${esc(a.clase || "")}</p>
      <div class="insignias-progreso"><b>${ganadas} / ${lista.length}</b><span>insignias conseguidas</span></div>
    </div></header>
    <section class="seccion"><div class="envoltura">
      ${["crea","prog","rob","piensa"].map(id=>{
        const items=lista.filter(x=>x.grupo===id);
        if(!items.length) return "";
        return `<h2 class="sa-tit">${grupoNombre[id]}</h2><div class="insignias-grid">${items.map(x=>`
          <article class="insignia ${x.ganada?"ganada":"pendiente"}">
            <div class="insignia-sello">${x.ganada?"🏅":"🔒"}</div>
            <h3>${esc(x.actividad)}</h3><p>${x.completa?`Media: ${x.media.toFixed(1)} / 5`:"Pendiente de completar las valoraciones"}</p>
            <span>${x.ganada?"¡Insignia conseguida!":x.completa?"Necesitas una media de 2,5":"Aún no conseguida"}</span>
          </article>`).join("")}</div>`;
      }).join("")}
      <div class="pasaporte-final ${todas?"desbloqueado":"bloqueado"}">
        <h2>🌍 Pasaporte Rumbo a Europa</h2>
        <p>${todas?"¡Enhorabuena! Has conseguido todas las insignias del curso.":"Consigue todas las insignias para desbloquear tu pasaporte final."}</p>
        <button class="btn" id="imprimir-pasaporte" ${todas?"":"disabled"}>🖨️ Imprimir mi pasaporte</button>
      </div>
    </div></section>`;
    const btn=$("#imprimir-pasaporte");
    if(btn) btn.onclick=()=>imprimirPasaporte(a,lista);
  }
  function imprimirPasaporte(a,lista) {
    const w=window.open("","_blank");
    if(!w) { alert("Permite las ventanas emergentes para imprimir el pasaporte."); return; }
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Pasaporte Rumbo a Europa</title>
    <style>body{font-family:Arial,sans-serif;color:#173b62;margin:25px}.pas{border:8px double #b78a36;border-radius:18px;padding:28px;text-align:center;min-height:850px}h1{font-size:34px;margin:12px}h2{color:#b78a36}.nombre{font-size:24px;border-bottom:1px solid #aaa;padding:14px}.sellos{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:28px 0}.sello{border:2px solid #b78a36;border-radius:14px;padding:16px;min-height:90px}.emoji{font-size:32px}.pie{margin-top:40px}@media print{button{display:none}}</style></head><body>
    <main class="pas"><h2>CEIP TIERRA DE PINARES</h2><h1>🌍 PASAPORTE</h1><h2>RUMBO A EUROPA</h2><p class="nombre">${esc(a.nombre||"")} · ${esc(a.clase||"")}</p>
    <h2>Mis insignias de aprendizaje</h2><div class="sellos">${lista.map(x=>`<div class="sello"><div class="emoji">🏅</div><b>${esc(x.actividad)}</b><p>Media ${x.media.toFixed(1)} / 5</p></div>`).join("")}</div>
    <h2>¡MISIÓN CUMPLIDA!</h2><p>Explorador/a digital de Europa</p><p class="pie">Fecha: ${new Date().toLocaleDateString("es-ES")}</p></main><script>window.onload=()=>window.print();</script></body></html>`);
    w.document.close();
  }

  /* ---------- Rutas ---------- */
  function ruta(hash) {
    const h = hash || "";
    let hecho = true;
    if (h === "" || h === "#" || h === "#inicio") pintarPortada();
    else if (h === "#crea") pintarCrea();
    else if (h === "#piensa") pintarPiensa();
    else if (h === "#notas-prog") pintarNotas("prog");
    else if (h === "#notas-rob") pintarNotas("rob");
    else if (h === "#insignias") pintarInsignias();
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
