/*
  EDITOR DE BLOQUES (arrastrar y encajar)
  Usa Blockly (Google, licencia Apache 2.0) que está en js/vendor/.
  Si Blockly no carga, el juego usa el editor sencillo de "tocar para añadir".
*/
(function () {
  "use strict";
  if (!window.Blockly) return;
  const B = window.Blockly;

  const COLORES = {
    inicio: "#14225a", avanzar: "#3a7bd5", girar: "#8a4fd8", saltar: "#e07a1f",
    repetir: "#2f8f5b", si: "#c2477a", hasta: "#0f7c8c"
  };
  const CONDS = [
    ["hay algo que saltar delante", "salto"],
    ["hay camino delante", "camino"],
    ["hay camino a la izquierda", "izq"],
    ["hay camino a la derecha", "der"]
  ];

  B.defineBlocksWithJsonArray([
    { type: "rae_inicio", message0: "▶ Al empezar", nextStatement: null, colour: COLORES.inicio, tooltip: "Tu programa empieza aquí. Engancha los bloques debajo.", deletable: false },
    { type: "rae_avanzar", message0: "↑ Avanzar", previousStatement: null, nextStatement: null, colour: COLORES.avanzar, tooltip: "Da un paso hacia delante." },
    { type: "rae_girar", message0: "Girar a la %1", args0: [{ type: "field_dropdown", name: "DIR", options: [["izquierda ↺", "izq"], ["derecha ↻", "der"]] }], previousStatement: null, nextStatement: null, colour: COLORES.girar, tooltip: "Gira sin moverte." },
    { type: "rae_saltar", message0: "⤴ Saltar", previousStatement: null, nextStatement: null, colour: COLORES.saltar, tooltip: "Salta por encima de una maleta o de un canal." },
    { type: "rae_repetir", message0: "Repetir %1 veces", args0: [{ type: "field_number", name: "N", value: 3, min: 1, max: 20, precision: 1 }], message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], previousStatement: null, nextStatement: null, colour: COLORES.repetir, tooltip: "Repite los bloques de dentro." },
    { type: "rae_si", message0: "Si %1", args0: [{ type: "field_dropdown", name: "COND", options: CONDS }], message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], previousStatement: null, nextStatement: null, colour: COLORES.si, tooltip: "Hace lo de dentro solo si se cumple." },
    { type: "rae_si_sino", message0: "Si %1", args0: [{ type: "field_dropdown", name: "COND", options: CONDS }], message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], message2: "si no %1", args2: [{ type: "input_statement", name: "SINO" }], previousStatement: null, nextStatement: null, colour: COLORES.si, tooltip: "Si se cumple hace lo primero; si no, lo segundo." },
    { type: "rae_hasta", message0: "⚑ Repetir hasta llegar a la bandera", message1: "%1", args1: [{ type: "input_statement", name: "HACER" }], previousStatement: null, colour: COLORES.hasta, tooltip: "Repite lo de dentro hasta que llegas a la bandera." }
  ]);

  // Qué bloques salen en la caja según los bloques que permite el nivel
  function caja(permitidos) {
    const c = [];
    const tiene = (t) => permitidos.includes(t);
    if (tiene("avanzar")) c.push({ kind: "block", type: "rae_avanzar" });
    if (tiene("izq")) c.push({ kind: "block", type: "rae_girar", fields: { DIR: "izq" } });
    if (tiene("der")) c.push({ kind: "block", type: "rae_girar", fields: { DIR: "der" } });
    if (tiene("saltar")) c.push({ kind: "block", type: "rae_saltar" });
    if (tiene("repetir")) c.push({ kind: "block", type: "rae_repetir" });
    if (tiene("si")) { c.push({ kind: "block", type: "rae_si" }); c.push({ kind: "block", type: "rae_si_sino" }); }
    if (tiene("hasta")) c.push({ kind: "block", type: "rae_hasta" });
    return { kind: "flyoutToolbox", contents: c };
  }

  const tema = B.Theme.defineTheme("rumbo", {
    base: B.Themes.Classic,
    fontStyle: { family: "Nunito, 'Segoe UI', sans-serif", weight: "800", size: 13 },
    componentStyles: {
      workspaceBackgroundColour: "#f6f8f7",
      flyoutBackgroundColour: "#e1e8e4",
      flyoutOpacity: 1,
      scrollbarColour: "#c7d1cc",
      insertionMarkerColour: "#14225a",
      insertionMarkerOpacity: 0.3
    }
  });

  let ws = null, alCambiar = null;

  function iniciar(div, permitidos, cambio) {
    if (ws) ws.dispose();
    alCambiar = cambio;
    ws = B.inject(div, {
      toolbox: caja(permitidos),
      media: "js/vendor/media/",
      renderer: "zelos",
      theme: tema,
      trashcan: true,
      sounds: false,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: false, startScale: window.innerWidth < 600 ? 0.65 : 0.85, maxScale: 1.4, minScale: 0.5 },
      grid: { spacing: 24, length: 2, colour: "#dfe6e2", snap: false }
    });
    const ini = ws.newBlock("rae_inicio");
    ini.initSvg(); ini.render(); ini.moveBy(20, 20);
    ini.setDeletable(false);
    ws.addChangeListener(B.Events.disableOrphans);
    ws.addChangeListener((e) => { if (!e.isUiEvent && alCambiar) alCambiar(); });
    return ws;
  }

  function inicio() { return ws && ws.getTopBlocks(false).find((b) => b.type === "rae_inicio"); }

  // Convierte los bloques encajados en el árbol que entiende el juego
  function cadena(b) {
    const out = [];
    for (; b; b = b.getNextBlock()) {
      if (!b.isEnabled()) continue;
      const id = b.id;
      switch (b.type) {
        case "rae_avanzar": out.push({ id, t: "avanzar" }); break;
        case "rae_saltar": out.push({ id, t: "saltar" }); break;
        case "rae_girar": out.push({ id, t: b.getFieldValue("DIR") }); break;
        case "rae_repetir": out.push({ id, t: "repetir", n: +b.getFieldValue("N") || 1, cuerpo: cadena(b.getInputTargetBlock("HACER")) }); break;
        case "rae_si": out.push({ id, t: "si", cond: b.getFieldValue("COND"), cuerpo: cadena(b.getInputTargetBlock("HACER")) }); break;
        case "rae_si_sino": out.push({ id, t: "si", cond: b.getFieldValue("COND"), cuerpo: cadena(b.getInputTargetBlock("HACER")), sino: cadena(b.getInputTargetBlock("SINO")) }); break;
        case "rae_hasta": out.push({ id, t: "hasta", cuerpo: cadena(b.getInputTargetBlock("HACER")) }); break;
      }
    }
    return out;
  }

  function leer() { const i = inicio(); return i ? cadena(i.getNextBlock()) : []; }
  function resaltar(id) { if (ws) ws.highlightBlock(id || null); }
  function borrar() {
    if (!ws) return;
    ws.getTopBlocks(false).forEach((b) => { if (b.type !== "rae_inicio") b.dispose(false); });
    const i = inicio(); if (i && i.getNextBlock()) i.getNextBlock().dispose(false);
  }
  function redimensionar() { if (ws) B.svgResize(ws); }

  window.EditorBloques = { iniciar, leer, resaltar, borrar, redimensionar, get ws() { return ws; } };
})();
