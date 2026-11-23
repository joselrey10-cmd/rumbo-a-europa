/*
  ROBÓTICA: practicar con un robot sobre el tapete de Europa (6 x 6 casillas de 15 x 15 cm).
  Tres niveles: Robot (avanzar y girar), SPIKE Essential y SPIKE Prime. Essential y Prime usan los mismos bloques de
  palabras que la app de SPIKE (Eventos, Control, Motores, Movimiento…). La adaptación curricular usa en Essential
  los bloques de iconos (más sencillos).
  LEGO y SPIKE son marcas de LEGO Group. Esta web no está relacionada con LEGO:
  los bloques están dibujados de nuevo para practicar su forma de programar.
*/
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const B = window.Blockly;
  const CASILLAS = window.CASILLAS_EUROPA;
  const MAPA_URL = "img/europa.svg";
  const LETRAS = "ABCDEF";
  const CM = 100 / 15;           // unidades del mapa por centímetro (600 = 90 cm)
  const CASILLA = 15 * CM;       // una casilla = 15 cm
  const RUEDA_CM = 17.6;         // circunferencia real de la rueda (56 mm de diámetro)
  const EJE_CM = 11.2;           // distancia entre las ruedas izquierda y derecha
  const CLAVE = window.ADAPTADO ? "rumbo-robotica-ac" : "rumbo-robotica-v1";

  /* ---------- Retos (los mismos para los tres niveles) ----------
     inicio: casilla y dirección (E, S, O, N). metas: casillas a visitar en orden. */
  const AC = !!window.ADAPTADO;   // adaptación curricular: solo el robot de flechas y retos cortos
  const RETOS_TODOS = [
    { titulo: "De España a Italia", texto: "Sal de España y llega a Italia.", inicio: ["A5", "E"], metas: [["D5", "Italia"]] },
    { titulo: "Rumbo al Reino Unido", texto: "Sube desde el sur de España hasta el Reino Unido.", inicio: ["A6", "N"], metas: [["B3", "Reino Unido"]] },
    { titulo: "Alemania y Grecia", texto: "Pasa por Alemania y termina en Grecia.", inicio: ["B4", "E"], metas: [["C4", "Alemania"], ["E6", "Grecia"]] },
    { titulo: "Ruta nórdica", texto: "Visita Dinamarca, Suecia y Finlandia, por este orden.", inicio: ["C4", "N"], metas: [["C3", "Dinamarca"], ["D2", "Suecia"], ["E1", "Finlandia"]] },
    { titulo: "Ruta atlántica", texto: "Visita Francia, Italia y termina en Grecia. Planifica tres etapas y varios giros.", inicio: ["A5", "E"], metas: [["B5", "Francia"], ["C5", "Italia"], ["E6", "Grecia"]], exige: { essential: ["repetir"], prime: ["variable"] } },
    { titulo: "Corazón de Europa", texto: "Cruza cuatro destinos: Alemania, Chequia, Polonia y Rumanía. Organiza bien la secuencia.", inicio: ["B4", "E"], metas: [["C4", "Alemania"], ["D4", "Chequia"], ["E4", "Polonia"], ["E5", "Rumanía"]], exige: { essential: ["siPais"], prime: ["siPais"] } },
    { titulo: "Escandinavia", texto: "Viaja hacia el norte: Dinamarca, Suecia, Finlandia y Rusia. Necesitarás combinar varios tramos.", inicio: ["C4", "N"], metas: [["C3", "Dinamarca"], ["D2", "Suecia"], ["E1", "Finlandia"], ["F1", "Rusia"]], exige: { essential: ["repetir"], prime: ["repetir", "variable", "siVariable"] } },
    { titulo: "Del Mediterráneo al este", texto: "Empieza en España, recoge Italia y Grecia y termina en Turquía. Ajusta distancias y giros.", inicio: ["A6", "E"], metas: [["C5", "Italia"], ["E6", "Grecia"], ["F6", "Turquía"]], exige: { essential: ["siPais"], prime: ["siPais", "variable"] } },
    { titulo: "Europa oriental", texto: "Atraviesa Chequia, Rumanía, Ucrania y Turquía, sin saltarte ninguna parada.", inicio: ["C4", "E"], metas: [["D4", "Chequia"], ["E5", "Rumanía"], ["F4", "Ucrania"], ["F6", "Turquía"]], exige: { essential: ["repetir", "siPais"], prime: ["repetir", "siPais", "variable"] } },
    { titulo: "Gran expedición europea", texto: "El gran desafío: Reino Unido, Suecia, Finlandia, Ucrania, Turquía y Grecia, en ese orden.", inicio: ["A5", "N"], metas: [["B3", "Reino Unido"], ["D2", "Suecia"], ["E1", "Finlandia"], ["F4", "Ucrania"], ["F6", "Turquía"], ["E6", "Grecia"]], exige: { essential: ["repetir", "siPais"], prime: ["repetir", "siPais", "variable", "siVariable"] } }
  ];
  const RETOS = AC && window.RETOS_ROB_AC ? window.RETOS_ROB_AC : RETOS_TODOS;
  const DIR_GRADOS = { E: 0, S: 90, O: 180, N: 270 };

  const MODOS = {
    robot: {
      nombre: "Robot", sub: "Avanzar y girar",
      texto: "Como el robot de suelo del aula: cada Avanzar es una casilla y cada giro es un cuarto de vuelta.",
      color: "#3a7bd5"
    },
    essential: AC ? {
      nombre: "SPIKE Essential", sub: "Bloques de iconos",
      texto: "Bloques con dibujos: adelante, atrás y girar. Una casilla son 15 cm.",
      color: "#e8489b"
    } : {
      nombre: "SPIKE Essential", sub: "Bloques de la app SPIKE",
      texto: "Los bloques de la app de SPIKE: eventos, control, motores A y B y movimiento. Una casilla son 15 cm y una rotación de rueda, 13,5 cm.",
      color: "#e8489b"
    },
    prime: AC ? undefined : {
      nombre: "SPIKE Prime", sub: "Bloques de la app SPIKE",
      texto: "Los bloques de la app de SPIKE con el coche de cuatro ruedas: motores A a F, movimiento, sensor virtual, condiciones y variables.",
      color: "#14225a"
    }
  };

  Object.keys(MODOS).forEach((k) => { if (!MODOS[k]) delete MODOS[k]; });

  /* ---------- Progreso ---------- */
  let hechos = {};
  try { hechos = JSON.parse(localStorage.getItem(CLAVE) || "{}") || {}; } catch (e) { hechos = {}; }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(hechos)); } catch (e) {} };
  // Se suma el progreso guardado en la hoja (js/retos-encadenados.js), para no perderlo al cambiar de ordenador.
  const hecho = (m, i) => !!(hechos[m] && hechos[m][i]) || !!(AC && window.HOJA_AC && window.HOJA_AC.rob[`${m}-${i}`]) || !!(!AC && window.RetosCadena && window.RetosCadena.hecho && window.RetosCadena.hecho(`robot-${m}`, i));
  window.addEventListener("progreso-remoto", () => { const r = document.getElementById("rb-menu"); if (r && !r.hidden && !document.getElementById("robotica").hidden) pintarMenu(); });

  /* ---------- Utilidades del tapete ---------- */
  function centroDe(cas) {
    const c = LETRAS.indexOf(cas[0]), f = +cas.slice(1) - 1;
    return [c * CASILLA + CASILLA / 2, f * CASILLA + CASILLA / 2];
  }
  function casillaEn(x, y) {
    const c = Math.floor(x / CASILLA), f = Math.floor(y / CASILLA);
    if (c < 0 || c > 5 || f < 0 || f > 5) return null;
    return { nombre: LETRAS[c] + (f + 1), paises: CASILLAS[f][c] };
  }

  /* ---------- Iconos para los bloques de iconos ---------- */
  const ico = (cuerpo) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${cuerpo}</svg>`);
  const ICONOS = {
    bandera: ico('<path d="M8 28V5"/><path d="M8 6h15l-4 5 4 5H8" fill="#fff"/>'),
    adelante: ico('<path d="M16 27V6M7 14l9-9 9 9"/>'),
    atras: ico('<path d="M16 5v21M7 18l9 9 9-9"/>'),
    derecha: ico('<path d="M8 26V15a7 7 0 0 1 7-7h10"/><path d="M20 3l5 5-5 5"/>'),
    izquierda: ico('<path d="M24 26V15a7 7 0 0 0-7-7H7"/><path d="M12 3L7 8l5 5"/>'),
    repetir: ico('<path d="M25 13a9 9 0 1 0 1 6"/><path d="M26 5v8h-8"/>'),
    reloj: ico('<circle cx="16" cy="17" r="11"/><path d="M16 10v7l5 3"/>'),
    luz: ico('<path d="M11 21a8 8 0 1 1 10 0v4H11z"/><path d="M12 29h8"/>'),
    sonido: ico('<path d="M12 24V7l14-3v17"/><circle cx="9" cy="24" r="3.5" fill="#fff"/><circle cx="23" cy="21" r="3.5" fill="#fff"/>'),
    sensor: ico('<path d="M5 16a11 11 0 0 1 22 0"/><path d="M9 16a7 7 0 0 1 14 0"/><path d="M16 16l7-7"/><circle cx="16" cy="16" r="2" fill="#fff"/>')
  };
  const img = (k) => ({ type: "field_image", src: ICONOS[k], width: 28, height: 28, alt: k });

  ICONOS.play = ico('<path d="M9 5l17 11-17 11z" fill="#fff"/>');
  ICONOS.hub = ico('<rect x="5" y="5" width="22" height="22" rx="5" fill="#fff" stroke="none"/><circle cx="16" cy="20" r="2" stroke="#999" stroke-width="1.5"/>');
  ICONOS.color = ico('<rect x="4" y="4" width="24" height="24" rx="4" fill="#fff" stroke="none"/><circle cx="16" cy="16" r="7" stroke="#8a7a2a" stroke-width="2.5"/><circle cx="16" cy="16" r="3" fill="#8a7a2a" stroke="none"/>');
  ICONOS.motor = ico('<circle cx="16" cy="16" r="13" fill="#fff" stroke="none"/><g fill="#3a76c8" stroke="none"><circle cx="16" cy="8" r="3.2"/><circle cx="16" cy="24" r="3.2"/><circle cx="8" cy="16" r="3.2"/><circle cx="24" cy="16" r="3.2"/></g><path d="M16 13v6M13 16h6" stroke="#3a76c8" stroke-width="2"/>');
  ICONOS.mover = ico('<circle cx="13" cy="17" r="10" fill="#fff" stroke="none"/><circle cx="20" cy="13" r="9" fill="#fff" stroke="#c04aa8" stroke-width="1.5"/><g fill="#c04aa8" stroke="none"><circle cx="20" cy="7.5" r="2.2"/><circle cx="20" cy="18.5" r="2.2"/><circle cx="14.5" cy="13" r="2.2"/><circle cx="25.5" cy="13" r="2.2"/></g>');
  ICONOS.coche = ico('<circle cx="16" cy="16" r="11"/><circle cx="16" cy="10" r="2" fill="#fff"/><circle cx="10" cy="17" r="2" fill="#fff"/><circle cx="22" cy="17" r="2" fill="#fff"/><circle cx="16" cy="21" r="2" fill="#fff"/>');
  const UNIDADES = [["rotaciones", "rot"], ["grados", "gr"], ["segundos", "s"], ["cm", "cm"], ["pulgadas", "in"]];
  // Puertos del coche: A trasera izquierda, B trasera derecha, C delantera izquierda, D delantera derecha. E y F no tienen ruedas.
  const PARES = [["A+B", "AB"], ["C+D", "CD"], ["B+A", "BA"], ["D+C", "DC"], ["A+C", "AC"], ["E+F", "EF"]];
  const RUEDAS = { A: [-1, -1], B: [-1, 1], C: [1, -1], D: [1, 1] };   // [delante(+1)/detrás(-1), izquierda(-1)/derecha(+1)]

  /* ---------- Volante de giro (campo de bloque) ---------- */
  if (B) {
    class CampoVolante extends B.Field {
      constructor(valor) { super(valor === undefined ? 0 : valor); this.SERIALIZABLE = true; this.CURSOR = "pointer"; }
      static fromJson(o) { return new CampoVolante(o.value); }
      doClassValidation_(v) { v = Math.round(+v); if (isNaN(v)) return null; return Math.max(-100, Math.min(100, v)); }
      getText_() { const v = this.getValue(); return v === 0 ? "recto: 0" : (v > 0 ? "derecha: " : "izquierda: ") + Math.abs(v); }
      showEditor_() {
        const caja = B.DropDownDiv.getContentDiv();
        caja.innerHTML = "";
        const panel = document.createElement("div");
        panel.className = "volante-panel";
        panel.innerHTML = `<svg viewBox="-60 -60 120 120" class="volante-svg"><path d="M0 -52 A52 52 0 0 1 45 -26" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="10"/><path d="M0 -52 A52 52 0 0 0 -45 -26" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="10"/>
          <g class="volante-rueda"><circle r="40" fill="none" stroke="#fff" stroke-width="7"/><circle r="9" fill="#fff"/><path d="M-37 6 Q0 -6 37 6 M0 9 V38" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><circle cy="-40" r="6" fill="#ffd400"/></g></svg>
          <div class="volante-fila"><button type="button" data-d="-10" aria-label="Más a la izquierda">−</button><span class="volante-txt"></span><button type="button" data-d="10" aria-label="Más a la derecha">+</button></div>
          <input type="range" min="-100" max="100" step="5" class="volante-rango" aria-label="Giro">`;
        caja.appendChild(panel);
        const rueda = panel.querySelector(".volante-rueda"), txt = panel.querySelector(".volante-txt"), rango = panel.querySelector(".volante-rango");
        const pintar = () => { const v = this.getValue(); rueda.setAttribute("transform", `rotate(${v * 1.2})`); txt.textContent = this.getText_(); rango.value = v; };
        const poner = (v) => { this.setValue(v); pintar(); };
        panel.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => poner(this.getValue() + +b.dataset.d)));
        rango.addEventListener("input", () => poner(+rango.value));
        const svg = panel.querySelector("svg");
        const arrastrar = (e) => {
          const r = svg.getBoundingClientRect();
          const a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
          poner(Math.round(a / 1.2 / 5) * 5);
        };
        svg.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); svg.setPointerCapture(e.pointerId); arrastrar(e); svg.onpointermove = arrastrar; });
        svg.addEventListener("pointerup", () => { svg.onpointermove = null; });
        pintar();
        B.DropDownDiv.setColour("#9b2f8f", "#7a1f70");
        B.DropDownDiv.showPositionedByField(this);
      }
    }
    B.fieldRegistry.register("field_volante", CampoVolante);
  }

  /* ---------- Definición de bloques ---------- */
  const C = { evento: "#e9c43b", mov: "#de5bc6", ctrl: "#e8b443", luz: "#9966ff", son: "#cf63cf", rob: "#3a7bd5", giro: "#8a4fd8", mot: "#4a8fe0", sen: "#2fb6d8", ope: "#59c059" };
  const PUERTOS_ESS = [["A", "A"], ["B", "B"], ["A+B", "AB"]];
  const PUERTOS_PRI = [["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"], ["E", "E"], ["F", "F"], ["A+B", "AB"], ["C+D", "CD"]];
  // El desplegable de puertos depende de la modalidad abierta (Essential: A y B; Prime: de A a F).
  const puerto = () => ({ type: "field_dropdown", name: "P", options: function () { return modo === "prime" ? PUERTOS_PRI : PUERTOS_ESS; } });
  const SENTIDOS = [["↻", "1"], ["↺", "-1"]];
  const COLORES_SENSOR = [["rojo", "rojo"], ["verde", "verde"], ["azul", "azul"], ["amarillo", "amarillo"], ["blanco", "blanco"], ["negro", "negro"]];
  const NO_TAPETE = "En el tapete virtual esto no pasa: este bloque solo funciona con el robot de verdad.";
  if (B && !B.Extensions.isRegistered("spk_hat")) B.Extensions.register("spk_hat", function () { this.hat = "cap"; });
  const COLORES_LUZ = [["rojo", "#ff3b3b"], ["verde", "#2fd35a"], ["azul", "#3a8bff"], ["amarillo", "#ffd400"], ["blanco", "#ffffff"], ["apagada", "#444"]];
  const PAISES_SENSOR = ["España", "Portugal", "Francia", "Italia", "Reino Unido", "Alemania", "Chequia", "Austria", "Polonia", "Dinamarca", "Suecia", "Finlandia", "Rumanía", "Grecia", "Turquía", "Ucrania", "Rusia"].map((p) => [p, p]);
  const OPS_VARIABLE = [["=", "="], ["≠", "!="], [">", ">"], ["<", "<"], ["≥", ">="], ["≤", "<="]];
  if (B) {
    B.defineBlocksWithJsonArray([
      // Robot de suelo
      { type: "rob_inicio", message0: "▶ Al pulsar Inicio", nextStatement: null, colour: C.evento, deletable: false },
      { type: "rob_atras", message0: AC ? "⬇️ Atrás" : "↓ Atrás", previousStatement: null, nextStatement: null, colour: C.rob, tooltip: "Retrocede una casilla (15 cm) sin girar." },
      { type: "rob_avanzar", message0: AC ? "⬆️ Adelante" : "↑ Avanzar", previousStatement: null, nextStatement: null, colour: C.rob, tooltip: "Avanza una casilla (15 cm)." },
      { type: "rob_der", message0: AC ? "↪️ Girar" : "↻ Girar a la derecha", previousStatement: null, nextStatement: null, colour: C.giro, tooltip: "Gira 90 grados a la derecha." },
      { type: "rob_izq", message0: AC ? "↩️ Girar" : "↺ Girar a la izquierda", previousStatement: null, nextStatement: null, colour: C.giro, tooltip: "Gira 90 grados a la izquierda." },
      // Iconos (tipo SPIKE Essential)
      { type: "ess_inicio", message0: "%1", args0: [img("bandera")], nextStatement: null, colour: C.evento, deletable: false, tooltip: "Al empezar el programa" },
      { type: "ess_adelante", message0: "%1 %2 cm", args0: [img("adelante"), { type: "field_number", name: "CM", value: 15, min: 1, max: 100 }], previousStatement: null, nextStatement: null, colour: C.mov, tooltip: "Avanzar estos centímetros" },
      { type: "ess_atras", message0: "%1 %2 cm", args0: [img("atras"), { type: "field_number", name: "CM", value: 15, min: 1, max: 100 }], previousStatement: null, nextStatement: null, colour: C.mov, tooltip: "Retroceder estos centímetros" },
      { type: "ess_derecha", message0: "%1 %2°", args0: [img("derecha"), { type: "field_number", name: "G", value: 90, min: 1, max: 360 }], previousStatement: null, nextStatement: null, colour: C.mov, tooltip: "Girar a la derecha estos grados" },
      { type: "ess_izquierda", message0: "%1 %2°", args0: [img("izquierda"), { type: "field_number", name: "G", value: 90, min: 1, max: 360 }], previousStatement: null, nextStatement: null, colour: C.mov, tooltip: "Girar a la izquierda estos grados" },
      { type: "ess_repetir", message0: "%1 %2", args0: [img("repetir"), { type: "field_number", name: "N", value: 2, min: 1, max: 20 }], message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], previousStatement: null, nextStatement: null, colour: C.ctrl, tooltip: "Repetir estas veces" },
      { type: "ess_esperar", message0: "%1 %2 s", args0: [img("reloj"), { type: "field_number", name: "S", value: 1, min: 0, max: 10 }], previousStatement: null, nextStatement: null, colour: C.ctrl, tooltip: "Esperar estos segundos" },
      { type: "ess_luz", message0: "%1 %2", args0: [img("luz"), { type: "field_dropdown", name: "COLOR", options: COLORES_LUZ.map(([n, v]) => [n, v]) }], previousStatement: null, nextStatement: null, colour: C.luz, tooltip: "Encender la luz de este color" },
      { type: "ess_sonido", message0: "%1", args0: [img("sonido")], previousStatement: null, nextStatement: null, colour: C.son, tooltip: "Hacer un sonido" },
      { type: "ess_si_pais", message0: "%1 si el sensor del tapete detecta %2", args0: [img("sensor"), { type: "field_dropdown", name: "PAIS", options: PAISES_SENSOR }], message1: "entonces %1", args1: [{ type: "input_statement", name: "HACER" }], previousStatement: null, nextStatement: null, colour: C.ctrl, tooltip: "Sensor virtual del tapete: comprueba el país de la casilla donde está el robot." },
      // Palabras (tipo SPIKE Prime)
      { type: "pri_inicio", message0: "%1 cuando se inicia el programa", args0: [img("bandera")], nextStatement: null, colour: C.evento, deletable: false },
      { type: "pri_mover", message0: "%1 mover %2 durante %3 %4", args0: [img("coche"), { type: "field_dropdown", name: "SENT", options: [["↑", "adelante"], ["↓", "atras"]] }, { type: "field_number", name: "CANT", value: 15, min: 0, max: 1000 }, { type: "field_dropdown", name: "UNI", options: UNIDADES }], previousStatement: null, nextStatement: null, colour: C.mov, tooltip: "Mueve el robot recto hacia delante o hacia atrás." },
      { type: "pri_empezar", message0: "%1 empezar a mover a %2", args0: [img("coche"), { type: "field_dropdown", name: "SENT", options: [["↑", "adelante"], ["↓", "atras"]] }], previousStatement: null, nextStatement: null, colour: C.mov, tooltip: "El robot se mueve sin parar hasta que llegue un bloque Parar movimiento." },
      { type: "pri_mover_vol", message0: "%1 mover %2 durante %3 %4", args0: [img("coche"), { type: "field_volante", name: "VOL", value: 30 }, { type: "field_number", name: "CANT", value: 15, min: 0, max: 1000 }, { type: "field_dropdown", name: "UNI", options: UNIDADES }], previousStatement: null, nextStatement: null, colour: C.mov, tooltip: "Mueve el robot girando. Toca el valor para usar el volante. derecha: 100 hace girar al robot sobre sí mismo." },
      { type: "pri_empezar_vol", message0: "%1 empezar a mover %2", args0: [img("coche"), { type: "field_volante", name: "VOL", value: 30 }], previousStatement: null, nextStatement: null, colour: C.mov, tooltip: "Empieza a moverse girando con el volante." },
      { type: "pri_parar", message0: "%1 parar movimiento", args0: [img("coche")], previousStatement: null, nextStatement: null, colour: C.mov },
      { type: "pri_velocidad", message0: "%1 fijar velocidad de movimiento al %2 %%", args0: [img("coche"), { type: "field_number", name: "V", value: 50, min: 5, max: 100 }], previousStatement: null, nextStatement: null, colour: C.mov },
      { type: "pri_motores", message0: "%1 fijar %2 como motores en movimiento", args0: [img("coche"), { type: "field_dropdown", name: "M", options: PARES }], previousStatement: null, nextStatement: null, colour: C.mov, tooltip: "Qué motores mueven las ruedas: el primero es el de la izquierda y el segundo el de la derecha." },
      { type: "pri_rotacion", message0: "%1 fijar 1 rotación del motor en %2 cm", args0: [img("coche"), { type: "field_number", name: "CM", value: 17.5, min: 1, max: 50, precision: 0.1 }], previousStatement: null, nextStatement: null, colour: C.mov, tooltip: "Cuántos centímetros avanza el robot por cada vuelta de rueda." },
      { type: "pri_esperar", message0: "esperar %1 segundos", args0: [{ type: "field_number", name: "S", value: 1, min: 0, max: 20 }], previousStatement: null, nextStatement: null, colour: C.ctrl },
      { type: "pri_repetir", message0: "repetir %1", args0: [{ type: "field_number", name: "N", value: 4, min: 1, max: 50 }], message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], previousStatement: null, nextStatement: null, colour: C.ctrl },
      { type: "pri_siempre", message0: "por siempre", message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], previousStatement: null, colour: C.ctrl },
      { type: "pri_si_pais", message0: "%1 si el sensor del tapete detecta %2", args0: [img("sensor"), { type: "field_dropdown", name: "PAIS", options: PAISES_SENSOR }], message1: "entonces %1", args1: [{ type: "input_statement", name: "HACER" }], message2: "si no %1", args2: [{ type: "input_statement", name: "SINO" }], previousStatement: null, nextStatement: null, colour: C.ctrl, tooltip: "Condición basada en el sensor virtual de países del tapete." },
      { type: "pri_variable", message0: "fijar variable %1 a %2", args0: [{ type: "field_input", name: "VAR", text: "pasos" }, { type: "field_number", name: "VAL", value: 0, min: -999, max: 999 }], previousStatement: null, nextStatement: null, colour: C.ctrl, tooltip: "Crea o actualiza una variable numérica." },
      { type: "pri_sumar_variable", message0: "cambiar variable %1 en %2", args0: [{ type: "field_input", name: "VAR", text: "pasos" }, { type: "field_number", name: "VAL", value: 1, min: -999, max: 999 }], previousStatement: null, nextStatement: null, colour: C.ctrl, tooltip: "Suma o resta una cantidad a una variable." },
      { type: "pri_si_variable", message0: "si variable %1 %2 %3", args0: [{ type: "field_input", name: "VAR", text: "pasos" }, { type: "field_dropdown", name: "OP", options: OPS_VARIABLE }, { type: "field_number", name: "VAL", value: 3, min: -999, max: 999 }], message1: "entonces %1", args1: [{ type: "input_statement", name: "HACER" }], previousStatement: null, nextStatement: null, colour: C.ctrl, tooltip: "Ejecuta los bloques solo cuando se cumple la comparación." },
      { type: "pri_escribir", message0: "escribir %1", args0: [{ type: "field_input", name: "T", text: "Hola" }], previousStatement: null, nextStatement: null, colour: C.luz, tooltip: "Muestra el texto en la matriz de luz" },
      { type: "pri_luz", message0: "fijar luz del botón a %1", args0: [{ type: "field_dropdown", name: "COLOR", options: COLORES_LUZ.map(([n, v]) => [n, v]) }], previousStatement: null, nextStatement: null, colour: C.luz },
      { type: "pri_pitido", message0: "pitar %1 durante %2 segundos", args0: [{ type: "field_number", name: "NOTA", value: 60, min: 40, max: 90 }, { type: "field_number", name: "S", value: 0.2, min: 0.05, max: 3, precision: 0.05 }], previousStatement: null, nextStatement: null, colour: C.son },
      // ---- Bloques de la app SPIKE (Essential y Prime) ----
      // Eventos
      { type: "spk_inicio", message0: "%1 cuando se inicia el programa", args0: [img("play")], nextStatement: null, colour: C.evento, extensions: ["spk_hat"] },
      { type: "spk_ev_color", message0: "%1 %2 cuando el color es %3", args0: [img("color"), puerto(), { type: "field_dropdown", name: "COLOR", options: COLORES_SENSOR }], nextStatement: null, colour: C.evento, extensions: ["spk_hat"], tooltip: NO_TAPETE },
      { type: "spk_ev_inclinar", message0: "%1 al inclinarse a %2", args0: [img("hub"), { type: "field_dropdown", name: "D", options: [["↑", "arriba"], ["↓", "abajo"], ["←", "izq"], ["→", "der"]] }], nextStatement: null, colour: C.evento, extensions: ["spk_hat"], tooltip: NO_TAPETE },
      { type: "spk_ev_parte", message0: "%1 cuando la parte %2 apunte hacia arriba", args0: [img("hub"), { type: "field_dropdown", name: "P", options: [["delantera", "delantera"], ["trasera", "trasera"], ["superior", "superior"], ["inferior", "inferior"], ["izquierda", "izquierda"], ["derecha", "derecha"]] }], nextStatement: null, colour: C.evento, extensions: ["spk_hat"], tooltip: NO_TAPETE },
      { type: "spk_ev_agita", message0: "%1 cuando %2", args0: [img("hub"), { type: "field_dropdown", name: "G", options: [["se agita", "agita"], ["se toca", "toca"], ["cae", "cae"]] }], nextStatement: null, colour: C.evento, extensions: ["spk_hat"], tooltip: NO_TAPETE },
      { type: "spk_ev_crono", message0: "cuando el cronómetro > %1", args0: [{ type: "field_number", name: "S", value: 10, min: 0 }], nextStatement: null, colour: C.evento, extensions: ["spk_hat"], tooltip: NO_TAPETE },
      { type: "spk_ev_cuando", message0: "cuando %1", args0: [{ type: "input_value", name: "COND", check: "Boolean" }], nextStatement: null, colour: C.evento, extensions: ["spk_hat"], tooltip: NO_TAPETE },
      { type: "spk_ev_recibir", message0: "al recibir %1", args0: [{ type: "field_input", name: "MSG", text: "mensaje1" }], nextStatement: null, colour: C.evento, extensions: ["spk_hat"], tooltip: "Se ejecuta cuando otro bloque envía este mensaje." },
      { type: "spk_enviar", message0: "enviar %1", args0: [{ type: "field_input", name: "MSG", text: "mensaje1" }], previousStatement: null, nextStatement: null, colour: C.evento },
      { type: "spk_enviar_esperar", message0: "enviar %1 y esperar", args0: [{ type: "field_input", name: "MSG", text: "mensaje1" }], previousStatement: null, nextStatement: null, colour: C.evento },
      // Control
      { type: "spk_si", message0: "si %1 entonces", args0: [{ type: "input_value", name: "COND", check: "Boolean" }], message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], previousStatement: null, nextStatement: null, colour: C.ctrl },
      { type: "spk_si_sino", message0: "si %1 entonces", args0: [{ type: "input_value", name: "COND", check: "Boolean" }], message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], message2: "si no", message3: "%1", args3: [{ type: "input_statement", name: "SINO" }], previousStatement: null, nextStatement: null, colour: C.ctrl },
      { type: "spk_esperar_hasta", message0: "esperar hasta que %1", args0: [{ type: "input_value", name: "COND", check: "Boolean" }], previousStatement: null, nextStatement: null, colour: C.ctrl },
      { type: "spk_repetir_hasta", message0: "repetir hasta que %1", args0: [{ type: "input_value", name: "COND", check: "Boolean" }], message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], previousStatement: null, nextStatement: null, colour: C.ctrl },
      // Motores (A, B… = el motor de esa rueda)
      { type: "spk_m_ir", message0: "%1 %2 ir %3 durante %4 %5", args0: [img("motor"), puerto(), { type: "field_dropdown", name: "DIR", options: SENTIDOS }, { type: "field_number", name: "CANT", value: 1, min: 0, max: 1000 }, { type: "field_dropdown", name: "UNI", options: [["rotaciones", "rot"], ["grados", "gr"], ["segundos", "s"]] }], previousStatement: null, nextStatement: null, colour: C.mot, tooltip: "Mueve solo ese motor. Hacia delante: la rueda izquierda gira ↺ y la derecha ↻." },
      { type: "spk_m_pos", message0: "%1 %2 ir %3 a la posición %4", args0: [img("motor"), puerto(), { type: "field_dropdown", name: "MODO", options: [["por la ruta más corta", "corta"], ["en sentido horario", "horario"], ["en sentido antihorario", "anti"]] }, { type: "field_number", name: "POS", value: 0, min: 0, max: 359 }], previousStatement: null, nextStatement: null, colour: C.mot, tooltip: "Gira el motor hasta esa posición (de 0 a 359 grados)." },
      { type: "spk_m_arrancar", message0: "%1 %2 arrancar motor %3", args0: [img("motor"), puerto(), { type: "field_dropdown", name: "DIR", options: SENTIDOS }], previousStatement: null, nextStatement: null, colour: C.mot, tooltip: "El motor gira sin parar hasta que llegue «parar motor». Usa «esperar» para que el robot avance mientras." },
      { type: "spk_m_parar", message0: "%1 %2 parar motor", args0: [img("motor"), puerto()], previousStatement: null, nextStatement: null, colour: C.mot },
      { type: "spk_m_vel", message0: "%1 %2 fijar velocidad al %3 %%", args0: [img("motor"), puerto(), { type: "field_number", name: "V", value: 75, min: 5, max: 100 }], previousStatement: null, nextStatement: null, colour: C.mot },
      { type: "spk_m_posicion", message0: "%1 %2 posición", args0: [img("motor"), puerto()], output: "Number", colour: C.mot, tooltip: "Posición del motor, de 0 a 359 grados." },
      { type: "spk_m_velocidad", message0: "%1 %2 velocidad", args0: [img("motor"), puerto()], output: "Number", colour: C.mot, tooltip: "Velocidad del motor en % (0 si está parado)." },
      // Movimiento
      { type: "spk_rotacion", message0: "%1 fijar 1 rotación del motor en %2 %3", args0: [img("coche"), { type: "field_number", name: "CM", value: 13.5, min: 1, max: 50, precision: 0.1 }, { type: "field_dropdown", name: "UNI", options: [["cm", "cm"], ["pulgadas", "in"]] }], previousStatement: null, nextStatement: null, colour: C.mov, tooltip: "Cuánto avanza el robot por cada vuelta de rueda." },
      // Sensores y operadores
      { type: "spk_pais", message0: "%1 el sensor del tapete detecta %2", args0: [img("sensor"), { type: "field_dropdown", name: "PAIS", options: PAISES_SENSOR }], output: "Boolean", colour: C.sen, tooltip: "Sensor virtual del tapete: ¿está el robot en una casilla de este país?" },
      { type: "spk_num", message0: "%1", args0: [{ type: "field_number", name: "NUM", value: 0 }], output: "Number", colour: C.ope },
      { type: "spk_cmp", message0: "%1 %2 %3", args0: [{ type: "input_value", name: "A", check: "Number" }, { type: "field_dropdown", name: "OP", options: [[">", ">"], ["<", "<"], ["=", "="]] }, { type: "input_value", name: "B", check: "Number" }], inputsInline: true, output: "Boolean", colour: C.ope }
    ]);
  }

  // Caja de bloques como la de la app SPIKE: Motores, Movimiento, Eventos, Control, Sensores, Operadores…
  function cajaSpike(m) {
    const bl = (t, extra) => Object.assign({ kind: "block", type: t }, extra || {});
    const num = (v) => ({ shadow: { type: "spk_num", fields: { NUM: v } } });
    const pri = m === "prime";
    return { kind: "categoryToolbox", contents: [
      { kind: "category", name: "Motores", colour: C.mot, contents: ["spk_m_ir", "spk_m_pos", "spk_m_arrancar", "spk_m_parar", "spk_m_vel", "spk_m_posicion", "spk_m_velocidad"].map((t) => bl(t)) },
      { kind: "category", name: "Movimiento", colour: C.mov, contents: ["pri_mover", "pri_empezar", "pri_mover_vol", "pri_empezar_vol", "pri_parar", "pri_velocidad"].concat(pri ? ["pri_motores"] : []).map((t) => bl(t)).concat([bl("spk_rotacion", { fields: { CM: pri ? 17.5 : 13.5, UNI: "cm" } })]) },
      { kind: "category", name: "Eventos", colour: C.evento, contents: ["spk_ev_color", "spk_ev_inclinar", "spk_ev_parte", "spk_ev_agita", "spk_ev_crono", "spk_ev_cuando", "spk_ev_recibir", "spk_enviar", "spk_enviar_esperar"].map((t) => bl(t)) },
      { kind: "category", name: "Control", colour: C.ctrl, contents: ["pri_esperar", "pri_repetir", "pri_siempre", "spk_si", "spk_si_sino", "spk_esperar_hasta", "spk_repetir_hasta"].map((t) => bl(t)) },
      { kind: "category", name: "Sensores", colour: C.sen, contents: [bl("spk_pais")] },
      { kind: "category", name: "Operadores", colour: C.ope, contents: [bl("spk_cmp", { inputs: { A: num(0), B: num(50) } })] }
    ].concat(pri ? [{ kind: "category", name: "Variables", colour: "#ff8c1a", contents: ["pri_variable", "pri_sumar_variable", "pri_si_variable"].map((t) => bl(t)) }] : [])
      .concat([
        { kind: "category", name: "Luz", colour: C.luz, contents: (pri ? ["pri_escribir", "pri_luz"] : ["pri_luz"]).map((t) => bl(t)) },
        { kind: "category", name: "Sonido", colour: C.son, contents: [bl("pri_pitido")] }
      ]) };
  }
  const CAJAS = {
    robot: { kind: "flyoutToolbox", contents: (AC ? ["rob_avanzar", "rob_atras", "rob_der", "rob_izq"] : ["rob_avanzar", "rob_der", "rob_izq"]).map((t) => ({ kind: "block", type: t })) },
    essential: AC ? { kind: "flyoutToolbox", contents: ["ess_adelante", "ess_atras", "ess_derecha", "ess_izquierda", "ess_repetir", "ess_esperar", "ess_luz", "ess_sonido"].map((t) => ({ kind: "block", type: t })) } : cajaSpike("essential"),
    prime: cajaSpike("prime")
  };
  const INICIO = { robot: "rob_inicio", essential: AC ? "ess_inicio" : "spk_inicio", prime: "spk_inicio" };

  /* ---------- Leer el programa ---------- */
  function valorDe(b) {
    if (!b) return { t: "num", v: 0 };
    if (b.type === "spk_m_posicion") return { t: "mpos", m: b.getFieldValue("P") };
    if (b.type === "spk_m_velocidad") return { t: "mvel", m: b.getFieldValue("P") };
    return { t: "num", v: +b.getFieldValue("NUM") || 0 };
  }
  function condDe(b) {
    if (!b || !b.isEnabled()) return null;
    if (b.type === "spk_pais") return { t: "pais", pais: b.getFieldValue("PAIS") };
    if (b.type === "spk_cmp") return { t: "cmp", op: b.getFieldValue("OP"), a: valorDe(b.getInputTargetBlock("A")), b: valorDe(b.getInputTargetBlock("B")) };
    return null;
  }
  function cadena(b) {
    const out = [];
    for (; b; b = b.getNextBlock()) {
      if (!b.isEnabled()) continue;
      const id = b.id, f = (n) => b.getFieldValue(n), dentro = (n) => cadena(b.getInputTargetBlock(n));
      switch (b.type) {
        case "rob_avanzar": out.push({ id, t: "mover", cm: 15 }); break;
        case "rob_atras": out.push({ id, t: "mover", cm: -15 }); break;
        case "rob_der": out.push({ id, t: "girar", g: 90 }); break;
        case "rob_izq": out.push({ id, t: "girar", g: -90 }); break;
        case "ess_adelante": out.push({ id, t: "mover", cm: +f("CM") }); break;
        case "ess_atras": out.push({ id, t: "mover", cm: -f("CM") }); break;
        case "ess_derecha": out.push({ id, t: "girar", g: +f("G") }); break;
        case "ess_izquierda": out.push({ id, t: "girar", g: -f("G") }); break;
        case "ess_repetir": case "pri_repetir": out.push({ id, t: "repetir", n: +f("N"), cuerpo: dentro("HACER") }); break;
        case "ess_si_pais": out.push({ id, t: "siPais", pais: f("PAIS"), cuerpo: dentro("HACER"), sino: [] }); break;
        case "pri_si_pais": out.push({ id, t: "siPais", pais: f("PAIS"), cuerpo: dentro("HACER"), sino: dentro("SINO") }); break;
        case "pri_variable": out.push({ id, t: "variable", nombre: String(f("VAR") || "pasos").trim().slice(0, 24), valor: +f("VAL") }); break;
        case "pri_sumar_variable": out.push({ id, t: "sumarVariable", nombre: String(f("VAR") || "pasos").trim().slice(0, 24), valor: +f("VAL") }); break;
        case "pri_si_variable": out.push({ id, t: "siVariable", nombre: String(f("VAR") || "pasos").trim().slice(0, 24), op: f("OP"), valor: +f("VAL"), cuerpo: dentro("HACER") }); break;
        case "ess_esperar": case "pri_esperar": out.push({ id, t: "esperar", s: +f("S") }); break;
        case "ess_luz": case "pri_luz": out.push({ id, t: "luz", color: f("COLOR") }); break;
        case "ess_sonido": out.push({ id, t: "pitido", nota: 72, s: 0.25 }); break;
        case "pri_motores": out.push({ id, t: "motores", par: f("M") }); break;
        case "pri_rotacion": out.push({ id, t: "rotacion", cm: +f("CM") }); break;
        case "pri_velocidad": out.push({ id, t: "velocidad", v: +f("V") }); break;
        case "pri_mover": out.push({ id, t: "conducir", vol: 0, signo: f("SENT") === "atras" ? -1 : 1, cant: +f("CANT"), uni: f("UNI") }); break;
        case "pri_mover_vol": out.push({ id, t: "conducir", vol: +f("VOL"), signo: 1, cant: +f("CANT"), uni: f("UNI") }); break;
        case "pri_empezar": out.push({ id, t: "empezar", vol: 0, signo: f("SENT") === "atras" ? -1 : 1 }); break;
        case "pri_empezar_vol": out.push({ id, t: "empezar", vol: +f("VOL"), signo: 1 }); break;
        case "pri_parar": out.push({ id, t: "parar" }); break;
        case "pri_siempre": out.push({ id, t: "siempre", cuerpo: dentro("HACER") }); break;
        case "pri_escribir": out.push({ id, t: "texto", txt: f("T") }); break;
        case "pri_pitido": out.push({ id, t: "pitido", nota: +f("NOTA"), s: +f("S") }); break;
        case "spk_si": case "spk_si_sino": {
          const c = condDe(b.getInputTargetBlock("COND")), sino = b.type === "spk_si_sino" ? dentro("SINO") : [];
          if (c && c.t === "pais") out.push({ id, t: "siPais", pais: c.pais, cuerpo: dentro("HACER"), sino });
          else out.push({ id, t: "si", cond: c, cuerpo: dentro("HACER"), sino });
          break;
        }
        case "spk_esperar_hasta": out.push({ id, t: "esperarHasta", cond: condDe(b.getInputTargetBlock("COND")) }); break;
        case "spk_repetir_hasta": out.push({ id, t: "repetirHasta", cond: condDe(b.getInputTargetBlock("COND")), cuerpo: dentro("HACER") }); break;
        case "spk_m_ir": out.push({ id, t: "motorIr", m: f("P"), dir: +f("DIR"), cant: +f("CANT"), uni: f("UNI") }); break;
        case "spk_m_pos": out.push({ id, t: "motorPos", m: f("P"), modo: f("MODO"), pos: +f("POS") }); break;
        case "spk_m_arrancar": out.push({ id, t: "motorArr", m: f("P"), dir: +f("DIR") }); break;
        case "spk_m_parar": out.push({ id, t: "motorParar", m: f("P") }); break;
        case "spk_m_vel": out.push({ id, t: "motorVel", m: f("P"), v: +f("V") }); break;
        case "spk_rotacion": out.push({ id, t: "rotacion", cm: f("UNI") === "in" ? +f("CM") * 2.54 : +f("CM") }); break;
        case "spk_enviar": case "spk_enviar_esperar": out.push({ id, t: "enviar", msg: String(f("MSG") || "").trim() }); break;
      }
    }
    return out;
  }

  /* ---------- Estado ---------- */
  let modo = "robot", retoI = 0, reto = null, ws = null;
  let rb = null, metaI = 0, rastro = [], ejecucion = 0, corriendo = false;

  // Pini montada encima, vista desde atrás (la cabeza mira hacia donde va el robot)
  function piniEncima(tam) {
    if (!window.PiniEspalda) return "";
    const url = "data:image/svg+xml;utf8," + encodeURIComponent(window.PiniEspalda({}).replace("<svg ", '<svg width="100" height="106" '));
    return `<image href="${url}" x="${-tam / 2}" y="${-tam / 2}" width="${tam}" height="${tam * 1.06}" transform="rotate(90)"/>`;
  }

  function dibujoRobot() {
    const col = MODOS[modo].color;
    if (modo === "robot") {
      return `<g id="rb-cuerpo"><circle r="34" fill="#ffd23f" stroke="#1b1b1b" stroke-width="3"/>
        <rect x="-20" y="-40" width="26" height="9" rx="3" fill="#1b1b1b"/><rect x="-20" y="31" width="26" height="9" rx="3" fill="#1b1b1b"/>
        <circle cx="24" cy="-12" r="5" fill="#fff" stroke="#1b1b1b" stroke-width="2"/><circle cx="24" cy="12" r="5" fill="#fff" stroke="#1b1b1b" stroke-width="2"/>
        <circle cx="25.5" cy="-12" r="2.2" fill="#1b1b1b"/><circle cx="25.5" cy="12" r="2.2" fill="#1b1b1b"/>
        ${piniEncima(44)}<circle id="rb-luz" cx="-27" cy="0" r="4" fill="${col}"/></g>`;
    }
    // Coche visto desde arriba: mira hacia la derecha (+x). Izquierda del coche = arriba (-y).
    const L = modo === "prime" ? 38 : 32, A = modo === "prime" ? 24 : 21;
    const rueda = (p) => {
      const [fb, lr] = RUEDAS[p];
      const cx = fb * L * 0.62, cy = lr * (A + 6);
      return `<g id="rb-rueda-${p}" class="rb-rueda"><rect x="${cx - 11}" y="${cy - 6}" width="22" height="12" rx="4" fill="#2a2a2a"/>
        <circle cx="${cx}" cy="${cy + lr * 15}" r="7.5" fill="#fff" stroke="#14225a" stroke-width="1.6"/>
        <text x="${cx}" y="${cy + lr * 15 + 3.6}" text-anchor="middle" font-family="DM Mono, monospace" font-size="10" font-weight="700" fill="#14225a">${p}</text></g>`;
    };
    return `<g id="rb-cuerpo">${["A", "B", "C", "D"].map(rueda).join("")}
      <rect x="${-L}" y="${-A}" width="${L * 2}" height="${A * 2}" rx="11" fill="#f4f4f0" stroke="#1b1b1b" stroke-width="2.5"/>
      <rect x="${-L + 6}" y="${-A + 6}" width="${L * 2 - 12}" height="${A * 2 - 12}" rx="7" fill="${col}" opacity=".9"/>
      <path d="M${L - 3} -9 L${L + 11} 0 L${L - 3} 9Z" fill="${col}" stroke="#1b1b1b" stroke-width="2"/>
      ${piniEncima(modo === "prime" ? 50 : 44)}
      <circle id="rb-luz" cx="${-L + 9}" cy="0" r="5" fill="#ffffff" stroke="#1b1b1b" stroke-width="1.5"/></g>`;
  }

  function pintarMetas() {
    $("#rb-metas").innerHTML = reto.metas.map(([cas], k) => {
      const [x, y] = centroDe(cas);
      const ok = k < metaI, act = k === metaI;
      return `<g transform="translate(${x} ${y})" class="${act ? "meta-actual" : ""}"><circle r="22" fill="${ok ? "#2f8f5b" : "#ffffff"}" fill-opacity="${ok ? 0.9 : 0.85}" stroke="${ok ? "#2f8f5b" : "#c8102e"}" stroke-width="4" ${act ? 'stroke-dasharray="7 5"' : ""}/><text y="8" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="22" fill="${ok ? "#fff" : "#c8102e"}">${ok ? "✓" : k + 1}</text></g>`;
    }).join("");
    const [sx, sy] = centroDe(reto.inicio[0]);
    $("#rb-salida").setAttribute("transform", `translate(${sx} ${sy})`);
    $("#rb-lista-metas").innerHTML = reto.metas.map(([cas, pais], k) => `<li class="${k < metaI ? "ok" : k === metaI ? "act" : ""}"><b>${k + 1}</b> ${pais} <span>${cas}</span></li>`).join("");
  }

  function pintarRobot() {
    $("#rb-robot").setAttribute("transform", `translate(${rb.x.toFixed(2)} ${rb.y.toFixed(2)}) rotate(${rb.h.toFixed(2)})`);
    $("#rb-rastro").setAttribute("points", rastro.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" "));
    const c = casillaEn(rb.x, rb.y);
    $("#rb-donde").textContent = c ? `Casilla ${c.nombre}${c.paises.length ? " · " + c.paises.slice(0, 3).join(", ") : " · mar"}` : "Fuera del tapete";
    const luz = document.getElementById("rb-luz"); if (luz) luz.setAttribute("fill", rb.luz);
    document.querySelectorAll(".rb-rueda").forEach((g) => g.classList.toggle("motriz", rb.motores.includes(g.id.slice(-1))));
    const t = $("#rb-texto");
    t.textContent = rb.texto || "";
    t.setAttribute("x", rb.x.toFixed(1)); t.setAttribute("y", (rb.y - 46).toFixed(1));
  }

  function reiniciar() {
    ejecucion++; corriendo = false;
    const [x, y] = centroDe(reto.inicio[0]);
    rb = { x, y, h: DIR_GRADOS[reto.inicio[1]], vel: 50, mov: 0, motores: "AB", rotCm: modo === "essential" ? 13.5 : 17.5, vm: {}, mon: {}, posM: {}, luz: modo === "robot" ? MODOS.robot.color : "#ffffff", texto: "" };
    metaI = 0; rastro = [[x, y]];
    $("#rb-robot").innerHTML = dibujoRobot();
    pintarMetas(); pintarRobot(); aviso(null); botones();
    if (ws) ws.highlightBlock(null);
  }

  function aviso(txt, tipo) {
    const a = $("#rb-aviso");
    if (!txt) { a.hidden = true; return; }
    a.hidden = false; a.className = "aviso " + (tipo || "mal"); a.textContent = txt;
  }
  function botones() { $("#rb-ejecutar").disabled = corriendo; }

  /* ---------- Simulación ---------- */
  class Fin { constructor(tipo, txt) { this.tipo = tipo; this.txt = txt; } }
  const factor = () => +$("#rb-rapidez").value;           // 1 = tiempo real
  const cmPorSeg = () => 4 + rb.vel * 0.36;                // 50 % ≈ 22 cm/s
  const esperarMs = (ms, ctx) => new Promise((res, rej) => setTimeout(() => (ctx.token === ejecucion ? res() : rej(new Fin("cancelado"))), ms));

  function comprobar() {
    if (rb.x < 0 || rb.x > 600 || rb.y < 0 || rb.y > 600) throw new Fin("fallo", "¡El robot se ha salido del tapete! Revisa las distancias y los giros.");
    if (metaI < reto.metas.length) {
      const [mx, my] = centroDe(reto.metas[metaI][0]);
      if (Math.abs(rb.x - mx) <= CASILLA * 0.32 && Math.abs(rb.y - my) <= CASILLA * 0.32) {
        metaI++; pintarMetas();
        if (metaI === reto.metas.length) return true;
      }
    }
    return false;
  }

  // Anima el robot: pose(k) devuelve la posición para k entre 0 y 1
  function animarPose(ctx, pose, ms) {
    return new Promise((res, rej) => {
      const t0 = performance.now();
      let llego = false;
      rastro.push([rb.x, rb.y]);
      function paso(t) {
        if (ctx.token !== ejecucion) return rej(new Fin("cancelado"));
        const k = ms <= 0 ? 1 : Math.min(1, (t - t0) / ms);
        const p = pose(k);
        rb.x = p[0]; rb.y = p[1]; rb.h = p[2];
        rastro.push([rb.x, rb.y]);
        try { if (comprobar()) llego = true; } catch (e) { pintarRobot(); return rej(e); }
        pintarRobot();
        if (k < 1) requestAnimationFrame(paso);
        else llego ? rej(new Fin("victoria")) : res();
      }
      requestAnimationFrame(paso);
    });
  }
  function animar(ctx, dcm, dg, ms) {
    const x0 = rb.x, y0 = rb.y, h0 = rb.h, rad = (h0 * Math.PI) / 180;
    return animarPose(ctx, (k) => [x0 + Math.cos(rad) * dcm * CM * k, y0 + Math.sin(rad) * dcm * CM * k, h0 + dg * k], ms);
  }

  // Robot con dos ruedas motrices (como SPIKE Prime): vol de -100 a 100, signo 1 adelante / -1 atrás
  function velocidadesRuedas(vol, signo) {
    const v = cmPorSeg() * signo;
    let vi = v, vd = v;
    if (vol > 0) vd = v * (1 - vol / 50); else if (vol < 0) vi = v * (1 + vol / 50);
    const par = rb.motores;
    if (!RUEDAS[par[0]] || !RUEDAS[par[1]]) throw new Fin("fallo", `El coche no se mueve: los puertos ${par[0]} y ${par[1]} no tienen ruedas. Usa “fijar A+B como motores en movimiento”.`);
    const ladoI = RUEDAS[par[0]][1], ladoD = RUEDAS[par[1]][1];
    if (ladoI === ladoD) throw new Fin("fallo", `Los motores ${par[0]} y ${par[1]} están en el mismo lado del coche, así que solo da vueltas. Elige uno de cada lado, por ejemplo A+B.`);
    if (ladoI > 0) [vi, vd] = [vd, vi];          // motores cambiados de lado: el giro sale al revés
    return [vi, vd];
  }
  /* ---------- Motores sueltos (bloques «Motores») ----------
     Cada puerto con rueda mueve la rueda de su lado: A y C a la izquierda, B y D a la derecha (Essential: A y B).
     Como en el robot de verdad, los motores de la izquierda van hacia delante girando ↺ y los de la derecha ↻.
     E y F no tienen rueda: solo cambia su posición. */
  const rueda = () => (modo === "essential" ? 13.5 : RUEDA_CM);
  const puertosDe = (m) => String(m || "").split("").filter((p) => "ABCDEF".indexOf(p) >= 0);
  const ladoDe = (p) => (RUEDAS[p] ? RUEDAS[p][1] : 0);
  const velMotor = (p) => (rb.vm[p] == null ? 75 : rb.vm[p]);
  const gradosSeg = (p) => ((4 + velMotor(p) * 0.36) / rueda()) * 360;          // grados por segundo de ese motor
  const haciaDelante = (p, dir) => (ladoDe(p) < 0 ? -dir : dir);               // +1 si la rueda empuja hacia delante
  const enMarcha = () => !!(rb.mov && typeof rb.mov === "object") || Object.keys(rb.mon).length > 0;
  // Avanza «segundos» con lo que esté en marcha (movimiento + motores arrancados) y los motores extra {puerto: sentido}.
  function avanzar(ctx, segundos, extra) {
    const lados = {}, ritmo = {};
    if (rb.mov && typeof rb.mov === "object") {
      const [vi, vd] = velocidadesRuedas(rb.mov.vol, rb.mov.signo);
      lados[-1] = vi; lados[1] = vd;
      const par = rb.motores.split("");
      par.forEach((p) => { const l = ladoDe(p); if (l) ritmo[p] = (l < 0 ? -lados[l] : lados[l]) / rueda() * 360; });
    }
    const mot = Object.assign({}, rb.mon, extra || {});
    Object.keys(mot).forEach((p) => {
      const dps = mot[p] * gradosSeg(p), l = ladoDe(p);
      ritmo[p] = dps;
      if (l) lados[l] = haciaDelante(p, mot[p]) * (4 + velMotor(p) * 0.36);
    });
    const vi = lados[-1] || 0, vd = lados[1] || 0;
    return ruedas(ctx, vi, vd, segundos).then(() => { Object.keys(ritmo).forEach((p) => { rb.posM[p] = (rb.posM[p] || 0) + ritmo[p] * segundos; }); });
  }
  async function motorIr(ctx, b) {
    const ps = puertosDe(b.m); if (!ps.length || !(b.cant > 0)) return;
    const extra = {}; ps.forEach((p) => (extra[p] = b.dir));
    const s = b.uni === "s" ? b.cant : Math.max(...ps.map((p) => (b.uni === "rot" ? b.cant * 360 : b.cant) / gradosSeg(p)));
    await avanzar(ctx, s, extra);
  }
  async function motorPos(ctx, b) {
    const obj = ((Math.round(b.pos) % 360) + 360) % 360;
    for (const p of puertosDe(b.m)) {
      const ahora = (((rb.posM[p] || 0) % 360) + 360) % 360;
      const hor = (obj - ahora + 360) % 360, anti = hor ? hor - 360 : 0;
      const g = b.modo === "horario" ? hor : b.modo === "anti" ? anti : (hor <= 180 ? hor : anti);
      if (Math.abs(g) < 0.5) continue;
      await avanzar(ctx, Math.abs(g) / gradosSeg(p), { [p]: Math.sign(g) });
      rb.posM[p] = obj;
    }
  }
  function valor(v) {
    if (v.t === "mpos") { const p = puertosDe(v.m)[0]; return Math.round((((rb.posM[p] || 0) % 360) + 360) % 360); }
    if (v.t === "mvel") { const p = puertosDe(v.m)[0]; return rb.mon[p] ? rb.mon[p] * velMotor(p) : 0; }
    return v.v;
  }
  function cumple(c) {
    if (!c) return false;
    if (c.t === "pais") { const a = casillaEn(rb.x, rb.y); return !!(a && Array.isArray(a.paises) && a.paises.indexOf(c.pais) >= 0); }
    if (c.t === "cmp") { const x = valor(c.a), y = valor(c.b); return c.op === ">" ? x > y : c.op === "<" ? x < y : Math.round(x) === Math.round(y); }
    return false;
  }
  function conducir(ctx, vol, signo, segundos) {
    const [vi, vd] = velocidadesRuedas(vol, signo);
    const par = rb.motores.split(""), ritmo = {};
    par.forEach((p) => { const l = ladoDe(p); if (l) ritmo[p] = (l < 0 ? -vi : vd) / rueda() * 360; });
    return ruedas(ctx, vi, vd, segundos).then(() => { Object.keys(ritmo).forEach((p) => { rb.posM[p] = (rb.posM[p] || 0) + ritmo[p] * segundos; }); });
  }
  function ruedas(ctx, vi, vd, segundos) {
    const u = (vi + vd) / 2, w = (vi - vd) / EJE_CM;  // cm/s y rad/s (positivo = a la derecha)
    const x0 = rb.x, y0 = rb.y, h0 = (rb.h * Math.PI) / 180;
    return animarPose(ctx, (k) => {
      const t = segundos * k, h = h0 + w * t;
      let x, y;
      if (Math.abs(w) < 1e-6) { x = x0 + u * t * Math.cos(h0) * CM; y = y0 + u * t * Math.sin(h0) * CM; }
      else { x = x0 + (u / w) * (Math.sin(h) - Math.sin(h0)) * CM; y = y0 - (u / w) * (Math.cos(h) - Math.cos(h0)) * CM; }
      return [x, y, (h * 180) / Math.PI];
    }, (segundos * 1000) / factor());
  }
  // Tiempo que tarda la rueda más rápida en recorrer la cantidad pedida
  function segundosPara(cant, uni) {
    if (uni === "s") return cant;
    let cmReales;
    if (uni === "rot") cmReales = cant * rueda();
    else if (uni === "gr") cmReales = (cant / 360) * rueda();
    else { const cm = uni === "in" ? cant * 2.54 : cant; cmReales = (cm / rb.rotCm) * rueda(); }
    return cmReales / cmPorSeg();
  }

  let audio = null;
  function pitar(nota, s) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = 440 * Math.pow(2, (nota - 69) / 12);
      g.gain.value = 0.08; o.connect(g); g.connect(audio.destination);
      o.start(); o.stop(audio.currentTime + s);
    } catch (e) { /* sin sonido */ }
  }

  async function correr(lista, ctx) {
    for (const b of lista) {
      if (ctx.token !== ejecucion) throw new Fin("cancelado");
      if (++ctx.pasos > 2000) throw new Fin("fallo", "El programa es demasiado largo.");
      ws && ws.highlightBlock(b.id);
      const f = factor();
      switch (b.t) {
        case "repetir": for (let i = 0; i < b.n; i++) await correr(b.cuerpo, ctx); break;
        case "siPais": {
          const actual = casillaEn(rb.x, rb.y), detectado = !!(actual && Array.isArray(actual.paises) && actual.paises.indexOf(b.pais) >= 0);
          await correr(detectado ? b.cuerpo : b.sino, ctx); break;
        }
        case "variable": ctx.variables[b.nombre] = b.valor; break;
        case "sumarVariable": ctx.variables[b.nombre] = (Number(ctx.variables[b.nombre]) || 0) + b.valor; break;
        case "siVariable": {
          const actual = Number(ctx.variables[b.nombre]) || 0, v = Number(b.valor);
          const ok = b.op === "=" ? actual === v : b.op === "!=" ? actual !== v : b.op === ">" ? actual > v : b.op === "<" ? actual < v : b.op === ">=" ? actual >= v : actual <= v;
          if (ok) await correr(b.cuerpo, ctx); break;
        }
        case "siempre":
          for (let i = 0; i < 200; i++) { const p = ctx.pasos; await correr(b.cuerpo, ctx); if (ctx.pasos === p) break; }
          throw new Fin("fallo", "El bucle Por siempre no termina nunca. Prueba con Repetir.");
        case "mover": await animar(ctx, b.cm, 0, (Math.abs(b.cm) / cmPorSeg()) * 1000 / f); break;
        case "moverTiempo": await animar(ctx, b.signo * cmPorSeg() * b.s, 0, (b.s * 1000) / f); break;
        case "girar": await animar(ctx, 0, b.g, (Math.abs(b.g) / 180) * 1000 / f); break;
        case "si": await correr(cumple(b.cond) ? b.cuerpo : b.sino, ctx); break;
        case "esperarHasta": {
          if (!b.cond) throw new Fin("fallo", "Al bloque «esperar hasta que» le falta la condición (un bloque de Sensores u Operadores).");
          let t = 0;
          while (!cumple(b.cond)) {
            if (!enMarcha()) throw new Fin("fallo", "El robot está parado y la condición no se cumple: se quedaría esperando siempre. Arranca antes el movimiento o un motor.");
            if ((t += 0.1) > 120) throw new Fin("fallo", "Ha esperado más de dos minutos y la condición no se cumple.");
            await avanzar(ctx, 0.1);
          }
          break;
        }
        case "repetirHasta": {
          if (!b.cond) throw new Fin("fallo", "Al bloque «repetir hasta que» le falta la condición (un bloque de Sensores u Operadores).");
          let n = 0;
          while (!cumple(b.cond)) {
            const p = ctx.pasos; await correr(b.cuerpo, ctx);
            if (++n > 300 || (ctx.pasos === p && !enMarcha())) throw new Fin("fallo", "El bucle «repetir hasta que» no termina nunca: la condición no llega a cumplirse.");
            if (ctx.pasos === p) await avanzar(ctx, 0.1);
          }
          break;
        }
        case "enviar": {
          const lista = ctx.mensajes[b.msg];
          if (lista && lista.length) { if (++ctx.prof > 20) throw new Fin("fallo", "Los mensajes se llaman unos a otros sin parar."); await correr(lista, ctx); ctx.prof--; }
          break;
        }
        case "motorIr": await motorIr(ctx, b); break;
        case "motorPos": await motorPos(ctx, b); break;
        case "motorArr": puertosDe(b.m).forEach((p) => (rb.mon[p] = b.dir)); break;
        case "motorParar": puertosDe(b.m).forEach((p) => delete rb.mon[p]); break;
        case "motorVel": puertosDe(b.m).forEach((p) => (rb.vm[p] = Math.max(5, Math.min(100, b.v)))); break;
        case "esperar":
          if (Object.keys(rb.mon).length) await avanzar(ctx, b.s);
          else if (rb.mov && typeof rb.mov === "object") await conducir(ctx, rb.mov.vol, rb.mov.signo, b.s);
          else if (rb.mov) await animar(ctx, rb.mov * cmPorSeg() * b.s, 0, (b.s * 1000) / f);
          else await esperarMs((b.s * 1000) / f, ctx);
          break;
        case "empezar": velocidadesRuedas(b.vol, b.signo); rb.mov = { vol: b.vol, signo: b.signo }; break;
        case "parar": rb.mov = 0; break;
        case "conducir": await conducir(ctx, b.vol, b.signo, segundosPara(b.cant, b.uni)); break;
        case "motores": rb.motores = b.par; pintarRobot(); break;
        case "rotacion": rb.rotCm = b.cm; break;
        case "velocidad": rb.vel = Math.max(5, Math.min(100, b.v)); break;
        case "luz": rb.luz = b.color; pintarRobot(); await esperarMs(150 / f, ctx); break;
        case "texto": rb.texto = String(b.txt).slice(0, 12); pintarRobot(); await esperarMs(400 / f, ctx); break;
        case "pitido": pitar(b.nota, b.s); await esperarMs((b.s * 1000) / f, ctx); break;
        default: break;
      }
      if (b.t !== "mover" && b.t !== "girar" && modo === "robot") await esperarMs(0, ctx);
      if (modo === "robot" && (b.t === "mover" || b.t === "girar")) await esperarMs(120 / f, ctx);
    }
  }

  let intentos = 0;
  function textoProg(l) {
    return l.map((b) => {
      let t = b.t + (b.cm ? " " + Math.round(b.cm) + "cm" : b.g ? " " + b.g + "°" : b.vol !== undefined ? ` vol ${b.vol} ${b.cant || ""}${b.uni || ""}` : b.pais ? " " + b.pais : b.nombre ? " " + b.nombre + (b.valor !== undefined ? "=" + b.valor : "") : "");
      if (b.cuerpo) t += ` [${textoProg(b.cuerpo)}]`;
      if (b.sino && b.sino.length) t += ` [si no: ${textoProg(b.sino)}]`;
      return t;
    }).join(", ");
  }
  const contarB = (l) => l.reduce((n, b) => n + 1 + (b.cuerpo ? contarB(b.cuerpo) : 0) + (b.sino ? contarB(b.sino) : 0), 0);
  function tieneCaracteristica(lista, tipo) {
    return lista.some((b) => {
      if (tipo === "repetir" && b.t === "repetirHasta") return true;
      const propio = tipo === "variable" ? (b.t === "variable" || b.t === "sumarVariable") : b.t === tipo;
      return propio || (b.cuerpo && tieneCaracteristica(b.cuerpo, tipo)) || (b.sino && tieneCaracteristica(b.sino, tipo));
    });
  }
  const NOMBRES_CARACTERISTICA = { repetir: "un bucle Repetir", siPais: "una condición con el sensor del tapete", variable: "una variable", siVariable: "una condición que compare una variable" };
  const VAL = () => window.Valoraciones;
  const indicadorReto = (m, i) => (VAL() ? VAL().indicador("rob", [m, i]) : null);
  function valorar(completado, prog, notaRuta) {
    if (!VAL()) return null;
    const ind = indicadorReto(modo, retoI) || {};
    const nota = Number.isFinite(notaRuta) ? notaRuta : VAL().nota({ completado, parcial: metaI > 0, intentos });
    const r = VAL().registrar(`rob-${modo}-${retoI}`, { nota, intentos, bloques: contarB(prog), codigo: ind.codigo || "", pantalla: "Robótica", actividad: `${MODOS[modo].nombre} · ${reto.titulo}` }, Number.isFinite(notaRuta));
    return Object.assign({}, r, { codigo: ind.codigo, nota: Number.isFinite(notaRuta) ? r.nota : Math.max(nota, r.nota) });
  }
  function enviarResultado(prog, val) {
    const R = window.REGISTRO || {};
    if (!R.url) return;
    let alumno = {};
    try { alumno = (JSON.parse(localStorage.getItem("rumbo-a-europa-v1") || "{}") || {}).alumno || {}; } catch (e) {}
    const datos = {
      fecha: new Date().toISOString(), nombre: alumno.nombre || "(sin nombre)", usuario: alumno.usuario || "", clase: alumno.clase || "",
      destino: `Robótica · ${MODOS[modo].nombre} · reto ${retoI + 1}`, ciudad: reto.titulo, estrellas: "",
      bloques: contarB(prog), intentos, personaje: MODOS[modo].nombre, programa: textoProg(prog),
      indicador: val ? val.codigo || "" : "", valoracion: val ? val.nota : ""
    };
    if (window.Acceso) {
      if (window.Acceso.requiere() && !window.Acceso.token()) { window.Acceso.avisar(); return; }
      Object.assign(datos, window.Acceso.datosEnvio());
    }
    try { fetch(R.url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(datos) }).catch(() => {}); } catch (e) {}
  }

  async function ejecutar() {
    if (corriendo || !ws) return;
    intentos++;
    const ini = ws.getTopBlocks(false).find((b) => b.type === INICIO[modo]);
    const prog = ini ? cadena(ini.getNextBlock()) : [];
    reiniciar();
    if (!prog.length) { aviso("El programa está vacío. Engancha bloques debajo del bloque de inicio.", "info"); return; }
    const exigidas = (reto.exige && reto.exige[modo]) || [];
    const faltan = exigidas.filter((tipo) => !tieneCaracteristica(prog, tipo));
    if (faltan.length) { aviso("Para superar este reto necesitas incluir " + faltan.map((x) => NOMBRES_CARACTERISTICA[x] || x).join(" y ") + ".", "info"); return; }
    // «al recibir»: cada mensaje guarda su lista de bloques; «enviar» la ejecuta.
    const mensajes = Object.create(null);
    ws.getTopBlocks(false).filter((b) => b.type === "spk_ev_recibir" && b.isEnabled()).forEach((b) => { const k = String(b.getFieldValue("MSG") || "").trim(); mensajes[k] = (mensajes[k] || []).concat(cadena(b.getNextBlock())); });
    const ctx = { token: ++ejecucion, pasos: 0, prof: 0, mensajes, variables: Object.create(null) };
    corriendo = true; botones();
    try {
      await correr(prog, ctx);
      corriendo = false; botones(); ws.highlightBlock(null);
      valorar(false, prog);
      aviso(metaI ? `Has visitado ${metaI} de ${reto.metas.length}. Te falta llegar a ${reto.metas[metaI][1]} (${reto.metas[metaI][0]}).` : `Todavía no has llegado a ${reto.metas[0][1]} (${reto.metas[0][0]}).`, "info");
    } catch (e) {
      if (!(e instanceof Fin)) throw e;
      if (e.tipo === "cancelado") return;
      corriendo = false; botones(); ws.highlightBlock(null);
      if (e.tipo === "victoria") return victoria(prog);
      valorar(false, prog);
      aviso(e.txt);
    }
  }

  async function victoria(prog) {
    const cadena = !AC && window.RetosCadena ? await window.RetosCadena.completar(`robot-${modo}`, retoI, RETOS.length) : null;
    const val = valorar(true, prog, cadena && cadena.ok && Number.isFinite(cadena.nota) ? cadena.nota : null);
    enviarResultado(prog, val);
    hechos[modo] = hechos[modo] || {}; hechos[modo][retoI] = true; guardar();
    const sig = retoI + 1 < RETOS.length;
    // Modalidad terminada: autoevaluación obligatoria (la piden también antes de empezar otra modalidad u otro rincón).
    if (!AC && window.Autoeval && RETOS.every((r, k) => hechos[modo][k] || (window.RetosCadena && window.RetosCadena.hecho && window.RetosCadena.hecho(`robot-${modo}`, k))))
      setTimeout(() => window.Autoeval.asegurar(window.Autoeval.etapaRobotica(modo)), 1200);
    $("#rb-ventana").innerHTML = `<h2>¡Reto conseguido!</h2><p>${reto.titulo}: el robot ha visitado ${reto.metas.map((m) => m[1]).join(", ")}.</p>
      ${val && val.codigo ? `<p class="val-ind">Indicador ${val.codigo}: <b>${val.nota} de 5</b></p>` : ""}
      ${cadena && cadena.ok && Number.isFinite(cadena.nota) ? `<p class="val-ind">Valoración de ${MODOS[modo].nombre}: <b>${cadena.completados} de ${cadena.total} pantallas · ${cadena.nota} de ${cadena.maximo}</b></p>` : ""}
      ${cadena && cadena.ok && cadena.codigo && !sig ? `<div class="codigo-desbloqueo"><p>🔐 <b>Código final de ${MODOS[modo].nombre}</b></p><strong>${cadena.codigo}</strong><p>Guárdalo: acredita que has terminado los ${RETOS.length} retos de ${MODOS[modo].nombre}.</p></div>` : cadena && !cadena.ok ? `<p class="aviso">${cadena.error || "No se ha podido generar el código."}</p>` : ""}
      <p class="pista">Ahora prueba el mismo programa con el robot de verdad sobre el tapete.</p>
      ${!sig && window.XLSX ? `<p><button class="btn sec" id="rbv-excel">Descargar mi valoración (Excel)</button></p>` : ""}
      <div class="acciones"><button class="btn sec" id="rbv-otra">Repetir</button>${sig ? `<button class="btn" id="rbv-sig">Siguiente reto</button>` : `<button class="btn" id="rbv-menu">Elegir otro nivel</button>`}</div>`;
    $("#rb-velo").hidden = false;
    const cerrar = () => ($("#rb-velo").hidden = true);
    $("#rbv-otra").onclick = () => { cerrar(); reiniciar(); };
    const s = $("#rbv-sig"); if (s) s.onclick = () => { cerrar(); location.hash = `robotica-${modo}-${retoI + 2}`; };
    const vx = $("#rbv-excel"); if (vx) vx.onclick = () => VAL() && VAL().excel();
    const m = $("#rbv-menu"); if (m) m.onclick = () => { cerrar(); location.hash = "robotica"; };
  }

  /* ---------- Pantallas ---------- */
  function pintarMenu() {
    $("#rb-modos").innerHTML = Object.keys(MODOS).map((k) => {
      const m = MODOS[k];
      const n = RETOS.filter((_, i) => hecho(k, i)).length;
      return `<div class="modo" style="--modo:${m.color}">
        <div class="modo-cab"><h3>${m.nombre}</h3><span>${m.sub}</span></div>
        <p>${m.texto}</p>
        <ol class="retos">${RETOS.map((r, i) => `<li><a href="#robotica-${k}-${i + 1}" class="${hecho(k, i) ? "ok" : ""}"><b>${i + 1}</b>${r.titulo}${hecho(k, i) ? " ✓" : ""}${indicadorReto(k, i) ? `<span class="ind-mini">Ind. ${indicadorReto(k, i).codigo}</span>` : ""}</a></li>`).join("")}</ol>
        <small>${n} de ${RETOS.length} retos</small></div>`;
    }).join("");
  }

  async function abrirReto(m, i) {
    if (!AC && window.RetosCadena && !(await window.RetosCadena.entrar(`robot-${m}`, i, RETOS.length))) { location.hash = "robotica"; return; }
    // Para empezar otra modalidad hay que autoevaluar antes las modalidades terminadas.
    if (!AC && i === 0 && window.Autoeval && !(await window.Autoeval.revisar((x) => x.id === "rob" && x.modo !== m))) { location.hash = "robotica"; return; }
    modo = m; retoI = i; reto = RETOS[i]; intentos = 0;
    $("#rb-menu").hidden = true; $("#rb-juego").hidden = false;
    $("#rb-titulo").textContent = reto.titulo;
    $("#rb-modo").textContent = `${MODOS[m].nombre} · Reto ${i + 1} de ${RETOS.length}`;
    const exigidas = (reto.exige && reto.exige[m]) || [];
    const ayudaModalidad = exigidas.length ? ` En esta modalidad incluye ${exigidas.map((x) => NOMBRES_CARACTERISTICA[x] || x).join(" y ")}.` : "";
    $("#rb-texto-reto").textContent = reto.texto + ayudaModalidad + ` Sale de ${reto.inicio[0]} mirando hacia ${{ E: "la derecha", O: "la izquierda", N: "arriba", S: "abajo" }[reto.inicio[1]]}.`;
    const ind = indicadorReto(m, i), el = $("#rb-indicador");
    el.hidden = !ind; if (ind) el.innerHTML = `<b>Indicador ${ind.codigo}</b> ${ind.texto}`;
    $("#rb-ayuda").textContent = m === "robot" ? "Cada Avanzar es una casilla (15 cm)." : m === "essential" ? (AC ? "Una casilla mide 15 × 15 cm. Para girar una esquina, 90 grados." : "Una casilla son 15 cm y una rotación, 13,5 cm. El motor A es la rueda izquierda y el B la derecha: hacia delante, A gira ↺ y B gira ↻. Para girar 90° sin avanzar: mover derecha: 100 durante 180 grados.") : "Una casilla son 15 cm. Para girar 90° sin avanzar: mover derecha: 100 durante 180 grados. Las ruedas del coche son A y B (detrás) y C y D (delante): las de la izquierda van hacia delante girando ↺ y las de la derecha ↻.";
    if (ws) { ws.dispose(); ws = null; }
    if (B) {
      ws = B.inject($("#rb-blockly"), {
        toolbox: CAJAS[m], renderer: "zelos", media: "js/vendor/media/", trashcan: true, sounds: false,
        zoom: { controls: true, wheel: false, startScale: window.innerWidth < 600 ? 0.65 : 0.85 },
        move: { scrollbars: true, drag: true, wheel: true },
        theme: B.Theme.defineTheme("robotica", { base: B.Themes.Classic, fontStyle: { family: "Nunito, sans-serif", weight: "800", size: 13 }, componentStyles: { workspaceBackgroundColour: "#f6f8f7", flyoutBackgroundColour: "#e1e8e4", toolboxBackgroundColour: "#14225a", toolboxForegroundColour: "#ffffff", flyoutOpacity: 1 } })
      });
      const ini = ws.newBlock(INICIO[m]); ini.initSvg(); ini.render(); ini.moveBy(30, 20); ini.setDeletable(false);
      ws.addChangeListener(B.Events.disableOrphans);
    }
    reiniciar();
    window.scrollTo(0, 0);
  }

  async function ruta(hash) {
    $("#robotica").hidden = false;
    const m = /^#robotica-(robot|essential|prime)-(\d+)$/.exec(hash);
    if (m && MODOS[m[1]] && +m[2] >= 1 && +m[2] <= RETOS.length) return abrirReto(m[1], +m[2] - 1);
    ejecucion++; corriendo = false;
    $("#rb-juego").hidden = true; $("#rb-menu").hidden = false;
    pintarMenu();
  }
  function ocultar() { ejecucion++; corriendo = false; $("#robotica").hidden = true; }

  function iniciar() {
    if (VAL()) {
      VAL().definirActividades("rob", [].concat(...Object.keys(MODOS).map((k) => RETOS.map((r, i) => ({ clave: `rob-${k}-${i}`, pantalla: "Robótica", actividad: `${MODOS[k].nombre} · ${r.titulo}`, destino: `Robótica · ${MODOS[k].nombre} · reto ${i + 1}`, ciudad: r.titulo, personaje: MODOS[k].nombre, tipo: "rob", ref: [k, i] })))));
      const n = $("#rb-in-nombre"), c = $("#rb-in-clase"), u = $("#rb-in-usuario");
      const cargar = () => { const a = VAL().alumno(); n.value = a.nombre || ""; c.value = a.clase || ""; u.value = a.usuario || ""; };
      cargar();
      const cambiar = () => VAL().ponerAlumno(n.value, c.value, u.value);
      n.addEventListener("input", cambiar); c.addEventListener("input", cambiar); u.addEventListener("input", cambiar);
      window.addEventListener("alumno-cambiado", () => { if ($("#robotica").hidden) cargar(); });
      c.addEventListener("change", pintarMenu);
      window.addEventListener("alumno-cambiado-prog", cargar);
      $("#rb-form-alumno").addEventListener("submit", (e) => e.preventDefault());
      if (window.ListaAlumnos) window.ListaAlumnos.montar(n, c, u);
      if (window.Acceso) window.Acceso.montar($("#rb-form-alumno"), { clase: c, nombre: n, usuario: u });
      $("#rb-btn-excel").onclick = () => VAL().excel();
    }
    $("#rb-mapa").src = MAPA_URL;
    $("#rb-ejecutar").onclick = ejecutar;
    $("#rb-reiniciar").onclick = reiniciar;
    $("#rb-borrar").onclick = () => {
      if (!ws) return;
      ws.getTopBlocks(false).forEach((b) => { if (b.type !== INICIO[modo]) b.dispose(false); });
      const ini = ws.getTopBlocks(false).find((b) => b.type === INICIO[modo]);
      if (ini && ini.getNextBlock()) ini.getNextBlock().dispose(false);
      reiniciar();
    };
    $("#rb-velo").addEventListener("click", (e) => { if (e.target.id === "rb-velo") $("#rb-velo").hidden = true; });
  }

  iniciar();
  window.Robotica = { ruta, ocultar, RETOS, MODOS, get ws() { return ws; } };
})();
