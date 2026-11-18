/*
  PINICRAFT (5.º · Programa · 2.º trimestre)
  ------------------------------------------
  Pantalla de juego de las aventuras de js/pinicraft-niveles.js con el motor de js/pinicraft-motor.js.
  - En #programa añade, debajo de las aventuras de los países, el apartado «2.º trimestre»:
      5.º → PiniCraft Aventurero y PiniCraft: El viaje del héroe (10 pantallas cada una).
      6.º → los retos de Scratch (js/scratch-retos.js pinta su parte en el mismo apartado).
  - Rutas: #programa-pinicraft-<aventura>-<pantalla>  (p. ej. #programa-pinicraft-1-3).
  - Cada pantalla superada envía una fila a la hoja (Resultados) con su indicador, como las de los países:
      Actividad «Programación · PiniCraft Aventurero 3. Kinderdijk», Programa = los bloques usados.
  - El avance se guarda en este ordenador y se recupera de la hoja (alumnoResultados) al entrar con contraseña.
  - El viaje del héroe se abre al superar las 10 pantallas de Aventurero y hacer su autoevaluación (window.Autoeval).
  Los dibujos, los niveles y la historia son propios del cole: no se copia ningún juego comercial.
*/
(function () {
  "use strict";
  const AVS = window.PINICRAFT || [];
  const M = window.PiniCraftMotor;
  if (!AVS.length || !M) return;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const V = () => window.Valoraciones;
  const HASH = /^#programa-pinicraft-(\d+)-(\d+)$/;
  const LOCAL = "rumbo-pinicraft-v1";
  // Si se pone a true, PiniCraft solo se abre cuando el alumno ha terminado las 30 pantallas de los países.
  const ABRIR_TRAS_PAISES = false;

  /* ---------- Alumno, curso y avance ---------- */
  const alumno = () => (V() ? V().alumno() : { nombre: "", usuario: "", clase: "" });
  const curso = () => (V() ? V().curso() : "5º");
  const esQuinto = () => curso() === "5º" && !window.ADAPTADO;
  const quien = () => { const a = alumno(); return (a.usuario || a.nombre || "anonimo").toLowerCase(); };
  function leerLocal() { try { return JSON.parse(localStorage.getItem(LOCAL) || "{}") || {}; } catch (e) { return {}; } }
  function avance() { return leerLocal()[quien()] || {}; }
  function apuntar(clave, est) {
    const o = leerLocal(), u = quien();
    o[u] = o[u] || {};
    o[u][clave] = Math.max(o[u][clave] || 0, est);
    try { localStorage.setItem(LOCAL, JSON.stringify(o)); } catch (e) {}
  }
  const clave = (ai, i) => `${AVS[ai].id}-${i}`;
  const hoja = {};   // claves superadas según la hoja (sesión actual)
  const hecho = (ai, i) => !!avance()[clave(ai, i)] || !!hoja[clave(ai, i)];
  const todasHechas = (ai) => AVS[ai].niveles.every((_, i) => hecho(ai, i));
  function paisesHechos() {
    const N = window.PROG_NIVELES || [], RC = window.RetosCadena;
    let g = {}; try { g = (JSON.parse(localStorage.getItem("rumbo-a-europa-v1") || "{}") || {}).estrellas || {}; } catch (e) {}
    return N.length > 0 && N.every((_, i) => g[i] || (RC && RC.hecho && RC.hecho("programa", i)));
  }
  const aventuraAbierta = (ai) => ai === 0 ? (!ABRIR_TRAS_PAISES || paisesHechos()) : todasHechas(ai - 1);
  const abierta = (ai, i) => aventuraAbierta(ai) && (i === 0 || hecho(ai, i) || hecho(ai, i - 1));
  const destino = (ai, i) => `Programación · ${AVS[ai].nombre.replace(/^PiniCraft: /, "")} ${i + 1}. ${AVS[ai].niveles[i].lugar}`.slice(0, 60);
  const actividad = (ai, i) => `${AVS[ai].nombre} · ${AVS[ai].niveles[i].lugar}`;
  const indicadorDe = (ai) => (((window.INDICADOR_PINICRAFT || {})["5º"] || {})[AVS[ai].id]) || AVS[ai].indicador;
  const etapa = (ai) => ({ etapa: "prog-" + AVS[ai].id, titulo: `Programa · ${AVS[ai].nombre}`, rincon: `Programa · ${AVS[ai].nombre}`.slice(0, 40), codigos: [indicadorDe(ai)] });

  // Actividades para «Mis notas», el Excel del alumno y las insignias (una por aventura).
  if (V() && V().añadirActividades) V().añadirActividades("prog", () => esQuinto() ? [].concat(...AVS.map((av, ai) => av.niveles.map((n, i) => ({
    clave: clave(ai, i), pantalla: "Programación", actividad: actividad(ai, i), destino: destino(ai, i), ciudad: n.lugar, tipo: "fijo", ref: indicadorDe(ai)
  })))) : []);
  // Para el panel del profe (js/profe.js, catalogo): las 20 pantallas como actividades de Programa de 5.º.
  const extraAnterior = window.PROG_EXTRA;
  window.PROG_EXTRA = function (c, a) {
    const L = extraAnterior ? extraAnterior(c, a) || [] : [];
    if (c !== "5º" || (a && a.adaptado === true)) return L;
    AVS.forEach((av, ai) => av.niveles.forEach((n, i) => L.push({ rincon: "prog", titulo: `${av.nombre.replace(/^PiniCraft: /, "")} ${i + 1}. ${n.lugar}`, destino: destino(ai, i), ciudad: n.lugar, inds: [indicadorDe(ai)], grupo: av.id, nombreGrupo: av.nombre })));
    return L;
  };

  /* ---------- Avance guardado en la hoja ---------- */
  let ultimaHoja = 0, pidiendo = null;
  async function recuperarHoja(forzar) {
    const R = window.REGISTRO || {}, s = window.Acceso && window.Acceso.sesion ? window.Acceso.sesion() : null;
    if (!R.url || !s || !s.token || !window.Profe || !window.Profe.notasDe) return;
    if (!forzar && Date.now() - ultimaHoja < 30000) return;
    if (pidiendo) return pidiendo;
    ultimaHoja = Date.now();
    pidiendo = (async () => {
      try {
        const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ accion: "alumnoResultados", usuario: s.usuario, token: s.token }) });
        const j = JSON.parse(await r.text());
        if (!j || !j.ok) return;
        const notas = window.Profe.notasDe(j.cab || [], j.fila || [], curso());
        AVS.forEach((av, ai) => av.niveles.forEach((n, i) => {
          const col = destino(ai, i) + " · Ind. " + indicadorDe(ai);
          if (Number.isFinite(notas[col]) && notas[col] >= 3) {
            hoja[clave(ai, i)] = true;
            if (V()) V().registrar(clave(ai, i), { nota: notas[col], codigo: indicadorDe(ai), pantalla: "Programación", actividad: actividad(ai, i) }, true);
          }
        }));
        window.dispatchEvent(new Event("pinicraft-avance"));
      } catch (e) { /* sin conexión: vale lo de este ordenador */ }
    })().finally(() => { pidiendo = null; });
    return pidiendo;
  }

  /* ---------- Dibujos: suelos y casillas ---------- */
  const SUELOS = {
    hierba: { base: "#7cc04f", p: ["#6aae3f", "#8fd05e"] },
    prado: { base: "#86c75a", p: ["#74b54a", "#9ad66b"] },
    nieve: { base: "#eef4fb", p: ["#dde8f4", "#ffffff"] },
    roca: { base: "#6c6a70", p: ["#5d5b62", "#7a7880"] },
    arena: { base: "#e6cf98", p: ["#d8bf85", "#f0dcab"] },
    adoquin: { base: "#cfc6b6", p: ["#bdb3a1", "#ddd5c7"] }
  };
  function pixeles(cols, semilla) {
    // Cuadraditos de color fijos (pseudoaleatorios) para que el suelo parezca de bloques.
    let s = semilla * 9301 + 49297, out = "";
    for (let k = 0; k < 7; k++) {
      s = (s * 9301 + 49297) % 233280; const x = Math.floor(s / 233280 * 8) * 5;
      s = (s * 9301 + 49297) % 233280; const y = Math.floor(s / 233280 * 8) * 5;
      out += `<rect x="${x}" y="${y}" width="5" height="5" fill="${cols[k % cols.length]}"/>`;
    }
    return out;
  }
  function suelo(tipo, xy) {
    const S = SUELOS[tipo] || SUELOS.hierba;
    let h = `<rect width="40" height="40" fill="${S.base}"/>${pixeles(S.p, xy)}`;
    if (tipo === "adoquin") h += `<path d="M0 13H40M0 27H40M13 0V13M30 13V27M8 27V40M26 27V40" stroke="#b3a893" stroke-width="1.2"/>`;
    return h;
  }
  const PINA = `<g transform="translate(20 21)"><ellipse rx="8" ry="11" fill="#8a5426" stroke="#3d2410" stroke-width="1.5"/><path d="M-7-4H7M-8 2H8M-6 8H6M-4-9V9M4-9V9" stroke="#3d2410" stroke-width="1.2"/><path d="M-3-12L0-17L3-12Z" fill="#4c8a2f"/></g>`;
  const ESTRELLA = (op) => `<g transform="translate(20 20)" opacity="${op || 1}"><circle r="15" fill="#ffe680" opacity=".45"/><path d="M0-13L3.8-4.2L13-4L5.8 2.2L8 11.5L0 6.3L-8 11.5L-5.8 2.2L-13-4L-3.8-4.2Z" fill="#ffcc00" stroke="#b58900" stroke-width="1.5" stroke-linejoin="round"/></g>`;
  function casilla(c, tipo, xy) {
    const fondo = suelo(tipo, xy);
    switch (c) {
      case "T": return fondo + (tipo === "nieve"
        ? `<rect x="5" y="5" width="30" height="30" rx="4" fill="#2f6b3c"/><rect x="9" y="9" width="22" height="22" rx="3" fill="#3f8a4d"/><rect x="8" y="6" width="10" height="5" fill="#fff"/><rect x="22" y="22" width="9" height="5" fill="#fff"/><rect x="18" y="16" width="5" height="5" fill="#fff"/>`
        : `<rect x="5" y="5" width="30" height="30" rx="4" fill="#2f6b2a"/><rect x="9" y="9" width="22" height="22" rx="3" fill="#3f8f35"/><rect x="14" y="14" width="12" height="12" rx="2" fill="#57ad45"/><rect x="11" y="11" width="5" height="5" fill="#2f6b2a"/>`);
      case "R": return fondo + `<rect x="4" y="4" width="32" height="32" rx="3" fill="#8d8c93"/><rect x="4" y="4" width="32" height="8" fill="#a9a8af"/><rect x="4" y="30" width="32" height="6" fill="#6d6c73"/><rect x="10" y="16" width="6" height="6" fill="#77767d"/><rect x="24" y="20" width="6" height="5" fill="#77767d"/>`;
      case "A": return `<rect width="40" height="40" fill="#3d8fd6"/><rect x="4" y="8" width="10" height="3" fill="#7ab9ee"/><rect x="22" y="18" width="12" height="3" fill="#7ab9ee"/><rect x="8" y="29" width="9" height="3" fill="#7ab9ee"/>`;
      case "L": return `<rect width="40" height="40" fill="#e2541b"/><rect x="5" y="6" width="9" height="5" fill="#ffb21f"/><rect x="22" y="15" width="11" height="5" fill="#ffd34d"/><rect x="9" y="26" width="10" height="5" fill="#ff8c1a"/><rect x="27" y="31" width="7" height="4" fill="#ffb21f"/>`;
      case "C": return fondo + `<rect x="5" y="5" width="30" height="30" fill="none" stroke="#7b4a1e" stroke-width="2.5" stroke-dasharray="5 3"/><text x="20" y="25" text-anchor="middle" font-size="12" font-weight="800" fill="#7b4a1e">+</text>`;
      case "M": return fondo + `<rect x="2" y="2" width="36" height="36" fill="#b5462d"/><path d="M2 11H38M2 20H38M2 29H38M12 2V11M28 2V11M20 11V20M8 20V29M30 20V29M16 29V38" stroke="#e2d3c0" stroke-width="2"/>`;
      case "=": return `<rect width="40" height="40" fill="#3d8fd6"/><rect x="2" y="2" width="36" height="36" fill="#a8743f"/><path d="M2 11H38M2 20H38M2 29H38" stroke="#6e4620" stroke-width="2"/><rect x="2" y="2" width="36" height="36" fill="none" stroke="#6e4620" stroke-width="2"/>`;
      case "K": return `<rect width="40" height="40" fill="#e2541b"/><rect x="2" y="2" width="36" height="36" fill="#3b3940"/><path d="M8 10L16 18L12 28M26 6L24 18L32 26" stroke="#ff8c1a" stroke-width="1.6" fill="none"/>`;
      case "X": return fondo + (tipo === "adoquin" || tipo === "arena"
        ? `<rect x="2" y="2" width="36" height="36" fill="#8e2f22"/><rect x="2" y="2" width="36" height="17" fill="#c0392b"/><rect x="2" y="21" width="36" height="17" fill="#a93226"/><path d="M2 8H38M2 14H38M2 27H38M2 33H38" stroke="#7b241c" stroke-width="1.2"/><rect x="2" y="18.5" width="36" height="3" fill="#5e1b13"/><rect x="27" y="5" width="6" height="7" fill="#6d6d6d"/>`
        : `<rect x="3" y="3" width="34" height="34" rx="6" fill="#2c5e25"/><rect x="7" y="7" width="8" height="8" fill="#3b7a31"/><rect x="22" y="12" width="9" height="9" fill="#3b7a31"/><rect x="11" y="24" width="10" height="8" fill="#3b7a31"/>`);
      case "N": return fondo + PINA;
      case "E": return fondo + ESTRELLA();
      case "Q": return fondo + `<rect x="7" y="7" width="26" height="26" rx="3" fill="#b9b9c1" stroke="#7d7d86" stroke-width="2"/><rect x="11" y="11" width="18" height="18" rx="2" fill="#d6d6dc"/><text x="20" y="25" text-anchor="middle" font-size="11" fill="#7d7d86">⚡</text>`;
      case "F": return fondo + `<circle cx="10" cy="11" r="3.4" fill="#e53935"/><circle cx="27" cy="9" r="3.4" fill="#fdd835"/><circle cx="18" cy="22" r="3.4" fill="#e53935"/><circle cx="31" cy="27" r="3.4" fill="#ab47bc"/><circle cx="8" cy="31" r="3.4" fill="#fdd835"/>`;
      case "G": return fondo + `<circle cx="20" cy="20" r="15" fill="#14225a"/><circle cx="20" cy="20" r="11" fill="#3a63d8"/><circle cx="20" cy="20" r="6" fill="#9fc0ff"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<circle cx="${20 + 13 * Math.cos(k * Math.PI / 4)}" cy="${20 + 13 * Math.sin(k * Math.PI / 4)}" r="1.6" fill="#ffcc00"/>`).join("")}`;
      default: return fondo;
    }
  }

  /* ---------- Dibujos: fondos de Europa (paisajes y monumentos dibujados para el cole) ---------- */
  const cielo = (a, b) => `<defs><linearGradient id="pc-cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="170" fill="url(#pc-cielo)"/>`;
  const montes = (col, pts) => `<polygon points="0,170 ${pts} 800,170" fill="${col}"/>`;
  const pino = (x, y, s, col) => `<polygon points="${x},${y - 30 * s} ${x - 11 * s},${y} ${x + 11 * s},${y}" fill="${col}"/><polygon points="${x},${y - 42 * s} ${x - 8 * s},${y - 18 * s} ${x + 8 * s},${y - 18 * s}" fill="${col}"/><rect x="${x - 2 * s}" y="${y}" width="${4 * s}" height="${6 * s}" fill="#5b3a1e"/>`;
  const bosque = (y, col, n, s) => Array.from({ length: n }, (_, k) => pino(20 + k * (780 / n) + (k % 2) * 12, y + (k % 3) * 4, s, col)).join("");
  const suelo0 = (col) => `<rect y="150" width="800" height="20" fill="${col}"/>`;
  const sol = (x, y, c) => `<circle cx="${x}" cy="${y}" r="18" fill="${c || "#ffe27a"}"/>`;
  const nubes = `<g fill="#fff" opacity=".85"><ellipse cx="140" cy="38" rx="34" ry="11"/><ellipse cx="165" cy="31" rx="20" ry="10"/><ellipse cx="560" cy="30" rx="30" ry="9"/><ellipse cx="585" cy="25" rx="18" ry="9"/></g>`;
  const estrellasCielo = Array.from({ length: 26 }, (_, k) => `<circle cx="${(k * 131) % 800}" cy="${(k * 47) % 90 + 6}" r="${k % 3 ? 1.2 : 1.8}" fill="#fff"/>`).join("");
  const molino = (x, y) => `<g transform="translate(${x} ${y})"><polygon points="-12,0 12,0 7,-46 -7,-46" fill="#6d4c33"/><polygon points="-9,-46 9,-46 0,-58" fill="#3d2b1f"/><g transform="translate(0 -48)"><rect x="-2" y="-40" width="4" height="80" fill="#f1e7d0" transform="rotate(25)"/><rect x="-2" y="-40" width="4" height="80" fill="#f1e7d0" transform="rotate(115)"/></g><rect x="-4" y="-12" width="8" height="12" fill="#2b1d14"/></g>`;
  const FONDOS = {
    irati: () => cielo("#9fd3f5", "#e7f6ff") + sol(690, 40) + nubes + montes("#7aa86b", "0,110 120,70 260,100 380,60 520,95 650,58 800,92") + montes("#4f8a46", "0,140 150,110 300,130 450,105 600,128 800,112") + bosque(150, "#2f6b2a", 20, 1) + suelo0("#4f8a46"),
    selvanegra: () => cielo("#a7cfe8", "#eaf5ec") + nubes + montes("#3e6b45", "0,100 140,75 300,95 460,70 620,92 800,72") + bosque(140, "#1f4a2a", 24, 1.1) + `<g transform="translate(560 150)"><rect x="-40" y="-36" width="80" height="36" fill="#c99a64"/><polygon points="-50,-36 50,-36 0,-72" fill="#6b3b1f"/><circle cx="0" cy="-48" r="9" fill="#fff" stroke="#3a2412" stroke-width="2"/><path d="M0-48V-54M0-48H5" stroke="#3a2412" stroke-width="2"/><rect x="-28" y="-26" width="12" height="12" fill="#fff6dc"/><rect x="16" y="-26" width="12" height="12" fill="#fff6dc"/></g>` + suelo0("#2f5d36"),
    kinderdijk: () => cielo("#8fc8f0", "#fdf3d8") + sol(110, 42) + nubes + `<rect y="118" width="800" height="52" fill="#7fbf55"/><rect y="132" width="800" height="12" fill="#3d8fd6"/>` + molino(220, 118) + molino(420, 116) + molino(620, 118) + `<g>${Array.from({ length: 40 }, (_, k) => `<circle cx="${k * 20 + 6}" cy="${156 + (k % 2) * 6}" r="4" fill="${["#e53935", "#fdd835", "#ab47bc", "#fb8c00"][k % 4]}"/>`).join("")}</g>`,
    alpes: () => cielo("#7fb8ea", "#e9f3ff") + sol(120, 38) + montes("#9db1c8", "0,120 120,80 230,105 330,70 460,110 800,95") + `<polygon points="470,170 560,30 590,22 650,170" fill="#7d8796"/><polygon points="540,62 560,30 590,22 605,60 585,52 570,64 555,56" fill="#fff"/>` + montes("#e8f0f8", "0,150 200,130 400,148 600,135 800,150") + `<g transform="translate(250 148)"><rect x="-22" y="-22" width="44" height="22" fill="#a0652e"/><polygon points="-30,-22 30,-22 0,-44" fill="#fff"/><rect x="-6" y="-14" width="12" height="14" fill="#5b3a1e"/></g>`,
    fiordo: () => cielo("#9ccbe8", "#e6f2f6") + nubes + `<polygon points="0,170 0,40 120,60 230,120 260,170" fill="#4b5d4e"/><polygon points="800,170 800,50 680,70 560,125 520,170" fill="#56695a"/><rect x="230" y="135" width="320" height="35" fill="#2f78b8"/><polygon points="380,140 430,140 420,150 390,150" fill="#c0392b"/><rect x="402" y="120" width="3" height="20" fill="#333"/><polygon points="405,122 425,134 405,134" fill="#fff"/>` + bosque(70, "#2e4d33", 6, 0.6),
    toscana: () => cielo("#f5c27a", "#fdeccf") + sol(650, 48, "#fff1b8") + montes("#b7a35a", "0,120 180,95 360,118 540,92 800,118") + montes("#8fa64a", "0,150 200,128 400,146 600,124 800,145") + [90, 130, 300, 340, 700, 740].map((x) => `<ellipse cx="${x}" cy="125" rx="7" ry="26" fill="#2f4f2a"/>`).join("") + `<g transform="translate(520 150) rotate(5)"><rect x="-16" y="-96" width="32" height="96" fill="#f3ead7" stroke="#b9a988"/>${[-80, -62, -44, -26].map((y) => `<rect x="-16" y="${y}" width="32" height="3" fill="#b9a988"/>`).join("")}<rect x="-12" y="-104" width="24" height="8" fill="#f3ead7" stroke="#b9a988"/></g>`,
    highlands: () => cielo("#9fb6c9", "#e1e9ef") + nubes + montes("#7c6a8e", "0,95 160,60 320,98 470,62 640,96 800,70") + montes("#5d8a4f", "0,135 180,112 380,132 560,110 800,130") + `<rect y="138" width="800" height="32" fill="#3c6f9e"/><g transform="translate(600 138)"><rect x="-40" y="-40" width="26" height="40" fill="#8a8277"/><rect x="-14" y="-24" width="54" height="24" fill="#9a9286"/>${[-40, -32, -24].map((x) => `<rect x="${x}" y="-46" width="5" height="6" fill="#8a8277"/>`).join("")}</g><path d="M300 150q10-14 20 0q10-14 20 0" stroke="#2e5b3a" stroke-width="5" fill="none"/>`,
    islandia: () => cielo("#3c2f45", "#b85a3a") + `<polygon points="200,170 400,40 460,40 660,170" fill="#3b3438"/><polygon points="400,40 460,40 445,58 415,58" fill="#ff7a1a"/><path d="M430 40 q-20 -20 0 -34 q24 -10 18 -28" stroke="#6a5f66" stroke-width="16" fill="none" opacity=".7" stroke-linecap="round"/><path d="M425 58 L405 120 L420 170 M440 58 L470 130" stroke="#ff8c1a" stroke-width="7" fill="none"/>` + suelo0("#2b2729"),
    laponia: () => cielo("#0e1f45", "#2a4a7a") + estrellasCielo + `<path d="M0 60 Q200 10 400 55 T800 40" stroke="#5cf2a0" stroke-width="18" fill="none" opacity=".55"/><path d="M0 80 Q220 40 420 78 T800 62" stroke="#a46cff" stroke-width="10" fill="none" opacity=".45"/>` + montes("#d9e6f5", "0,140 200,118 400,138 600,116 800,138") + bosque(155, "#1e3b2c", 18, 1) + suelo0("#eef4fb"),
    segovia: () => cielo("#86c1ee", "#f4ead8") + sol(680, 40) + montes("#a3a9b8", "0,95 150,70 320,92 480,64 650,90 800,72") + `<g fill="#c8a777">${Array.from({ length: 14 }, (_, k) => `<path d="M${40 + k * 52} 170 V108 h40 V170 h-6 V128 a14 14 0 0 0 -28 0 V170Z"/>`).join("")}<rect x="40" y="96" width="728" height="12"/>${Array.from({ length: 28 }, (_, k) => `<path d="M${40 + k * 26} 96 V70 h20 V96 h-3 V82 a7 7 0 0 0 -14 0 V96Z"/>`).join("")}<rect x="40" y="62" width="728" height="8"/></g>`,
    bruselas: () => cielo("#a9d4f5", "#eef6ff") + nubes + (() => { const P = [[400, 30], [350, 70], [450, 70], [350, 130], [450, 130], [400, 100], [400, 160], [300, 100], [500, 100]]; return `<g stroke="#9aa6b2" stroke-width="7">${[[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 6], [0, 1], [0, 2], [1, 3], [2, 4], [7, 5], [8, 5]].map(([a, b]) => `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}"/>`).join("")}</g>${P.slice(0, 6).concat([P[7], P[8]]).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="#d7dee6" stroke="#8b98a5" stroke-width="2"/><circle cx="${x - 5}" cy="${y - 5}" r="4" fill="#fff"/>`).join("")}`; })() + suelo0("#bdb3a1"),
    luxemburgo: () => cielo("#9cc9ee", "#eef5fb") + nubes + `<rect y="110" width="800" height="60" fill="#6f8f4f"/><g fill="#b8a98d"><rect x="80" y="70" width="260" height="60"/>${Array.from({ length: 13 }, (_, k) => `<rect x="${80 + k * 20}" y="62" width="12" height="8"/>`).join("")}<rect x="380" y="100" width="300" height="16"/>${[0, 1, 2, 3].map((k) => `<path d="M${390 + k * 72} 170 V116 h56 V170 h-4 V140 a24 24 0 0 0 -48 0 V170Z"/>`).join("")}</g><rect x="250" y="34" width="22" height="40" fill="#a3937a"/><polygon points="245,34 277,34 261,16" fill="#4a5b6e"/>`,
    paris: () => cielo("#9fcff3", "#fdeee0") + sol(110, 40) + nubes + `<g fill="#6b5b4b"><polygon points="400,10 392,60 408,60"/><polygon points="392,60 408,60 420,110 380,110"/><rect x="372" y="104" width="56" height="8"/><path d="M380 110 L340 168 h22 q38 -40 76 0 h22 L420 110Z"/></g><path d="M396 30 h8 M392 60 h16 M384 84 h32" stroke="#4a3d31" stroke-width="2"/>` + `<g fill="#c9bfae">${[60, 160, 560, 660].map((x) => `<rect x="${x}" y="120" width="80" height="50"/><polygon points="${x},120 ${x + 80},120 ${x + 70},106 ${x + 10},106" fill="#5a6b7c"/>`).join("")}</g>`,
    venecia: () => cielo("#f6c48e", "#fdf0dc") + sol(140, 46, "#fff1c4") + `<rect y="138" width="800" height="32" fill="#2f8fb0"/><g><rect x="480" y="30" width="30" height="108" fill="#b6533a"/><rect x="474" y="22" width="42" height="12" fill="#e8dcc4"/><polygon points="476,22 514,22 495,0" fill="#4f7c63"/><rect x="486" y="44" width="18" height="16" fill="#e8dcc4"/></g><g fill="#e8c9a0">${[60, 150, 240, 600, 690].map((x, k) => `<rect x="${x}" y="${92 + (k % 2) * 10}" width="80" height="${46 - (k % 2) * 10}" fill="${["#e8c9a0", "#d98c6a", "#f0d8a8", "#c97a5a", "#e9b98f"][k]}"/>`).join("")}</g><path d="M250 150 q60 14 120 0 l-6 -4 q-54 10 -108 0Z" fill="#1d1d1d"/><path d="M372 150 l8 -10" stroke="#1d1d1d" stroke-width="3"/>`,
    viena: () => cielo("#a5d0f2", "#eef6ff") + nubes + montes("#4f8a46", "0,140 200,118 400,136 600,116 800,136") + `<g transform="translate(560 98)" stroke="#a33" stroke-width="3" fill="none"><circle r="56"/><circle r="8" fill="#a33"/>${Array.from({ length: 8 }, (_, k) => `<line x1="0" y1="0" x2="${56 * Math.cos(k * Math.PI / 4)}" y2="${56 * Math.sin(k * Math.PI / 4)}"/>`).join("")}${Array.from({ length: 8 }, (_, k) => `<rect x="${56 * Math.cos(k * Math.PI / 4) - 6}" y="${56 * Math.sin(k * Math.PI / 4)}" width="12" height="9" fill="#c33" stroke="none"/>`).join("")}<path d="M-30 72 L0 0 L30 72" stroke-width="5"/></g>` + bosque(150, "#2f6b2a", 12, 1),
    atenas: () => cielo("#7cc0f0", "#f5ecd6") + sol(660, 40) + montes("#c9a86a", "0,170 0,130 220,96 580,96 800,130 800,170") + `<g transform="translate(400 96)" fill="#efe6cf" stroke="#bfb08d"><rect x="-150" y="-8" width="300" height="10"/><polygon points="-150,-46 150,-46 0,-74"/><rect x="-150" y="-50" width="300" height="6"/>${Array.from({ length: 11 }, (_, k) => `<rect x="${-142 + k * 27}" y="-44" width="14" height="38"/>`).join("")}</g>`,
    praga: () => cielo("#f2b77f", "#fbe7cf") + sol(120, 46, "#fff3c7") + `<rect y="128" width="800" height="42" fill="#3f7fae"/><g fill="#3f3a36"><rect x="40" y="70" width="40" height="70"/><polygon points="36,70 84,70 60,30"/><rect x="720" y="76" width="40" height="64"/><polygon points="716,76 764,76 740,40"/><rect x="80" y="112" width="640" height="14"/>${Array.from({ length: 6 }, (_, k) => `<path d="M${110 + k * 105} 170 V126 h70 V170 h-4 V150 a31 31 0 0 0 -62 0 V170Z"/>`).join("")}${Array.from({ length: 10 }, (_, k) => `<rect x="${110 + k * 62}" y="94" width="6" height="18"/><circle cx="${113 + k * 62}" cy="91" r="4"/>`).join("")}</g><g fill="#7b6d63" opacity=".8"><rect x="360" y="20" width="90" height="34"/><polygon points="390,20 405,0 420,20"/></g>`,
    etna: () => cielo("#89b9e4", "#e9f1f6") + nubes + `<rect y="142" width="800" height="28" fill="#2f78b8"/><polygon points="80,150 380,30 440,30 740,150" fill="#5b4f4a"/><polygon points="370,34 450,34 470,52 350,52" fill="#fff"/><path d="M410 30 q-30 -10 -10 -24 q30 -6 10 -22" stroke="#aaa" stroke-width="14" fill="none" opacity=".6" stroke-linecap="round"/>` + [130, 650].map((x) => `<ellipse cx="${x}" cy="138" rx="30" ry="10" fill="#6d8a3a"/>`).join(""),
    copenhague: () => cielo("#a0cdee", "#eef6fb") + nubes + `<rect y="140" width="800" height="30" fill="#2f78b8"/>${Array.from({ length: 11 }, (_, k) => `<g transform="translate(${30 + k * 70} 140)"><rect x="0" y="-${60 + (k % 3) * 10}" width="60" height="${60 + (k % 3) * 10}" fill="${["#e74c3c", "#f1c40f", "#3498db", "#e67e22", "#2ecc71", "#9b59b6"][k % 6]}"/><polygon points="0,-${60 + (k % 3) * 10} 60,-${60 + (k % 3) * 10} 30,-${82 + (k % 3) * 10}" fill="#7a2e22"/><rect x="10" y="-40" width="10" height="12" fill="#fff"/><rect x="40" y="-40" width="10" height="12" fill="#fff"/></g>`).join("")}<rect x="300" y="60" width="4" height="84" fill="#5b3a1e"/><polygon points="304,64 340,110 304,110" fill="#fff"/>`,
    estrasburgo: () => cielo("#7fb4ea", "#eef4ff") + `<g transform="translate(400 54)">${Array.from({ length: 12 }, (_, k) => `<path transform="translate(${36 * Math.cos(k * Math.PI / 6)} ${36 * Math.sin(k * Math.PI / 6)}) scale(.55)" d="M0-13L3.8-4.2L13-4L5.8 2.2L8 11.5L0 6.3L-8 11.5L-5.8 2.2L-13-4L-3.8-4.2Z" fill="#ffcc00"/>`).join("")}</g><g fill="#c78d74"><rect x="120" y="70" width="70" height="100"/><polygon points="140,70 170,70 155,8"/><rect x="190" y="100" width="90" height="70"/>${[200, 225, 250].map((x) => `<path d="M${x} 170 V130 a8 8 0 0 1 16 0 V170Z" fill="#8a5a46"/>`).join("")}</g><g fill="#c7d6e6" stroke="#8aa1b8"><path d="M520 170 V110 a110 60 0 0 1 220 0 V170Z"/>${[540, 580, 620, 660, 700].map((x) => `<rect x="${x}" y="116" width="18" height="54" fill="#9fb8d1"/>`).join("")}</g>`
  };
  const fondoSVG = (k) => `<svg class="pc-fondo-svg" viewBox="0 0 800 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${(FONDOS[k] || FONDOS.irati)()}</svg>`;

  /* ---------- Bloques (Blockly) ---------- */
  const COND_TXT = { camino: "hay camino delante", agua: "hay agua delante", lava: "hay lava delante", arbol: "hay un árbol delante", roca: "hay una roca delante" };
  const EV_TXT = { placa: "⚡ Cuando pise una placa", estrella: "⭐ Cuando recoja una estrella", agua: "🌊 Cuando haya agua delante", lava: "🌋 Cuando haya lava delante", arbol: "🌲 Cuando haya un árbol delante" };
  const NOMBRES = { avanzar: "Avanzar", izq: "Girar a la izquierda", der: "Girar a la derecha", romper: "Romper", colocar: "Colocar", repetir: "Repetir", si: "Si", sisino: "Si / si no", hasta: "Repetir hasta llegar" };
  let bloquesDefinidos = false;
  function definirBloques() {
    if (bloquesDefinidos || !window.Blockly) return;
    bloquesDefinidos = true;
    const B = window.Blockly;
    const COL = { inicio: "#14225a", mov: "#3a7bd5", giro: "#8a4fd8", romper: "#8d6e63", colocar: "#c0392b", rep: "#2f8f5b", si: "#c2477a", ev: "#e09a00" };
    const conds = Object.keys(COND_TXT).map((k) => [COND_TXT[k], k]);
    B.defineBlocksWithJsonArray([
      { type: "pc_inicio", message0: "▶ Al empezar", nextStatement: null, colour: COL.inicio, tooltip: "El programa principal empieza aquí." },
      { type: "pc_avanzar", message0: "↑ Avanzar", previousStatement: null, nextStatement: null, colour: COL.mov, tooltip: "Da un paso hacia delante." },
      { type: "pc_girar", message0: "Girar a la %1", args0: [{ type: "field_dropdown", name: "DIR", options: [["izquierda ↺", "izq"], ["derecha ↻", "der"]] }], previousStatement: null, nextStatement: null, colour: COL.giro, tooltip: "Gira sin moverte." },
      { type: "pc_romper", message0: "⛏ Romper", previousStatement: null, nextStatement: null, colour: COL.romper, tooltip: "Rompe el árbol o la roca que tienes delante y te lo guardas." },
      { type: "pc_colocar", message0: "🧱 Colocar", previousStatement: null, nextStatement: null, colour: COL.colocar, tooltip: "Pone un bloque delante: puente sobre el agua, piedra sobre la lava o muro sobre un cimiento." },
      { type: "pc_repetir", message0: "Repetir %1 veces", args0: [{ type: "field_number", name: "N", value: 3, min: 1, max: 20, precision: 1 }], message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], previousStatement: null, nextStatement: null, colour: COL.rep, tooltip: "Repite los bloques de dentro." },
      { type: "pc_hasta", message0: "Repetir hasta llegar al portal", message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], previousStatement: null, nextStatement: null, colour: COL.rep, tooltip: "Repite lo de dentro hasta que Pini está en el portal." },
      { type: "pc_si", message0: "Si %1", args0: [{ type: "field_dropdown", name: "COND", options: conds }], message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], previousStatement: null, nextStatement: null, colour: COL.si, tooltip: "Hace lo de dentro solo si se cumple." },
      { type: "pc_sisino", message0: "Si %1", args0: [{ type: "field_dropdown", name: "COND", options: conds }], message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], message2: "si no %1", args2: [{ type: "input_statement", name: "SINO" }], previousStatement: null, nextStatement: null, colour: COL.si, tooltip: "Si se cumple hace lo primero; si no, lo segundo." }
    ].concat(Object.keys(EV_TXT).map((k) => ({ type: "pc_ev_" + k, message0: EV_TXT[k], message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], colour: COL.ev, tooltip: "Evento: lo de dentro se hace cada vez que pasa esto." }))));
  }
  function caja(n) {
    const c = [], b = n.bloques || [], tiene = (t) => b.indexOf(t) >= 0;
    const condsNivel = n.conds || ["camino", "agua", "lava", "arbol"];
    if (tiene("avanzar")) c.push({ kind: "block", type: "pc_avanzar" });
    if (tiene("girar")) { c.push({ kind: "block", type: "pc_girar", fields: { DIR: "izq" } }); c.push({ kind: "block", type: "pc_girar", fields: { DIR: "der" } }); }
    if (tiene("romper")) c.push({ kind: "block", type: "pc_romper" });
    if (tiene("colocar")) c.push({ kind: "block", type: "pc_colocar" });
    if (tiene("repetir")) c.push({ kind: "block", type: "pc_repetir" });
    if (tiene("hasta")) c.push({ kind: "block", type: "pc_hasta" });
    if (tiene("si")) c.push({ kind: "block", type: "pc_si", fields: { COND: condsNivel[0] } });
    if (tiene("sisino")) c.push({ kind: "block", type: "pc_sisino", fields: { COND: condsNivel[0] } });
    (n.eventos || []).forEach((e) => c.push({ kind: "block", type: "pc_ev_" + e }));
    return { kind: "flyoutToolbox", contents: c };
  }
  function cadena(b) {
    const out = [];
    for (; b; b = b.getNextBlock()) {
      if (!b.isEnabled()) continue;
      const base = { id: b.id, fijo: !b.isDeletable() };
      const dentro = (k) => cadena(b.getInputTargetBlock(k));
      switch (b.type) {
        case "pc_avanzar": out.push(Object.assign(base, { t: "avanzar" })); break;
        case "pc_girar": out.push(Object.assign(base, { t: "girar", d: b.getFieldValue("DIR") })); break;
        case "pc_romper": out.push(Object.assign(base, { t: "romper" })); break;
        case "pc_colocar": out.push(Object.assign(base, { t: "colocar" })); break;
        case "pc_repetir": out.push(Object.assign(base, { t: "repetir", n: +b.getFieldValue("N") || 1, cuerpo: dentro("HACER") })); break;
        case "pc_hasta": out.push(Object.assign(base, { t: "hasta", cuerpo: dentro("HACER") })); break;
        case "pc_si": out.push(Object.assign(base, { t: "si", c: b.getFieldValue("COND"), cuerpo: dentro("HACER") })); break;
        case "pc_sisino": out.push(Object.assign(base, { t: "sisino", c: b.getFieldValue("COND"), cuerpo: dentro("HACER"), sino: dentro("SINO") })); break;
      }
    }
    return out;
  }
  function textoPrograma(l) {
    return (l || []).map((b) => b.t === "repetir" ? `Repetir ${b.n} [${textoPrograma(b.cuerpo)}]` : b.t === "hasta" ? `Repetir hasta llegar [${textoPrograma(b.cuerpo)}]` : b.t === "si" ? `Si ${COND_TXT[b.c]} [${textoPrograma(b.cuerpo)}]` : b.t === "sisino" ? `Si ${COND_TXT[b.c]} [${textoPrograma(b.cuerpo)}] si no [${textoPrograma(b.sino)}]` : b.t === "girar" ? NOMBRES[b.d] : NOMBRES[b.t]).join(", ");
  }

  /* ---------- Pantalla de juego ---------- */
  let raiz = null, ws = null, ai = 0, ni = 0, nivel = null, intentos = 0, corriendo = 0, velocidad = 380;
  function montarPantalla() {
    if (raiz) return raiz;
    raiz = document.createElement("main");
    raiz.id = "pinicraft"; raiz.hidden = true;
    raiz.innerHTML = `
      <div class="barra-juego"><div class="envoltura">
        <button class="volver" id="pc-volver">← Programa</button>
        <div><h2 id="pc-titulo"></h2><div class="pais" id="pc-pais"></div></div>
        <div class="contador" id="pc-hud"></div>
      </div></div>
      <div class="envoltura">
        <div class="pc-fondo" id="pc-fondo"></div>
        <div class="objetivo"><div class="cara" id="pc-cara"></div><p><strong id="pc-objetivo"></strong><br><span class="dato" id="pc-dato"></span><span class="indicador" id="pc-ind"></span></p></div>
        <div class="juego con-puzle pc-juego">
          <div class="tablero-marco"><div class="pc-tablero" id="pc-tablero"></div><div class="pc-toast" id="pc-toast" hidden></div></div>
          <div class="editor">
            <div class="panel panel-puzle">
              <h3>Tu programa <small id="pc-cuenta"></small></h3>
              <p class="ayuda" id="pc-ayuda"></p>
              <div id="pc-blockly" class="blockly-area"></div>
            </div>
            <p class="aviso" id="pc-aviso" hidden></p>
            <div class="controles">
              <button class="btn" id="pc-ejecutar">▶ Ejecutar</button>
              <button class="btn sec" id="pc-reiniciar">Reiniciar</button>
              <label class="velocidad">Velocidad <select id="pc-vel"><option value="600">Lenta</option><option value="380" selected>Normal</option><option value="160">Rápida</option></select></label>
            </div>
          </div>
        </div>
      </div>`;
    const juego = $("#juego");
    (juego && juego.parentNode ? juego.parentNode : document.body).insertBefore(raiz, juego ? juego.nextSibling : null);
    $("#pc-volver").onclick = () => { location.hash = "programa"; };
    $("#pc-ejecutar").onclick = ejecutar;
    $("#pc-reiniciar").onclick = () => { corriendo++; pintarTablero(); aviso(null); botones(false); if (ws) ws.highlightBlock(null); };
    $("#pc-vel").onchange = (e) => { velocidad = +e.target.value || 380; };
    return raiz;
  }
  function personaje() {
    let id = "pini"; try { id = (JSON.parse(localStorage.getItem("rumbo-a-europa-v1") || "{}") || {}).personaje || "pini"; } catch (e) {}
    return (window.PERSONAJES || []).find((p) => p.id === id) || (window.PERSONAJES || [])[0] || { nombre: "Pini", foto: "img/pini.png" };
  }
  function abrir(a, i) {
    montarPantalla();
    corriendo++;
    ai = a; ni = i; nivel = AVS[a].niveles[i]; intentos = 0;
    ["#inicio", "#juego", "#robotica", "#rincones"].forEach((s) => { const e = $(s); if (e) e.hidden = true; });
    raiz.hidden = false;
    document.body.dataset.seccion = "programa";
    document.body.classList.add("en-pinicraft");
    const av = AVS[a], p = personaje();
    $("#pc-titulo").textContent = nivel.lugar;
    $("#pc-pais").textContent = `${nivel.pais} · ${av.nombre} · ${i + 1} de ${av.niveles.length}`;
    $("#pc-objetivo").textContent = nivel.objetivo;
    $("#pc-dato").textContent = nivel.dato;
    const cod = indicadorDe(a), txt = (((window.INDICADORES || {})["5º"] || {})[cod]) || "";
    $("#pc-ind").innerHTML = `<b>Indicador ${esc(cod)}</b> ${esc(txt)}`;
    $("#pc-cara").innerHTML = p.foto ? `<img src="${esc(p.foto)}" alt="${esc(p.nombre)}">` : "";
    $("#pc-fondo").innerHTML = fondoSVG(nivel.fondo) + `<span class="pc-fondo-txt">${esc(nivel.lugar)} · ${esc(nivel.pais)}</span>`;
    $("#pc-ayuda").textContent = nivel.fijo
      ? "El programa principal ya está puesto (con candado). Arrastra un evento amarillo «Cuando…» y mete dentro lo que Pini tiene que hacer."
      : (nivel.eventos ? "Engancha el programa debajo de «Al empezar» y añade los eventos amarillos «Cuando…» que necesites." : "Arrastra bloques y engánchalos debajo de «Al empezar». Para borrar uno, llévalo a la papelera.");
    pintarTablero();
    aviso(null); botones(false);
    window.scrollTo(0, 0);
    iniciarBlockly();
  }
  function iniciarBlockly() {
    const div = $("#pc-blockly");
    if (ws) { ws.dispose(); ws = null; }
    if (!window.Blockly) { div.innerHTML = "<p class='aviso'>No se ha podido cargar el editor de bloques. Recarga la página.</p>"; return; }
    definirBloques();
    const B = window.Blockly;
    const tema = B.Theme.defineTheme("pinicraft", { base: B.Themes.Classic, fontStyle: { family: "Nunito, 'Segoe UI', sans-serif", weight: "800", size: 13 },
      componentStyles: { workspaceBackgroundColour: "#f6f8f7", flyoutBackgroundColour: "#e9e3d6", flyoutOpacity: 1, scrollbarColour: "#c7d1cc", insertionMarkerColour: "#14225a", insertionMarkerOpacity: 0.3 } });
    ws = B.inject(div, {
      toolbox: caja(nivel), media: "js/vendor/media/", renderer: "zelos", theme: tema, trashcan: true, sounds: false,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: false, startScale: window.innerWidth < 600 ? 0.65 : 0.85, maxScale: 1.4, minScale: 0.5 },
      grid: { spacing: 24, length: 2, colour: "#dfe6e2", snap: false }
    });
    const bloqueado = { deletable: false, movable: false, editable: false };
    const ini = { type: "pc_inicio", x: 20, y: 20, deletable: false };
    if (nivel.fijo === "hasta-avanzar") Object.assign(ini, { movable: false, next: { block: Object.assign({ type: "pc_hasta", inputs: { HACER: { block: Object.assign({ type: "pc_avanzar" }, bloqueado) } } }, bloqueado) } });
    B.serialization.blocks.append(ini, ws);
    ws.addChangeListener(B.Events.disableOrphans);
    ws.addChangeListener((e) => { if (!e.isUiEvent) cuenta(); });
    cuenta();
    setTimeout(() => { try { B.svgResize(ws); } catch (e) {} }, 60);
  }
  function leer() {
    const prog = { main: [], eventos: {} }, dobles = [];
    if (!ws) return { prog, dobles };
    ws.getTopBlocks(true).forEach((b) => {
      if (b.type === "pc_inicio") prog.main = cadena(b.getNextBlock());
      else if (b.type.indexOf("pc_ev_") === 0) {
        const k = b.type.slice(6);
        if (prog.eventos[k]) dobles.push(EV_TXT[k]); else prog.eventos[k] = cadena(b.getInputTargetBlock("HACER"));
      }
    });
    return { prog, dobles };
  }
  function cuenta() {
    const { prog } = leer(), n = M.contarBloques(prog);
    $("#pc-cuenta").textContent = `${n} bloque${n === 1 ? "" : "s"} · reto: ${nivel.reto}`;
    return n;
  }
  function pintarTablero() {
    const t = $("#pc-tablero"), filas = nivel.mapa.length, cols = nivel.mapa[0].length;
    t.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    t.style.maxWidth = Math.min(cols * 84, 760) + "px";
    let h = "";
    nivel.mapa.forEach((f, y) => f.split("").forEach((c, x) => { h += `<div class="pc-celda" data-xy="${x},${y}"><svg viewBox="0 0 40 40">${casilla(c, nivel.suelo, x * 7 + y * 13)}</svg></div>`; }));
    const p = personaje();
    h += `<div class="pc-sprite" id="pc-sprite"><div class="pc-sombra"></div>${p.foto ? `<img src="${esc(p.foto)}" alt="" draggable="false">` : ""}<span class="pc-flecha">➜</span></div>`;
    t.innerHTML = h;
    const s0 = M.estadoInicial(nivel);
    colocar(s0.x, s0.y, s0.dir, true);
    hud(s0);
  }
  function colocar(x, y, dir, sinAnim) {
    const s = $("#pc-sprite"), filas = nivel.mapa.length, cols = nivel.mapa[0].length;
    if (sinAnim) s.style.transition = "none";
    s.style.width = `calc((100% - ${(cols - 1) * 2}px) / ${cols})`;
    s.style.height = `calc((100% - ${(filas - 1) * 2}px) / ${filas})`;
    s.style.left = `calc(${x} * ((100% - ${(cols - 1) * 2}px) / ${cols} + 2px))`;
    s.style.top = `calc(${y} * ((100% - ${(filas - 1) * 2}px) / ${filas} + 2px))`;
    $(".pc-flecha", s).style.transform = `rotate(${dir * 90}deg)`;
    s.classList.toggle("izquierda", dir === 2);
    if (sinAnim) { void s.offsetWidth; s.style.transition = ""; }
  }
  function cambiarCasilla(x, y, c) {
    const el = $(`#pc-tablero [data-xy="${x},${y}"]`);
    if (el) { el.innerHTML = `<svg viewBox="0 0 40 40">${casilla(c, nivel.suelo, x * 7 + y * 13)}</svg>`; el.classList.remove("pc-pum"); void el.offsetWidth; el.classList.add("pc-pum"); }
  }
  function hud(p) {
    const s0 = M.estadoInicial(nivel), L = [];
    if (s0.totalPinas) L.push(`🌰 ${p.pinas || 0}/${s0.totalPinas}`);
    if (s0.totalEstrellas) L.push(`⭐ ${p.estrellas || 0}/${s0.totalEstrellas}`);
    if (s0.maderaPedida || (nivel.bloques || []).indexOf("romper") >= 0) L.push(`🪵 ${p.madera || 0}${s0.maderaPedida ? "/" + s0.maderaPedida : ""}`);
    if ((p.piedra || 0) > 0) L.push(`🪨 ${p.piedra}`);
    if (s0.cimientos) L.push(`🧱 muros`);
    $("#pc-hud").textContent = L.join("  ·  ");
  }
  function aviso(t, tipo) { const a = $("#pc-aviso"); a.hidden = !t; a.textContent = t || ""; a.className = "aviso" + (tipo ? " " + tipo : ""); }
  function botones(on) { $("#pc-ejecutar").disabled = !!on; }
  function toast(t) { const e = $("#pc-toast"); e.textContent = t; e.hidden = false; clearTimeout(e._t); e._t = setTimeout(() => (e.hidden = true), Math.max(700, velocidad * 2)); }
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  async function ejecutar() {
    if (!ws) return;
    const { prog, dobles } = leer();
    if (dobles.length) { aviso(`Solo puede haber un evento de cada tipo: tienes repetido «${dobles[0]}».`); return; }
    if (!prog.main.length && !Object.keys(prog.eventos).length) { aviso("Engancha algún bloque debajo de «Al empezar»."); return; }
    intentos++;
    const yo = ++corriendo;
    pintarTablero(); aviso(null); botones(true);
    const r = M.simular(nivel, prog);
    for (const p of r.pasos) {
      if (yo !== corriendo) return;
      if (p.id) ws.highlightBlock(p.id);
      if (p.accion === "evento") toast(EV_TXT[p.evento]);
      if (p.cambio) cambiarCasilla(p.cambio[0], p.cambio[1], p.cambio[3]);
      if (p.recoge) cambiarCasilla(p.x, p.y, ".");
      if (["avanzar", "girar", "agua", "lava", "choque", "inicio"].indexOf(p.accion) >= 0) colocar(p.x, p.y, p.dir);
      if (p.accion === "agua" || p.accion === "lava") $("#pc-sprite").classList.add("pc-cae");
      if (p.accion === "choque") { $("#pc-sprite").classList.remove("pc-choca"); void $("#pc-sprite").offsetWidth; $("#pc-sprite").classList.add("pc-choca"); }
      hud(p);
      await espera(["bucle", "si", "inicio", "evento"].indexOf(p.accion) >= 0 ? velocidad / 3 : velocidad);
    }
    if (yo !== corriendo) return;
    ws.highlightBlock(null);
    botones(false);
    if (r.ok) victoria(prog);
    else {
      aviso(r.motivo || "Todavía no lo has conseguido. ¡Prueba otra vez!");
      if (V() && !hecho(ai, ni)) V().registrar(clave(ai, ni), { nota: V().nota({ completado: false, parcial: r.parcial, intentos }), intentos, codigo: indicadorDe(ai), pantalla: "Programación", actividad: actividad(ai, ni) });
    }
  }

  function victoria(prog) {
    const n = M.contarBloques(prog), est = n <= nivel.reto ? 3 : n <= nivel.reto + 2 ? 2 : 1;
    apuntar(clave(ai, ni), est);
    const cod = indicadorDe(ai);
    const nota = V() ? V().nota({ completado: true, parcial: false, intentos, bloques: n, reto: nivel.reto }) : null;
    const reg = V() ? V().registrar(clave(ai, ni), { nota, intentos, bloques: n, codigo: cod, pantalla: "Programación", actividad: actividad(ai, ni) }) : null;
    if (V()) V().enviar({ destino: destino(ai, ni), ciudad: nivel.lugar, estrellas: est, bloques: n, intentos, personaje: personaje().nombre,
      programa: (textoPrograma(prog.main) + Object.keys(prog.eventos).map((k) => ` | ${EV_TXT[k].replace(/^\S+ /, "")}: [${textoPrograma(prog.eventos[k])}]`).join("")).slice(0, 480),
      indicador: cod, valoracion: nota });
    const av = AVS[ai], ultimo = ni === av.niveles.length - 1, todas = todasHechas(ai);
    const estrellasEU = ai === 1 ? estrellasRecogidas() : 0;
    let h = `<div class="pc-premio">${ai === 1 ? banderaEstrellas(estrellasEU) : `<svg viewBox="0 0 40 40" width="110" height="110">${casilla("N", "hierba", 1)}</svg>`}</div>
      <h2>¡${esc(nivel.lugar)} superado!</h2>
      <div class="grandes" aria-label="${est} de 3 estrellas"><b>${"★".repeat(est)}</b>${"★".repeat(3 - est)}</div>
      <p>${est === 3 ? `Programa perfecto: ${n} bloques.` : `Lo has hecho con ${n} bloques. ¿Puedes conseguirlo con ${nivel.reto}?`}</p>
      ${reg ? `<p class="val-ind">Indicador ${esc(cod)}: <b>${Math.max(nota, reg.nota)} de 5</b></p>` : ""}
      ${ai === 1 ? `<p>Estrellas de la bandera europea recuperadas: <b>${estrellasEU} de 12</b></p>` : ""}`;
    if (ultimo && todas) h += `<div class="diploma"><span class="etiqueta">Insignia</span><strong>${esc(alumno().nombre || "Viajero/a")}: ${esc(av.nombre)} completada</strong><p style="margin:4px 0 0">Has superado las ${av.niveles.length} pantallas. ${ai === 0 ? "Se abre «El viaje del héroe»." : "¡La bandera europea vuelve a tener sus 12 estrellas!"}</p></div>`;
    h += `<div class="acciones"><button class="btn sec" id="pcv-repetir">Repetir</button>${ultimo ? `<button class="btn" id="pcv-volver">${ai === 0 && todas ? "Ir a El viaje del héroe" : "Volver a Programa"}</button>` : `<button class="btn" id="pcv-sig">Siguiente: ${esc(av.niveles[ni + 1].lugar)}</button>`}</div>`;
    const velo = $("#velo"), ven = $("#ventana");
    ven.innerHTML = h; velo.hidden = false;
    const cerrar = () => { velo.hidden = true; };
    $("#pcv-repetir").onclick = () => { cerrar(); pintarTablero(); };
    const sig = $("#pcv-sig"); if (sig) sig.onclick = () => { cerrar(); location.hash = `programa-pinicraft-${ai + 1}-${ni + 2}`; };
    const vol = $("#pcv-volver"); if (vol) vol.onclick = async () => {
      cerrar();
      if (ai === 0 && todas) { if (await pedirAutoeval(0)) location.hash = "programa-pinicraft-2-1"; else location.hash = "programa"; }
      else { if (todas) await pedirAutoeval(ai); location.hash = "programa"; }
    };
    $("#pcv-repetir").focus();
  }
  function estrellasRecogidas() {
    const av = AVS[1]; let t = 0;
    av.niveles.forEach((n, i) => { if (hecho(1, i)) t += n.mapa.join("").split("E").length - 1; });
    return Math.min(12, t);
  }
  function banderaEstrellas(k) {
    return `<svg viewBox="-60 -40 120 80" width="150" height="100"><rect x="-60" y="-40" width="120" height="80" fill="#003399" rx="4"/>${Array.from({ length: 12 }, (_, j) => `<path transform="translate(${28 * Math.sin(j * Math.PI / 6)} ${-28 * Math.cos(j * Math.PI / 6)}) scale(.42)" d="M0-13L3.8-4.2L13-4L5.8 2.2L8 11.5L0 6.3L-8 11.5L-5.8 2.2L-13-4L-3.8-4.2Z" fill="${j < k ? "#ffcc00" : "#2a4fb0"}"/>`).join("")}</svg>`;
  }
  // Autoevaluación obligatoria al terminar una aventura (la guarda js/rincones.js en la pestaña Autoevaluación).
  async function pedirAutoeval(a) {
    if (!window.Autoeval || !window.Autoeval.asegurar) return true;
    try { return await window.Autoeval.asegurar(etapa(a)); } catch (e) { return true; }
  }

  /* ---------- Apartado «2.º trimestre» en la pantalla de Programa ---------- */
  function seccion() {
    let s = $("#pc-seccion");
    if (s) return s;
    const lista = $("#lista-destinos"); if (!lista) return null;
    const sec = lista.closest("section");
    s = document.createElement("section");
    s.className = "seccion pc-seccion"; s.id = "pc-seccion";
    s.innerHTML = `<div class="envoltura"><span class="etiqueta">2.º trimestre</span><h2 id="pc-sec-tit">Nuevas aventuras</h2><p class="intro" id="pc-sec-intro"></p><div id="pc-sec-lista"></div><div id="scratch-retos-lista"></div></div>`;
    sec.parentNode.insertBefore(s, sec.nextSibling);
    return s;
  }
  function pintarSeccion() {
    const s = seccion(); if (!s) return;
    const c = curso();
    s.hidden = !!window.ADAPTADO;
    $("#pc-sec-tit", s).textContent = c === "6º" ? "Retos Scratch · Agencia EuroRuta" : "PiniCraft";
    $("#pc-sec-intro", s).textContent = c === "6º"
      ? "Seis retos de Scratch: cada uno con su ruta sencilla, intermedia y avanzada. Haz el proyecto en scratch.mit.edu, guárdalo en OneDrive y márcalo aquí como terminado."
      : "Dos aventuras nuevas de bloques por los paisajes y monumentos de Europa. Completa cada pantalla para abrir la siguiente.";
    const L = $("#pc-sec-lista", s);
    if (c !== "5º" || window.ADAPTADO) { L.innerHTML = ""; return; }
    L.innerHTML = AVS.map((av, a) => {
      const hechas = av.niveles.filter((_, i) => hecho(a, i)).length, abiertaAv = aventuraAbierta(a);
      const tarjetas = av.niveles.map((n, i) => {
        const ok = abierta(a, i), est = avance()[clave(a, i)] || 0;
        return `<button class="destino pc-destino" data-a="${a}" data-i="${i}" ${ok ? "" : "disabled"}>
          <span class="num">Pantalla ${i + 1} de ${av.niveles.length}</span>
          <span class="pc-mini">${fondoSVG(n.fondo)}</span>
          <strong>${esc(n.lugar)}</strong><span class="pais">${esc(n.pais)}</span>
          <span class="ind-mini">Ind. ${esc(indicadorDe(a))}</span>
          <span class="estrellas">${!ok ? "Bloqueado" : est ? "<b>" + "★".repeat(est) + "</b>" + "★".repeat(3 - est) : hecho(a, i) ? "<b>✓ Hecha</b>" : "★★★"}</span>
        </button>`;
      }).join("");
      return `<div class="aventura pc-aventura"><div class="aventura-cab"><span class="etiqueta">Aventura ${4 + a}</span><h3>${esc(av.nombre)}</h3><p>${esc(av.resumen)}${!abiertaAv ? (a === 0 ? " · Se abre al terminar las aventuras de los países." : " · Se abre al superar las 10 pantallas de PiniCraft Aventurero.") : ""}</p><span class="aventura-cuenta">${hechas} / ${av.niveles.length}</span></div><div class="destinos">${tarjetas}</div></div>`;
    }).join("");
    L.querySelectorAll(".pc-destino").forEach((b) => (b.onclick = () => { location.hash = `programa-pinicraft-${+b.dataset.a + 1}-${+b.dataset.i + 1}`; }));
  }

  /* ---------- Rutas ---------- */
  async function enrutar() {
    const m = HASH.exec(location.hash);
    if (!m) {
      if (raiz && !raiz.hidden) { raiz.hidden = true; corriendo++; document.body.classList.remove("en-pinicraft"); if (location.hash === "#programa") { const i = $("#inicio"); if (i) i.hidden = false; } }
      if (location.hash === "#programa") { pintarSeccion(); recuperarHoja().then(pintarSeccion); }
      return;
    }
    if (window.Candado && window.Candado.cerrado && window.Candado.cerrado()) { location.replace("#"); return; }
    const a = +m[1] - 1, i = +m[2] - 1;
    if (!esQuinto() || !AVS[a] || !AVS[a].niveles[i]) { location.replace("#programa"); return; }
    if (!alumno().nombre) { location.replace("#programa"); return; }
    await recuperarHoja();
    if (!abierta(a, i)) { alert(aventuraAbierta(a) ? "Esta pantalla está bloqueada: supera antes la anterior." : "Esta aventura todavía está cerrada."); location.replace("#programa"); return; }
    // Para entrar en El viaje del héroe hay que haber hecho la autoevaluación de Aventurero.
    if (a === 1 && !(await pedirAutoeval(0))) { location.replace("#programa"); return; }
    abrir(a, i);
  }
  window.addEventListener("hashchange", enrutar);
  ["alumno-cambiado", "progreso-remoto", "pinicraft-avance"].forEach((e) => window.addEventListener(e, () => { if (location.hash === "#programa" || location.hash === "" ) pintarSeccion(); }));
  window.addEventListener("resize", () => { if (ws && raiz && !raiz.hidden) try { window.Blockly.svgResize(ws); } catch (e) {} });
  pintarSeccion();
  enrutar();
  window.PiniCraft = { enrutar, pintarSeccion, recuperarHoja, hecho, AVS };
})();
