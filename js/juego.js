(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const AVENTURAS = window.AVENTURAS;
  const NIVELES = AVENTURAS.flatMap((a, ai) => a.niveles.map((n, k) => Object.assign({}, n, { aventura: ai, pos: k })));
  const primeroDe = (ai) => NIVELES.findIndex((n) => n.aventura === ai);
  const PERSONAJES = window.PERSONAJES;
  const COLEGIO = window.COLEGIO;
  const REGISTRO = window.REGISTRO || { url: "" };
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const CLAVE = "rumbo-a-europa-v1";

  /* ---------- Progreso guardado ---------- */
  let progreso = { estrellas: {}, personaje: PERSONAJES[0].id, alumno: { nombre: "", clase: "" } };
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) || "null");
    if (g && typeof g === "object") progreso = Object.assign(progreso, g);
  } catch (e) { /* sin almacenamiento */ }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(progreso)); } catch (e) {} }
  const completados = () => Object.keys(progreso.estrellas).length;
  const desbloqueadoNivel = (i) => NIVELES[i].pos === 0 || !!progreso.estrellas[i - 1];
  const desbloqueadoPers = (p) => completados() >= (p.desbloquea || 0);
  function personajeActual() {
    const p = PERSONAJES.find((x) => x.id === progreso.personaje);
    return p && desbloqueadoPers(p) ? p : PERSONAJES[0];
  }

  /* ---------- Dibujos ---------- */
  function avatar(p) {
    if (p.foto) return `<img src="${p.foto}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:contain;display:block" draggable="false">`;
    return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#ffcc00"/><text x="50" y="62" text-anchor="middle" font-size="36" font-weight="800" fill="#14225a">${p.nombre[0]}</text></svg>`;
  }

  function banderaSVG(b, x, y, w, h) {
    if (b.nordica) {
      const cx = x + w * 0.36, t = h * 0.2;
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${b.fondo}"/>`;
      s += `<rect x="${(cx - t / 2).toFixed(2)}" y="${y}" width="${t.toFixed(2)}" height="${h}" fill="${b.cruz}"/><rect x="${x}" y="${(y + h / 2 - t / 2).toFixed(2)}" width="${w}" height="${t.toFixed(2)}" fill="${b.cruz}"/>`;
      if (b.interior) {
        const ti = t * 0.5;
        s += `<rect x="${(cx - ti / 2).toFixed(2)}" y="${y}" width="${ti.toFixed(2)}" height="${h}" fill="${b.interior}"/><rect x="${x}" y="${(y + h / 2 - ti / 2).toFixed(2)}" width="${w}" height="${ti.toFixed(2)}" fill="${b.interior}"/>`;
      }
      return s;
    }
    if (b.checa) {
      return `<rect x="${x}" y="${y}" width="${w}" height="${h / 2}" fill="#ffffff"/><rect x="${x}" y="${y + h / 2}" width="${w}" height="${h / 2}" fill="#d7141a"/><path d="M${x} ${y} L${(x + w * 0.5).toFixed(2)} ${y + h / 2} L${x} ${y + h}Z" fill="#11457e"/>`;
    }
    if (b.eu) {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#003399"/>`;
      const cx = x + w / 2, cy = y + h / 2, r = h * 0.33;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        s += `<circle cx="${(cx + r * Math.cos(a)).toFixed(2)}" cy="${(cy + r * Math.sin(a)).toFixed(2)}" r="${(h * 0.05).toFixed(2)}" fill="#ffcc00"/>`;
      }
      return s;
    }
    const total = b.w.reduce((a, c) => a + c, 0);
    let s = "", acc = 0;
    b.c.forEach((col, i) => {
      const f = b.w[i] / total;
      if (b.o === "v") s += `<rect x="${(x + acc * w).toFixed(2)}" y="${y}" width="${(f * w + 0.3).toFixed(2)}" height="${h}" fill="${col}"/>`;
      else s += `<rect x="${x}" y="${(y + acc * h).toFixed(2)}" width="${w}" height="${(f * h + 0.3).toFixed(2)}" fill="${col}"/>`;
      acc += f;
    });
    return s;
  }
  const miniBandera = (b) => `<svg class="mini-bandera" viewBox="0 0 36 24">${banderaSVG(b, 0, 0, 36, 24)}</svg>`;

  const ICONOS = {
    X: `<svg viewBox="0 0 100 100"><rect x="44" y="62" width="12" height="26" rx="3" fill="#7a4b2a"/><circle cx="50" cy="44" r="30" fill="#2f8f5b"/><circle cx="38" cy="36" r="10" fill="#3fa76c"/></svg>`,
    B: `<svg viewBox="0 0 100 100"><rect x="38" y="22" width="24" height="14" rx="5" fill="none" stroke="#5b3a1e" stroke-width="6"/><rect x="18" y="34" width="64" height="48" rx="9" fill="#c0672b"/><rect x="18" y="52" width="64" height="7" fill="#8d4718"/><rect x="34" y="34" width="6" height="48" fill="#e9b04c"/><rect x="60" y="34" width="6" height="48" fill="#e9b04c"/></svg>`,
    W: `<svg viewBox="0 0 100 100"><path d="M10 40 q10 -8 20 0 t20 0 t20 0 t20 0" fill="none" stroke="#d9f1ff" stroke-width="5" stroke-linecap="round"/><path d="M10 64 q10 -8 20 0 t20 0 t20 0 t20 0" fill="none" stroke="#d9f1ff" stroke-width="5" stroke-linecap="round"/></svg>`,
    S: `<svg class="icono-sello" viewBox="0 0 100 100"><circle cx="50" cy="50" r="36" fill="#fff" stroke="#c8102e" stroke-width="5"/><circle cx="50" cy="50" r="27" fill="none" stroke="#c8102e" stroke-width="2" stroke-dasharray="4 3"/><path d="M50 32 l5.3 11 12 1.6 -8.8 8.3 2.2 11.9 -10.7 -5.8 -10.7 5.8 2.2 -11.9 -8.8 -8.3 12 -1.6z" fill="#c8102e"/></svg>`
  };
  function metaSVG(b) {
    return `<svg viewBox="0 0 100 100"><ellipse cx="34" cy="88" rx="16" ry="5" fill="rgba(0,0,0,.18)"/><rect x="31" y="10" width="6" height="78" rx="3" fill="#5a5f6e"/><circle cx="34" cy="10" r="5" fill="#ffcc00"/>${banderaSVG(b, 37, 14, 50, 34)}<rect x="37" y="14" width="50" height="34" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/></svg>`;
  }
  const SELLO_HECHO = (txt) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="2"/><text x="50" y="46" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="${txt.length > 6 ? Math.max(9, 15 - (txt.length - 6) * 1.6).toFixed(1) : 15}" fill="currentColor">${txt}</text><text x="50" y="64" text-anchor="middle" font-family="DM Mono, monospace" font-size="10" fill="currentColor">VISADO</text></svg>`;
  // Pini de espaldas (dibujo vectorial propio)
  function espaldaSVG(e) {
    e = e || {};
    const M = "#cd6a35", C = "#f3e6b0", L = "#1b1b1b";
    const st = `stroke="${L}" stroke-width="1.6" stroke-linejoin="round"`;
    let s = `<svg viewBox="0 0 100 106" xmlns="http://www.w3.org/2000/svg">`;
    // cola (detrás, a la izquierda vista de espaldas)
    s += `<path d="M50 90 C24 96 2 76 6 48 C9 22 30 8 48 14 C64 20 66 40 54 48 C46 53 38 48 40 40" fill="${M}" ${st}/>`;
    s += `<path d="M50 90 C36 80 32 66 38 56" fill="none" ${st}/>`;
    s += `<path d="M20 50 C18 32 34 22 44 28 C52 33 48 44 40 42" fill="none" stroke="${C}" stroke-width="6" stroke-linecap="round"/>`;
    // pies
    s += `<ellipse cx="54" cy="100" rx="9" ry="4.5" fill="${M}" ${st}/><ellipse cx="76" cy="100" rx="9" ry="4.5" fill="${M}" ${st}/>`;
    // cuerpo
    s += `<ellipse cx="65" cy="76" rx="21" ry="24" fill="${M}" ${st}/>`;
    if (e.ropa === "rayas") {
      s += `<clipPath id="cr"><ellipse cx="65" cy="76" rx="21" ry="24"/></clipPath><g clip-path="url(#cr)"><rect x="40" y="54" width="50" height="30" fill="#fff"/>`;
      for (let y = 56; y < 84; y += 7) s += `<rect x="40" y="${y}" width="50" height="3.5" fill="#e3001b"/>`;
      s += `</g><ellipse cx="65" cy="76" rx="21" ry="24" fill="none" ${st}/>`;
    }
    if (e.ropa === "peto") {
      s += `<clipPath id="cp"><ellipse cx="65" cy="76" rx="21" ry="24"/></clipPath><g clip-path="url(#cp)"><rect x="40" y="72" width="50" height="34" fill="#2b4fae"/></g>`;
      s += `<path d="M53 72 L56 54 M77 72 L74 54" stroke="#2b4fae" stroke-width="5"/><ellipse cx="65" cy="76" rx="21" ry="24" fill="none" ${st}/>`;
    }
    // brazos
    s += `<ellipse cx="45" cy="74" rx="5" ry="9" fill="${M}" ${st}/><ellipse cx="85" cy="74" rx="5" ry="9" fill="${M}" ${st}/>`;
    // orejas y cabeza
    s += `<path d="M48 30 L50 8 L62 22Z" fill="${M}" ${st}/><path d="M82 30 L80 8 L68 22Z" fill="${M}" ${st}/>`;
    s += `<circle cx="65" cy="36" r="20" fill="${M}" ${st}/>`;
    s += `<path d="M56 46 Q65 50 74 46" fill="none" stroke="#a9512a" stroke-width="2"/>`;
    if (e.gorro === "rayas") {
      s += `<path d="M45 32 Q46 12 65 12 Q84 12 85 32Z" fill="#fff" ${st}/><path d="M47 24 H83 M50 18 H80" stroke="#e3001b" stroke-width="4"/><rect x="44" y="28" width="42" height="7" rx="3" fill="#e3001b" ${st}/><circle cx="65" cy="10" r="5" fill="#e3001b" ${st}/>`;
    }
    if (e.gorro === "paja") {
      s += `<ellipse cx="65" cy="24" rx="34" ry="7" fill="#f2c230" ${st}/><path d="M50 24 Q50 6 65 6 Q80 6 80 24Z" fill="#f7d54a" ${st}/>`;
    }
    return s + `</svg>`;
  }
  const FLECHA = `<svg viewBox="0 0 24 24"><path d="M5 12h12M12 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  /* ---------- Pantalla de inicio ---------- */
  function pintarMarca() {
    const logo = COLEGIO.logo ? `<img src="${COLEGIO.logo}" alt="Logo">` : `<span class="escudo">LOGO</span>`;
    $("#marca").innerHTML = `${logo}<span>${COLEGIO.nombre} · ${COLEGIO.lema}</span>`;
    $("#pie").textContent = `${COLEGIO.nombre} · Proyecto “${COLEGIO.lema}”. Juego de programación por bloques.`;
    let s = "";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const x = 100 + 82 * Math.cos(a), y = 100 + 82 * Math.sin(a);
      s += `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(.55)" d="M0 -14 l4.1 8.5 9.3 1.3 -6.8 6.5 1.7 9.2 -8.3 -4.5 -8.3 4.5 1.7 -9.2 -6.8 -6.5 9.3 -1.3z" fill="#ffcc00"/>`;
    }
    $("#aro-estrellas").innerHTML = `<circle cx="100" cy="100" r="66" fill="#1f3285"/>${s}`;
  }

  function pintarInicio() {
    const actual = personajeActual();
    $("#avatar-portada").innerHTML = avatar(actual);
    const hechos = completados();
    $("#lista-personajes").innerHTML = PERSONAJES.map((p) => {
      const ok = desbloqueadoPers(p);
      const sel = p.id === actual.id;
      const falta = (p.desbloquea || 0) - hechos;
      return `<button class="personaje" data-id="${p.id}" aria-pressed="${sel}" ${ok ? "" : "disabled"}>
        <div class="cara">${avatar(p)}</div><strong>${p.nombre}</strong>
        <small>${ok ? p.rol : `Se desbloquea con ${falta} destino${falta === 1 ? "" : "s"} más`}</small></button>`;
    }).join("");
    $("#lista-personajes").querySelectorAll(".personaje").forEach((b) => {
      b.onclick = () => { progreso.personaje = b.dataset.id; guardar(); pintarInicio(); };
    });

    $("#lista-destinos").innerHTML = AVENTURAS.map((av, ai) => {
      const hechas = NIVELES.filter((n, i) => n.aventura === ai && progreso.estrellas[i]).length;
      const tarjetas = NIVELES.map((n, i) => {
        if (n.aventura !== ai) return "";
        const est = progreso.estrellas[i] || 0;
        const ok = desbloqueadoNivel(i);
        return `<button class="destino" data-i="${i}" ${ok ? "" : "disabled"}>
        <span class="num">Destino ${n.pos + 1} de ${av.niveles.length}</span>
        ${miniBandera(n.bandera)}
        <strong>${n.ciudad}</strong><span class="pais">${n.pais}</span>
        ${indicadorNivel(n) ? `<span class="ind-mini">Ind. ${indicadorNivel(n).codigo}</span>` : ""}
        <span class="estrellas">${ok ? "<b>" + "★".repeat(est) + "</b>" + "★".repeat(3 - est) : "Bloqueado"}</span>
        ${est ? `<span class="sello-hecho">${SELLO_HECHO(n.ciudad.toUpperCase().slice(0, 9))}</span>` : ""}
      </button>`;
      }).join("");
      return `<div class="aventura"><div class="aventura-cab"><span class="etiqueta">Aventura ${ai + 1}</span><h3>${av.nombre}</h3><p>${av.resumen}</p><span class="aventura-cuenta">${hechas} / ${av.niveles.length}</span></div><div class="destinos">${tarjetas}</div></div>`;
    }).join("");
    $("#lista-destinos").querySelectorAll(".destino").forEach((b) => {
      b.onclick = () => irANivel(+b.dataset.i);
    });
  }

  /* ---------- Estado del juego ---------- */
  let nivelI = 0, nivel = null;
  let programa = [];         // árbol de bloques
  let objetivoId = null;     // id del bloque Repetir donde se añaden bloques (null = principal)
  let uid = 0;
  let pj = null;             // estado del personaje
  let ejecucion = 0;         // token para cancelar
  let corriendo = false;
  let intentos = 0;          // veces que se pulsa Ejecutar en este nivel

  const NOMBRES = { avanzar: "Avanzar", izq: "Girar a la izquierda", der: "Girar a la derecha", saltar: "Saltar", repetir: "Repetir", si: "Si…", hasta: "Repetir hasta llegar" };
  const SIMBOLOS = { avanzar: "↑", izq: "↺", der: "↻", saltar: "⤴", repetir: "⟳", si: "?", hasta: "⚑" };
  const CONDICIONES = { salto: "hay algo que saltar delante", camino: "hay camino delante", izq: "hay camino a la izquierda", der: "hay camino a la derecha" };
  const CONTENEDORES = ["repetir", "si", "hasta"];

  function celda(x, y) {
    if (y < 0 || y >= nivel.mapa.length || x < 0 || x >= nivel.mapa[0].length) return null;
    return nivel.mapa[y][x];
  }
  const pisable = (c) => c === "." || c === "S" || c === "G" || c === "P";

  function pedirNombre() {
    const n = $("#in-nombre");
    n.classList.add("falta");
    n.scrollIntoView({ behavior: "smooth", block: "center" });
    n.focus();
  }

  function irANivel(i) {
    if (!desbloqueadoNivel(i)) return;
    if (!progreso.alumno.nombre) { if ($("#juego").hidden) pedirNombre(); else mostrarInicio(), pedirNombre(); return; }
    if (location.hash !== "#destino-" + (i + 1)) { location.hash = "destino-" + (i + 1); return; }
    abrirNivel(i);
  }

  function abrirNivel(i) {
    cancelar();
    nivelI = i; nivel = NIVELES[i];
    programa = []; objetivoId = null; intentos = 0;
    $("#inicio").hidden = true; $("#juego").hidden = false;
    $("#titulo-nivel").textContent = nivel.ciudad;
    $("#pais-nivel").textContent = `${nivel.pais} · ${AVENTURAS[nivel.aventura].nombre} · ${nivel.pos + 1} de ${AVENTURAS[nivel.aventura].niveles.length}`;
    $("#texto-objetivo").textContent = nivel.objetivo;
    $("#texto-dato").textContent = nivel.dato;
    pintarIndicador();
    $("#cara-objetivo").innerHTML = avatar(personajeActual());
    $("#paleta").innerHTML = nivel.bloques.map((t) => `<button class="bloque-btn t-${t}" data-t="${t}"><span aria-hidden="true">${SIMBOLOS[t]}</span>${NOMBRES[t]}</button>`).join("");
    $("#paleta").querySelectorAll(".bloque-btn").forEach((b) => (b.onclick = () => añadir(b.dataset.t)));
    pintarTablero();
    reiniciarPersonaje();
    pintarPrograma();
    $("#panel-puzle").hidden = !PUZLE;
    $("#editor-clasico").hidden = PUZLE;
    document.querySelector(".juego").classList.toggle("con-puzle", PUZLE);
    if (PUZLE) {
      window.EditorBloques.iniciar($("#blockly"), nivel.bloques, cuentaPuzle);
      cuentaPuzle();
    }
    aviso(null);
    window.scrollTo(0, 0);
  }

  function pintarTablero() {
    const t = $("#tablero");
    const filas = nivel.mapa.length, cols = nivel.mapa[0].length;
    t.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    t.style.maxWidth = Math.min(cols * 92, 900) + "px";
    t.style.setProperty("--suelo", nivel.suelo);
    let h = "";
    for (let y = 0; y < filas; y++) for (let x = 0; x < cols; x++) {
      const c = nivel.mapa[y][x];
      let clase = "suelo", dentro = "";
      if (c === " ") clase = "vacio";
      else if (c === "W") { clase = "agua"; dentro = ICONOS.W; }
      else if (c === "X") dentro = ICONOS.X;
      else if (c === "B") dentro = ICONOS.B;
      else if (c === "S") dentro = ICONOS.S;
      else if (c === "G") dentro = metaSVG(nivel.bandera);
      h += `<div class="celda ${clase}" data-xy="${x},${y}">${dentro}</div>`;
    }
    const pa = personajeActual();
    h += `<div class="sprite" id="sprite"><div class="cuerpo"><div class="vista-frente">${avatar(pa)}</div><div class="vista-espalda">${espaldaSVG(pa.espalda)}</div></div><div class="flecha">${FLECHA}</div></div>`;
    t.innerHTML = h;
  }

  function reiniciarPersonaje() {
    let sx = 0, sy = 0;
    nivel.mapa.forEach((fila, y) => { const x = fila.indexOf("P"); if (x >= 0) { sx = x; sy = y; } });
    const total = nivel.mapa.join("").split("S").length - 1;
    pj = { x: sx, y: sy, dir: nivel.dir, sellos: new Set(), total };
    document.querySelectorAll(".celda.recogido").forEach((c) => c.classList.remove("recogido"));
    const s = $("#sprite");
    s.className = "sprite";
    s.style.transition = "none";
    colocar();
    void s.offsetWidth;
    s.style.transition = "";
    actualizarContador();
  }

  function colocar() {
    const s = $("#sprite");
    const filas = nivel.mapa.length, cols = nivel.mapa[0].length;
    // Posición en porcentaje (los huecos del grid son pequeños, se compensan con calc)
    s.style.width = `calc((100% - ${(cols - 1) * 4}px) / ${cols})`;
    s.style.height = `calc((100% - ${(filas - 1) * 4}px) / ${filas})`;
    s.style.left = `calc(${pj.x} * ((100% - ${(cols - 1) * 4}px) / ${cols} + 4px))`;
    s.style.top = `calc(${pj.y} * ((100% - ${(filas - 1) * 4}px) / ${filas} + 4px))`;
    s.classList.toggle("derecha", pj.dir === 0);
    s.classList.toggle("izquierda", pj.dir === 2);
    s.classList.toggle("arriba", pj.dir === 3);
    s.querySelector(".flecha").style.transform = `rotate(${pj.dir * 90}deg)`;
  }

  function actualizarContador() {
    $("#contador-sellos").textContent = pj.total ? `Sellos ${pj.sellos.size} / ${pj.total}` : "Sin sellos en esta ciudad";
  }

  function aviso(txt, tipo) {
    const a = $("#aviso");
    if (!txt) { a.hidden = true; return; }
    a.hidden = false; a.className = "aviso " + (tipo || "mal"); a.textContent = txt;
  }

  /* ---------- Editor de programa ---------- */
  function buscar(id, lista = programa) {
    for (const b of lista) {
      if (b.id === id) return b;
      if (b.cuerpo) { const r = buscar(id, b.cuerpo); if (r) return r; }
    }
    return null;
  }
  function quitar(id, lista = programa) {
    const i = lista.findIndex((b) => b.id === id);
    if (i >= 0) { lista.splice(i, 1); return true; }
    return lista.some((b) => b.cuerpo && quitar(id, b.cuerpo));
  }
  const contar = (lista) => lista.reduce((n, b) => n + 1 + (b.cuerpo ? contar(b.cuerpo) : 0) + (b.sino ? contar(b.sino) : 0), 0);
  const PUZLE = !!window.EditorBloques;

  function añadir(t) {
    if (corriendo) return;
    const b = { id: ++uid, t };
    if (t === "repetir") b.n = 3;
    if (t === "si") b.cond = "camino";
    if (CONTENEDORES.includes(t)) b.cuerpo = [];
    const destino = objetivoId ? buscar(objetivoId) : null;
    (destino ? destino.cuerpo : programa).push(b);
    if (b.cuerpo) objetivoId = b.id;  // lo siguiente va dentro del nuevo bloque
    aviso(null);
    pintarPrograma();
  }

  function pintarLista(lista, dentro) {
    if (!lista.length) return `<li class="vacio-txt">${dentro ? "Vacío. Toca “Añadir aquí” y elige bloques." : "Toca un bloque de arriba para empezar tu programa."}</li>`;
    return lista.map((b) => {
      if (b.cuerpo) {
        let cab;
        if (b.t === "repetir") {
          const opts = [2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}" ${n === b.n ? "selected" : ""}>${n}</option>`).join("");
          cab = `<span>⟳ Repetir</span><select aria-label="Veces" data-n="${b.id}">${opts}</select><span>veces</span>`;
        } else if (b.t === "si") {
          const opts = Object.keys(CONDICIONES).map((k) => `<option value="${k}" ${k === b.cond ? "selected" : ""}>${CONDICIONES[k]}</option>`).join("");
          cab = `<span>? Si</span><select aria-label="Condición" data-cond="${b.id}">${opts}</select>`;
        } else cab = `<span>⚑ Repetir hasta llegar a la bandera</span>`;
        return `<li class="bloque-rep c-${b.t} ${objetivoId === b.id ? "objetivo-sel" : ""}" data-id="${b.id}">
          <div class="cab">${cab}
          <button class="elegir" data-elegir="${b.id}">${objetivoId === b.id ? "Añadiendo aquí" : "Añadir aquí"}</button>
          <button class="quitar" data-quitar="${b.id}" aria-label="Quitar bloque">×</button></div>
          <ol>${pintarLista(b.cuerpo, true)}</ol></li>`;
      }
      return `<li class="bloque t-${b.t}" data-id="${b.id}"><span>${SIMBOLOS[b.t]} ${NOMBRES[b.t]}</span><button class="quitar" data-quitar="${b.id}" aria-label="Quitar bloque">×</button></li>`;
    }).join("");
  }

  function cuentaPuzle() {
    const n = contar(window.EditorBloques.leer());
    $("#cuenta-puzle").textContent = `${n} bloque${n === 1 ? "" : "s"} · reto: ${nivel.reto}`;
  }

  function pintarPrograma() {
    const ol = $("#programa");
    ol.innerHTML = pintarLista(programa, false);
    ol.classList.toggle("destino-activo", !objetivoId);
    const n = contar(programa);
    $("#cuenta-bloques").textContent = `${n} bloque${n === 1 ? "" : "s"} · reto: ${nivel.reto}`;
    const r = objetivoId && buscar(objetivoId);
    $("#donde").innerHTML = r
      ? `Añadiendo dentro de <b>${r.t === "si" ? "Si" : "Repetir"}</b>. <button class="btn sec" id="btn-salir-rep" style="padding:4px 12px;font-size:13px;box-shadow:none">Volver al programa principal</button>`
      : nivel.bloques.some((t) => CONTENEDORES.includes(t)) ? "Añadiendo en el programa principal." : "";
    const salir = $("#btn-salir-rep");
    if (salir) salir.onclick = () => { objetivoId = null; pintarPrograma(); };
    ol.querySelectorAll("[data-quitar]").forEach((b) => b.onclick = (e) => {
      e.stopPropagation(); if (corriendo) return;
      const id = +b.dataset.quitar;
      if (objetivoId && (objetivoId === id || (buscar(id).cuerpo && buscar(objetivoId, buscar(id).cuerpo)))) objetivoId = null;
      quitar(id); pintarPrograma();
    });
    ol.querySelectorAll("[data-elegir]").forEach((b) => b.onclick = () => {
      const id = +b.dataset.elegir; objetivoId = objetivoId === id ? null : id; pintarPrograma();
    });
    ol.querySelectorAll("select[data-n]").forEach((s) => s.onchange = () => { buscar(+s.dataset.n).n = +s.value; });
    ol.querySelectorAll("select[data-cond]").forEach((s) => s.onchange = () => { buscar(+s.dataset.cond).cond = s.value; });
  }

  /* ---------- Ejecución ---------- */
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  function cancelar() { ejecucion++; corriendo = false; botones(); }
  function botones() {
    $("#btn-ejecutar").disabled = corriendo;
    $("#btn-borrar").disabled = corriendo;
  }
  function marcar(id) {
    if (PUZLE) { window.EditorBloques.resaltar(id); return; }
    document.querySelectorAll(".programa .activo").forEach((e) => e.classList.remove("activo"));
    if (id) { const el = document.querySelector(`.programa [data-id="${id}"]`); if (el) el.classList.add("activo"); }
  }
  function delante(giro) {
    const d = DIRS[(pj.dir + giro + 4) % 4];
    return celda(pj.x + d[0], pj.y + d[1]);
  }
  function cumple(cond) {
    if (cond === "salto") { const c = delante(0); return c === "B" || c === "W"; }
    if (cond === "camino") return pisable(delante(0));
    if (cond === "izq") return pisable(delante(-1));
    if (cond === "der") return pisable(delante(1));
    return false;
  }

  // Señales para terminar la ejecución
  class Fin { constructor(tipo, txt) { this.tipo = tipo; this.txt = txt; } }
  const LIMITE = 600;

  async function correr(lista, ctx) {
    for (const b of lista) {
      if (ctx.token !== ejecucion) throw new Fin("cancelado");
      if (++ctx.pasos > LIMITE) throw new Fin("fallo", "El programa no termina nunca. Revisa los bloques Repetir hasta llegar.");
      if (b.t === "repetir") { for (let i = 0; i < b.n; i++) await correr(b.cuerpo, ctx); continue; }
      if (b.t === "hasta") {
        marcar(b.id);
        while (true) {
          const antes = ctx.pasos;
          await correr(b.cuerpo, ctx);
          if (ctx.pasos === antes || !b.cuerpo.length) throw new Fin("fallo", "El bloque Repetir hasta llegar está vacío. Mete bloques dentro.");
          if (++ctx.pasos > LIMITE) throw new Fin("fallo", "El programa no termina nunca. Revisa los bloques de dentro.");
        }
      }
      if (b.t === "si") {
        marcar(b.id);
        await esperar(ctx.vel / 3);
        if (cumple(b.cond)) await correr(b.cuerpo, ctx);
        else if (b.sino) await correr(b.sino, ctx);
        continue;
      }
      await accion(b, ctx);
    }
  }

  async function accion(paso, ctx) {
    const s = $("#sprite");
    marcar(paso.id);
    s.classList.remove("saltando", "choque");
    const [dx, dy] = DIRS[pj.dir];
    if (paso.t === "izq") pj.dir = (pj.dir + 3) % 4;
    else if (paso.t === "der") pj.dir = (pj.dir + 1) % 4;
    else if (paso.t === "avanzar") {
      const c = celda(pj.x + dx, pj.y + dy);
      if (!pisable(c)) {
        throw new Fin("fallo", c === "X" ? "¡Un árbol en medio! Busca otro camino." :
          c === "W" ? "¡Al agua! Los canales hay que saltarlos." :
          c === "B" ? "Hay una maleta en medio. Prueba a saltar." : "¡Te sales del camino!");
      }
      pj.x += dx; pj.y += dy;
    } else if (paso.t === "saltar") {
      const medio = celda(pj.x + dx, pj.y + dy), dest = celda(pj.x + 2 * dx, pj.y + 2 * dy);
      if (medio === "X") throw new Fin("fallo", "Ese árbol es demasiado alto para saltarlo.");
      if (medio === null || medio === " ") throw new Fin("fallo", "¡Te sales del camino!");
      if (!pisable(dest)) throw new Fin("fallo", "No hay sitio donde caer después del salto.");
      void s.offsetWidth; s.classList.add("saltando");
      pj.x += 2 * dx; pj.y += 2 * dy;
    }
    colocar();
    await esperar(ctx.vel);
    if (ctx.token !== ejecucion) throw new Fin("cancelado");
    const c = celda(pj.x, pj.y);
    if (c === "S" && !pj.sellos.has(pj.x + "," + pj.y)) {
      pj.sellos.add(pj.x + "," + pj.y);
      document.querySelector(`.celda[data-xy="${pj.x},${pj.y}"]`).classList.add("recogido");
      actualizarContador();
    }
    if (c === "G" && pj.sellos.size === pj.total) throw new Fin("victoria");
  }

  async function ejecutar() {
    if (corriendo) return;
    if (PUZLE) programa = window.EditorBloques.leer();
    if (!programa.length) { aviso(PUZLE ? "Tu programa está vacío. Arrastra bloques y engánchalos debajo de “Al empezar”." : "Tu programa está vacío. Añade algún bloque.", "info"); return; }
    intentos++;
    reiniciarPersonaje(); aviso(null);
    const ctx = { token: ++ejecucion, pasos: 0, vel: +$("#sel-velocidad").value };
    corriendo = true; botones();
    await esperar(150);
    try {
      await correr(programa, ctx);
    } catch (e) {
      if (!(e instanceof Fin)) throw e;
      if (e.tipo === "cancelado") return;
      if (e.tipo === "victoria") return victoria();
      valorar(false);
      return fallo(e.txt);
    }
    marcar(null); corriendo = false; botones();
    const c = celda(pj.x, pj.y);
    valorar(false, c === "G");
    if (c === "G") aviso(`Has llegado, pero te faltan ${pj.total - pj.sellos.size} sello(s) del pasaporte.`);
    else aviso("Todavía no has llegado a la bandera. Añade más bloques o cambia alguno.", "info");
  }

  function fallo(txt) {
    marcar(null);
    const s = $("#sprite");
    void s.offsetWidth; s.classList.add("choque");
    corriendo = false; botones();
    aviso(txt);
  }

  function victoria() {
    marcar(null); corriendo = false; botones();
    $("#sprite").classList.add("fiesta");
    const n = contar(programa);
    const est = n <= nivel.reto ? 3 : n <= nivel.reto + 2 ? 2 : 1;
    progreso.estrellas[nivelI] = Math.max(progreso.estrellas[nivelI] || 0, est);
    guardar();
    const val = valorar(true);
    enviarResultado(n, est, val);
    const av = AVENTURAS[nivel.aventura];
    const ultimo = nivel.pos === av.niveles.length - 1;
    const todos = NIVELES.every((n, i) => n.aventura !== nivel.aventura || progreso.estrellas[i]);
    const nuevo = PERSONAJES.find((p) => (p.desbloquea || 0) === completados() && p.desbloquea);
    const p = personajeActual();
    let html = `<div class="sello-grande">${SELLO_HECHO(nivel.ciudad.toUpperCase().slice(0, 9))}</div>
      <h2>¡${nivel.ciudad} conseguido!</h2>
      <div class="grandes" aria-label="${est} de 3 estrellas"><b>${"★".repeat(est)}</b>${"★".repeat(3 - est)}</div>
      <p>${est === 3 ? `Programa perfecto: ${n} bloques.` : `Lo has hecho con ${n} bloques. ¿Puedes conseguirlo con ${nivel.reto}?`}</p>
      ${val && val.codigo ? `<p class="val-ind">Indicador ${val.codigo}: <b>${val.nota} de 5</b></p>` : ""}`;
    if (nuevo) html += `<p><strong>¡Nuevo personaje desbloqueado: ${nuevo.nombre}!</strong></p>`;
    if (ultimo && todos) html += `<div class="diploma">${COLEGIO.logo ? `<img src="${COLEGIO.logo}" alt="Escudo" style="height:90px;width:auto;display:block;margin:0 auto 6px">` : ""}<span class="etiqueta">Diploma</span><strong>${progreso.alumno.nombre || p.nombre}: ${av.nombre} completada</strong><p style="margin:4px 0 0">Has recorrido ${av.niveles.length} destinos programando con ${p.nombre}. ${COLEGIO.nombre} · ${COLEGIO.lema}</p></div>`;
    if (ultimo && todos && window.XLSX) html += `<p><button class="btn sec" id="v-excel">Descargar mi valoración (Excel)</button></p>`;
    html += `<div class="acciones"><button class="btn sec" id="v-repetir">Repetir nivel</button>${ultimo ? `<button class="btn" id="v-pasaporte">${nivel.aventura < AVENTURAS.length - 1 ? "Elegir otra aventura" : "Ver pasaporte"}</button>` : `<button class="btn" id="v-siguiente">Siguiente: ${NIVELES[nivelI + 1].ciudad}</button>`}</div>`;
    $("#ventana").innerHTML = html;
    $("#velo").hidden = false;
    const cerrar = () => { $("#velo").hidden = true; };
    $("#v-repetir").onclick = () => { cerrar(); reiniciarPersonaje(); };
    const vx = $("#v-excel"); if (vx) vx.onclick = descargarExcel;
    const sig = $("#v-siguiente"); if (sig) sig.onclick = () => { cerrar(); irANivel(nivelI + 1); };
    const pas = $("#v-pasaporte"); if (pas) pas.onclick = () => { cerrar(); location.hash = "programa"; };
    $("#v-repetir").focus();
  }

  /* ---------- Indicadores y valoración ---------- */
  function indicadorNivel(n) { return window.Valoraciones ? window.Valoraciones.indicador("prog", n.ciudad) : null; }
  function valorar(completado, parcialExtra) {
    if (!window.Valoraciones) return null;
    const ind = indicadorNivel(nivel) || {};
    const n = contar(programa);
    const nota = window.Valoraciones.nota({ completado, parcial: pj.sellos.size > 0 || !!parcialExtra, intentos, bloques: n, reto: nivel.reto });
    const r = window.Valoraciones.registrar("prog-" + nivelI, { nota, intentos, bloques: n, codigo: ind.codigo || "", pantalla: "Programación", actividad: `${AVENTURAS[nivel.aventura].nombre} · ${nivel.ciudad}` });
    return Object.assign({}, r, { codigo: ind.codigo, nota: Math.max(nota, r.nota) });
  }
  function descargarExcel() {
    if (!window.Valoraciones || !window.Valoraciones.excel()) aviso("No se ha podido crear el Excel en este navegador.");
  }
  function pintarIndicador() {
    const ind = indicadorNivel(nivel), el = $("#texto-indicador");
    if (!el) return;
    el.hidden = !ind;
    if (ind) el.innerHTML = `<b>Indicador ${ind.codigo}</b> ${ind.texto}`;
  }

  /* ---------- Registro de resultados ---------- */
  function textoPrograma(lista) {
    return lista.map((b) => b.t === "repetir" ? `Repetir ${b.n} [${textoPrograma(b.cuerpo)}]` : b.t === "si" ? `Si ${CONDICIONES[b.cond]} [${textoPrograma(b.cuerpo)}]${b.sino ? ` si no [${textoPrograma(b.sino)}]` : ""}` : b.t === "hasta" ? `Repetir hasta llegar [${textoPrograma(b.cuerpo)}]` : NOMBRES[b.t]).join(", ");
  }
  function enviarResultado(bloques, estrellas, val) {
    if (!REGISTRO.url) return;
    const datos = {
      fecha: new Date().toISOString(),
      nombre: progreso.alumno.nombre,
      usuario: progreso.alumno.usuario || "",
      clase: progreso.alumno.clase,
      destino: `Programación · ${nivelI + 1}. ${nivel.ciudad}`,
      ciudad: nivel.ciudad,
      estrellas, bloques, intentos,
      personaje: personajeActual().nombre,
      programa: textoPrograma(programa),
      indicador: val ? val.codigo || "" : "",
      valoracion: val ? val.nota : ""
    };
    try {
      fetch(REGISTRO.url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(datos) }).catch(() => {});
    } catch (e) { /* sin conexión: el juego sigue */ }
  }

  /* ---------- Alumno ---------- */
  function iniciarAlumno() {
    const n = $("#in-nombre"), c = $("#in-clase"), u = $("#in-usuario"), ok = $("#alumno-ok");
    n.value = progreso.alumno.nombre || ""; c.value = progreso.alumno.clase || ""; u.value = progreso.alumno.usuario || "";
    const pintarOk = () => {
      ok.hidden = !progreso.alumno.nombre;
      ok.textContent = `✓ Hola, ${progreso.alumno.nombre}`;
    };
    const cambiar = () => {
      progreso.alumno = { nombre: n.value.trim(), clase: c.value.trim(), usuario: u.value.trim() };
      if (progreso.alumno.nombre) n.classList.remove("falta");
      guardar(); pintarOk();
      window.dispatchEvent(new CustomEvent("alumno-cambiado-prog"));
    };
    window.addEventListener("alumno-cambiado", (e) => {
      progreso.alumno = Object.assign({}, e.detail); n.value = progreso.alumno.nombre; c.value = progreso.alumno.clase; u.value = progreso.alumno.usuario || ""; pintarOk(); pintarInicio();
    });
    n.addEventListener("input", cambiar); c.addEventListener("input", cambiar); u.addEventListener("input", cambiar);
    c.addEventListener("input", () => pintarInicio());
    $("#form-alumno").addEventListener("submit", (e) => e.preventDefault());
    pintarOk();
  }

  /* ---------- Navegación ---------- */
  function mostrarInicio() {
    cancelar();
    $("#juego").hidden = true; $("#inicio").hidden = false;
    pintarInicio();
  }
  function enrutar() {
    const h = location.hash;
    const sec = /^#robotica/.test(h) ? "robotica" : /^#(destino-\d+|programa)$/.test(h) ? "programa" : /^#crea/.test(h) ? "crea" : /^#piensa/.test(h) ? "piensa" : h === "#profe" ? "profe" : h === "#familias" ? "familias" : "inicio";
    document.body.dataset.seccion = sec;
    const rob = sec === "robotica";
    document.body.classList.toggle("en-robotica", rob);
    if (window.Rincones && window.Rincones.ruta(h)) {
      cancelar();
      $("#inicio").hidden = true; $("#juego").hidden = true;
      if (window.Robotica) window.Robotica.ocultar();
      return;
    }
    if (rob) {
      cancelar();
      $("#inicio").hidden = true; $("#juego").hidden = true;
      if (window.Robotica) window.Robotica.ruta(location.hash);
      return;
    }
    if (window.Robotica) window.Robotica.ocultar();
    const m = /^#destino-(\d+)$/.exec(location.hash);
    const i = m ? +m[1] - 1 : -1;
    if (i >= 0 && i < NIVELES.length && desbloqueadoNivel(i) && progreso.alumno.nombre) abrirNivel(i);
    else mostrarInicio();
  }

  $("#btn-empezar").onclick = () => {
    let i = NIVELES.findIndex((_, k) => !progreso.estrellas[k] && desbloqueadoNivel(k));
    irANivel(i < 0 ? 0 : i);
  };
  $("#btn-volver").onclick = () => { location.hash = "programa"; };
  $("#btn-ejecutar").onclick = ejecutar;
  $("#btn-reiniciar").onclick = () => { cancelar(); marcar(null); reiniciarPersonaje(); aviso(null); };
  $("#btn-borrar").onclick = () => { if (PUZLE) { window.EditorBloques.borrar(); cuentaPuzle(); } programa = []; objetivoId = null; reiniciarPersonaje(); pintarPrograma(); aviso(null); };
  $("#velo").addEventListener("click", (e) => { if (e.target.id === "velo") $("#velo").hidden = true; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#velo").hidden = true; });
  window.addEventListener("hashchange", enrutar);

  window.PiniEspalda = espaldaSVG;
  window.PROG_NIVELES = NIVELES;
  if (window.Valoraciones) window.Valoraciones.definirActividades("prog", NIVELES.map((n, i) => ({ clave: "prog-" + i, pantalla: "Programación", actividad: `${AVENTURAS[n.aventura].nombre} · ${n.ciudad}`, destino: `Programación · ${i + 1}. ${n.ciudad}`, ciudad: n.ciudad, tipo: "prog", ref: n.ciudad })));
  const bx = $("#btn-excel"); if (bx) bx.onclick = descargarExcel;
  pintarMarca();
  iniciarAlumno();
  enrutar();
})();
