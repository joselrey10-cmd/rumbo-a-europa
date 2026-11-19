/*
  PINICRATCH · CORRECCIÓN AUTOMÁTICA DE LOS RETOS SCRATCH (6.º, B1–B6)
  ---------------------------------------------------------------------
  Lee el proyecto (el JSON de Scratch 3, igual que el project.json de un .sb3) y comprueba,
  ruta por ruta, si se han usado los bloques que pide cada reto.
  Nota del indicador de programación de cada reto (las rutas se suman):
    · nada hecho → 0 · algo de la ruta sencilla → 1 o 2 · sencilla completa → 3
    · + intermedia completa → 4 · + avanzada completa → 5
  Solo se corrige solo el indicador de programación (3.2.x). El resto (lengua, licencias, equipo…) lo pone el profe.
  Para cambiar lo que se comprueba, edita RUBRICAS: cada comprobación es [texto, función(p) → true/false].
*/
(function (raiz) {
  "use strict";

  /* ---------- Lectura del proyecto ---------- */
  function analizar(proyecto) {
    const targets = (proyecto && proyecto.targets) || [];
    const objetos = [], escenario = targets.find((t) => t.isStage) || { costumes: [], blocks: {} };
    targets.forEach((t) => {
      const bl = t.blocks || {};
      // Bloques en orden, guion a guion (siguiente + interiores de «repetir», «si»…).
      const guiones = [];
      const recorrer = (id, out) => {
        let n = 0;
        while (id && bl[id] && n++ < 5000) {
          const b = bl[id]; out.push(b);
          ["SUBSTACK", "SUBSTACK2"].forEach((k) => { const inp = b.inputs && b.inputs[k]; if (inp && typeof inp[1] === "string") recorrer(inp[1], out); });
          id = b.next;
        }
        return out;
      };
      Object.keys(bl).forEach((id) => {
        const b = bl[id];
        if (b && typeof b === "object" && !Array.isArray(b) && b.topLevel) {
          const lista = recorrer(id, []);
          guiones.push({ cabeza: b.opcode, bloques: lista, ops: lista.map((x) => x.opcode) });
        }
      });
      const info = { nombre: t.name, escenario: !!t.isStage, guiones, bloques: bl, disfraces: t.costumes || [], todos: [].concat(...guiones.map((g) => g.bloques)) };
      if (!t.isStage) objetos.push(info); else escenario.info = info;
    });
    const todos = [].concat(...objetos.map((o) => o.todos), escenario.info ? escenario.info.todos : []);
    const todosGuiones = [].concat(...objetos.map((o) => o.guiones), escenario.info ? escenario.info.guiones : []);
    return { objetos, escenario, todos, guiones: todosGuiones, crudo: proyecto };
  }

  /* ---------- Ayudas para escribir comprobaciones ---------- */
  const es = (op) => (b) => (Array.isArray(op) ? op.indexOf(b.opcode) >= 0 : b.opcode === op);
  const cuenta = (p, op) => p.todos.filter(es(op)).length;
  // Objetos que tienen un guion que empieza con «cabeza» y que dentro usa alguno de «ops».
  const objetosCon = (p, cabeza, ops) => p.objetos.filter((o) => o.guiones.some((g) => (!cabeza || [].concat(cabeza).indexOf(g.cabeza) >= 0) && (!ops || g.ops.some((x) => [].concat(ops).indexOf(x) >= 0)))).length;
  const guionCon = (p, cabeza, ops) => p.guiones.filter((g) => [].concat(cabeza).indexOf(g.cabeza) >= 0 && [].concat(ops).every((op) => g.ops.some((x) => [].concat(op).indexOf(x) >= 0))).length;
  function campo(b, nombre) { const f = b.fields && b.fields[nombre]; return f ? String(f[0]) : ""; }
  // Nombre del mensaje de «enviar», «enviar y esperar» o «al recibir».
  function mensaje(b, bl) {
    if (b.opcode === "event_whenbroadcastreceived") return campo(b, "BROADCAST_OPTION");
    const inp = b.inputs && b.inputs.BROADCAST_INPUT;
    if (!inp) return "";
    const v = inp[1];
    if (Array.isArray(v)) return String(v[1] || "");
    if (typeof v === "string" && bl && bl[v]) return campo(bl[v], "BROADCAST_OPTION");
    return "";
  }
  const mensajes = (p, ops) => {
    const out = [];
    p.objetos.concat(p.escenario.info ? [p.escenario.info] : []).forEach((o) => o.todos.filter(es(ops)).forEach((b) => out.push(mensaje(b, o.bloques).trim().toLowerCase())));
    return out;
  };
  const MOV = ["motion_movesteps", "motion_changexby", "motion_changeyby", "motion_gotoxy", "motion_setx", "motion_sety", "motion_glidesecstoxy", "motion_glideto", "motion_goto"];
  const DECIR = ["looks_say", "looks_sayforsecs", "looks_think", "looks_thinkforsecs"];
  const SONIDO = ["sound_play", "sound_playuntildone"];
  const DESLIZAR = ["motion_glidesecstoxy", "motion_glideto"];
  const BUCLE = ["control_repeat", "control_forever", "control_repeat_until"];
  const FONDO = ["looks_switchbackdropto", "looks_nextbackdrop", "looks_switchbackdroptoandwait"];
  const FONDO_VACIO = "cd21514d0531fdffb22204e0ec5ed84a";   // el fondo blanco del proyecto nuevo
  const fondosPropios = (p) => (p.escenario.costumes || []).filter((c) => c.assetId !== FONDO_VACIO).length;
  // Notas de «tocar nota» en orden (bloque de la extensión Música).
  function notas(p) {
    const out = [];
    p.objetos.concat(p.escenario.info ? [p.escenario.info] : []).forEach((o) => o.guiones.forEach((g) => {
      const fila = [];
      g.bloques.filter(es("music_playNoteForBeats")).forEach((b) => {
        const inp = b.inputs && b.inputs.NOTE, v = inp && inp[1];
        let n = NaN;
        if (Array.isArray(v)) n = Number(v[1]);
        else if (typeof v === "string" && o.bloques[v]) n = Number(campo(o.bloques[v], "NOTE"));
        fila.push(n);
      });
      if (fila.length) out.push(fila);
    }));
    return out;
  }
  // ¿Empieza el Himno de Europa (Oda a la alegría)? mi mi fa sol sol fa mi re (se admite cualquier octava/tono).
  function himno(p) {
    const ODA = [0, 0, 1, 3, 3, 1, 0, -2];
    return notas(p).some((fila) => {
      for (let i = 0; i + ODA.length <= fila.length; i++) {
        const base = fila[i];
        if (ODA.every((d, j) => fila[i + j] - base === d)) return true;
      }
      return false;
    });
  }

  /* ---------- Rúbricas: [ruta sencilla, intermedia, avanzada] → lista de [texto, comprobación] ---------- */
  const RUBRICAS = {
    B1: { ind: "3.2.1", rutas: [
      [["Al menos 3 letras (objetos) reaccionan «al hacer clic en este objeto»", (p) => objetosCon(p, "event_whenthisspriteclicked", null) >= 3],
       ["Las letras cambian de color (efecto color)", (p) => p.objetos.filter((o) => o.todos.some((b) => /^looks_(change|set)effect/.test(b.opcode) && campo(b, "EFFECT").toUpperCase() === "COLOR")).length >= 3],
       ["Las letras giran", (p) => p.objetos.filter((o) => o.todos.some(es(["motion_turnright", "motion_turnleft", "motion_pointindirection"]))).length >= 3]],
      [["Las letras suenan", (p) => p.objetos.filter((o) => o.todos.some(es(SONIDO))).length >= 3],
       ["Las letras cambian de tamaño", (p) => p.objetos.filter((o) => o.todos.some(es(["looks_changesizeby", "looks_setsizeto"]))).length >= 3]],
      [["Algo empieza al presionar una tecla", (p) => cuenta(p, "event_whenkeypressed") >= 1],
       ["Las letras se deslizan", (p) => cuenta(p, DESLIZAR) >= 1],
       ["Una letra dice «hola» (bloque decir)", (p) => cuenta(p, DECIR) >= 1]]
    ] },
    B2: { ind: "3.2.2", rutas: [
      [["Hay un fondo elegido para tu país", (p) => fondosPropios(p) >= 1],
       ["El guía se mueve con las flechas (al presionar tecla + movimiento)", (p) => guionCon(p, "event_whenkeypressed", [MOV]) >= 2],
       ["El guía cambia de disfraz", (p) => cuenta(p, ["looks_nextcostume", "looks_switchcostumeto"]) >= 1]],
      [["El guía planea (desliza) de un punto a otro", (p) => cuenta(p, DESLIZAR) >= 1],
       ["El guía anda: repetir con «siguiente disfraz» dentro", (p) => p.guiones.some((g) => g.bloques.some((b) => BUCLE.indexOf(b.opcode) >= 0) && g.ops.indexOf("looks_nextcostume") >= 0)]],
      [["El guía cuenta al menos 3 datos (bloques decir)", (p) => cuenta(p, DECIR) >= 3],
       ["Al final sale volando (desliza o se mueve en un bucle después de hablar)", (p) => p.guiones.some((g) => { const i = g.ops.findIndex((x) => DECIR.indexOf(x) >= 0); return i >= 0 && g.ops.slice(i + 1).some((x) => DESLIZAR.indexOf(x) >= 0 || x === "motion_changeyby" || BUCLE.indexOf(x) >= 0); })]]
    ] },
    B3: { ind: "3.2.2", rutas: [
      [["Dos personajes hablan (cada uno con su bloque decir)", (p) => p.objetos.filter((o) => o.todos.some(es(DECIR))).length >= 2],
       ["Hay al menos 2 preguntas y 2 respuestas (4 bloques decir)", (p) => cuenta(p, DECIR) >= 4],
       ["Los turnos no se pisan: esperas o mensajes", (p) => cuenta(p, ["control_wait", "event_broadcast", "event_broadcastandwait", "looks_sayforsecs"]) >= 2]],
      [["La escena cambia de fondo", (p) => cuenta(p, FONDO) >= 1 && fondosPropios(p) >= 2],
       ["Un personaje reacciona al hacer clic", (p) => cuenta(p, "event_whenthisspriteclicked") >= 1]],
      [["El entrevistado responde a un mensaje (enviar + al recibir)", (p) => cuenta(p, ["event_broadcast", "event_broadcastandwait"]) >= 1 && cuenta(p, "event_whenbroadcastreceived") >= 1],
       ["Hay una segunda escena (cambiar fondo dos veces o «cuando el fondo cambie a»)", (p) => cuenta(p, FONDO) >= 2 || cuenta(p, "event_whenbackdropswitchesto") >= 1]]
    ] },
    B4: { ind: "3.2.3", rutas: [
      [["Suena un tambor (extensión Música)", (p) => cuenta(p, "music_playDrumForBeats") >= 1],
       ["El ritmo se repite con «repetir»", (p) => p.guiones.some((g) => g.ops.indexOf("control_repeat") >= 0 && g.ops.indexOf("music_playDrumForBeats") >= 0) || p.guiones.some((g) => g.ops.indexOf("control_forever") >= 0 && g.ops.indexOf("music_playDrumForBeats") >= 0)],
       ["Empieza con un evento (clic, tecla o bandera)", (p) => p.guiones.some((g) => /^event_when/.test(g.cabeza) && g.ops.some((x) => /^music_|^sound_/.test(x)))]],
      [["Toca una melodía de al menos 8 notas", (p) => notas(p).some((f) => f.length >= 8) || cuenta(p, "music_playNoteForBeats") >= 8],
       ["Elige instrumento", (p) => cuenta(p, "music_setInstrument") >= 1],
       ["El instrumento se anima (disfraz, tamaño o efecto)", (p) => cuenta(p, ["looks_nextcostume", "looks_switchcostumeto", "looks_changesizeby", "looks_setsizeto", "looks_changeeffectby", "looks_seteffectto"]) >= 1]],
      [["Toca el principio del Himno de Europa (mi mi fa sol sol fa mi re)", (p) => himno(p)]]
    ] },
    B5: { ind: "3.2.2", rutas: [
      [["Tu objeto espera el mensaje «ir a [país]» (al recibir)", (p) => mensajes(p, "event_whenbroadcastreceived").some((m) => /^ir a /.test(m))],
       ["Al recibirlo cambia el fondo", (p) => p.guiones.some((g) => g.cabeza === "event_whenbroadcastreceived" && g.ops.some((x) => FONDO.indexOf(x) >= 0)) || cuenta(p, "event_whenbackdropswitchesto") >= 1],
       ["Tu objeto cuenta 3 datos (bloques decir)", (p) => cuenta(p, DECIR) >= 3]],
      [["Tu guía anda o planea mientras habla", (p) => p.guiones.some((g) => g.cabeza === "event_whenbroadcastreceived" && g.ops.some((x) => DESLIZAR.indexOf(x) >= 0 || x === "looks_nextcostume" || x === "motion_movesteps"))]],
      [["Al acabar envía el mensaje «volver»", (p) => mensajes(p, ["event_broadcast", "event_broadcastandwait"]).some((m) => /volver/.test(m))],
       ["El dato sostenible aparece con un efecto", (p) => cuenta(p, ["looks_changeeffectby", "looks_seteffectto", "looks_show"]) >= 1]]
    ] },
    B6: { ind: "3.2.2", rutas: [
      [["Al menos 2 puntos de país reaccionan al hacer clic", (p) => objetosCon(p, "event_whenthisspriteclicked", null) >= 2],
       ["Al pulsar se envía «ir a…»", (p) => mensajes(p, ["event_broadcast", "event_broadcastandwait"]).some((m) => /^ir a /.test(m))],
       ["El avión se desliza hasta el país", (p) => cuenta(p, DESLIZAR) >= 1]],
      [["Con «volver» el avión regresa (al recibir volver)", (p) => mensajes(p, "event_whenbroadcastreceived").some((m) => /volver/.test(m))],
       ["Suena la sintonía al empezar", (p) => p.guiones.some((g) => g.cabeza === "event_whenflagclicked" && g.ops.some((x) => SONIDO.indexOf(x) >= 0 || /^music_play/.test(x)))]],
      [["El avión pregunta algo (preguntar y esperar)", (p) => cuenta(p, "sensing_askandwait") >= 1],
       ["Suma puntos si aciertas (si + variable)", (p) => cuenta(p, "control_if") + cuenta(p, "control_if_else") >= 1 && cuenta(p, ["data_changevariableby", "data_setvariableto"]) >= 1]]
    ] }
  };
  const NOMBRES_RUTA = ["Sencilla", "Intermedia", "Avanzada"];

  /* ---------- Corrección ---------- */
  function corregir(reto, proyecto) {
    const r = RUBRICAS[reto]; if (!r) return null;
    const p = analizar(proyecto);
    const rutas = r.rutas.map((lista, k) => {
      const items = lista.map(([texto, f]) => { let ok = false; try { ok = !!f(p); } catch (e) { ok = false; } return { texto, ok }; });
      return { nombre: NOMBRES_RUTA[k], items, completa: items.every((x) => x.ok), hechas: items.filter((x) => x.ok).length };
    });
    let nota;
    if (rutas[0].completa) nota = 3 + (rutas[1].completa ? 1 : 0) + (rutas[1].completa && rutas[2].completa ? 1 : 0);
    else nota = rutas[0].hechas === 0 ? (p.todos.length >= 2 ? 1 : 0) : 1 + Math.floor(2 * rutas[0].hechas / rutas[0].items.length);
    const ruta = rutas[0].completa ? (rutas[1].completa ? (rutas[2].completa ? "Avanzada" : "Intermedia") : "Sencilla") : "Sin completar";
    return { reto, indicador: r.ind, nota: Math.min(5, nota), ruta, rutas, bloques: p.todos.length };
  }

  const api = { RUBRICAS, corregir, analizar };
  if (typeof module === "object" && module.exports) module.exports = api;
  else raiz.PinicratchRubricas = api;
})(typeof window !== "undefined" ? window : this);
