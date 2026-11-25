/*
  RETOS SCRATCH · AGENCIA EURORUTA (6.º · Programa)
  --------------------------------------------------
  Los 6 bloques de las fichas del profe (B1–B6): el alumno hace el proyecto en Pinicratch (pinicratch/, editor Scratch con Pini) o en scratch.mit.edu,
  lo guarda en OneDrive y aquí elige su ruta, comprueba la lista, contesta el billete de salida
  y marca «He terminado». La nota de cada indicador la pone el profe en el panel (como en Crea).
  - Se ven en #programa (apartado «2.º trimestre», que crea js/pinicraft.js) y cada reto en #programa-scratch-B1…B6.
  - Cada reto se abre al terminar el anterior y hacer su autoevaluación (window.Autoeval).
  - Fila a la hoja: Actividad «Programación · Scratch B3 · Entrevista para La Piña 3.0», Programa «Terminado · Ruta intermedia»
    (cuenta como reto terminado en el panel) y otra fila con el billete de salida y el enlace al proyecto.
  - Las tarjetas en PDF van en la carpeta scratch/ (B1.pdf … B6.pdf); si no están subidas, el botón no sale.
  Indicadores: códigos de la programación de 6.º que usa la web (js/indicadores.js). Las fichas en PDF
  usan a veces otra numeración; aquí se ha elegido el indicador de la web que dice lo mismo.
*/
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const V = () => window.Valoraciones;
  const HASH = /^#programa-scratch-(B[1-6])$/;
  const LOCAL = "rumbo-scratch-v1";

  const RETOS = [
    {
      id: "B1", titulo: "El nombre de mi país cobra vida", tri: "1.er trimestre", sda: "SdA 1 · Europa bajo la lupa",
      mision: "La Agencia EuroRuta necesita una pantalla de bienvenida para cada país que investigáis. Escribe el nombre de tu país con letras de Scratch y dales vida con los colores de su bandera.",
      producto: "Proyecto Scratch con el nombre de tu país animado.",
      antes: ["Abre Pinicratch (botón de abajo).", "Borra a Pini: clic derecho → borrar.", "Añade una a una las letras del nombre de tu país (Elige un objeto → Letras).", "Elige un fondo que recuerde a tu país."],
      rutas: [["Sencilla", "Cada letra cambia de color al hacer clic y gira.", "Cambiar color · Rotar"], ["Intermedia", "Cada letra suena y cambia de tamaño.", "Reproducir un sonido · Cambiar el tamaño"], ["Avanzada", "Al pulsar una tecla las letras se deslizan, y una dice «hola» en la lengua del país.", "Presiona una tecla · Deslizar alrededor"]],
      compruebo: ["Al menos 3 letras reaccionan al hacer clic.", "Los colores recuerdan a la bandera.", "Pruebo cada letra y corrijo lo que falla."],
      ind: [["3.2.1", "Animo las letras con «al hacer clic» y bloques de apariencia, movimiento y sonido."], ["3.2.6", "Pruebo cada letra, encuentro lo que falla y lo corrijo."], ["2.1.2", "Escribo «hola» bien en la lengua de mi país (avanzada)."]],
      archivo: "B1_Pais_TripulacionN.sb3", billete: "¿Qué bloque hace que todo empiece en Scratch?"
    },
    {
      id: "B2", titulo: "Mi guía turístico", tri: "1.er trimestre", sda: "SdA 1 · Europa bajo la lupa",
      mision: "Cada país necesita un guía que reciba a los viajeros. Elige un personaje que pasea por un paisaje de tu país y cuenta lo que has descubierto en el dossier.",
      producto: "Un personaje que se mueve, cambia de disfraz y cuenta datos de tu país.",
      antes: ["Abre un proyecto nuevo en Pinicratch.", "Elige un fondo parecido a un lugar de tu país (playa, montaña, ciudad…).", "Elige un personaje que tenga varios disfraces.", "Ten a mano tu dossier de viaje."],
      rutas: [["Sencilla", "El guía se mueve con las flechas y cambia de disfraz.", "Mover con las teclas · Cambiar el disfraz"], ["Intermedia", "El guía planea de la capital al monumento y anda.", "Planea de un punto a otro · Animar - andar"], ["Avanzada", "El guía cuenta 3 datos del dossier y, después, sale volando.", "Animar - hablar · Animar - volar"]],
      compruebo: ["El guía responde a las flechas o al clic.", "Los datos que dice son los del dossier.", "Si uso una imagen de fuera de Scratch, apunto el autor y la licencia."],
      ind: [["3.2.2", "Programo movimiento, disfraces y mensajes del guía en orden y con eventos."], ["3.2.6", "Pruebo, encuentro un fallo y lo corrijo."], ["3.3.1", "Uso imágenes de la biblioteca o con licencia y apunto su autor."]],
      archivo: "B2_Guia_Pais_TripulacionN.sb3", billete: "¿Qué diferencia hay entre «ir a» y «deslizar»?"
    },
    {
      id: "B3", titulo: "Entrevista para La Piña 3.0", tri: "2.º trimestre", sda: "SdA 2 · Redacción La Piña 3.0",
      mision: "La redacción de La Piña 3.0 prepara un especial de Europa. Crea una entrevista animada: un reportero de Mojados conversa con una persona de tu país, que le cuenta cómo se vive allí.",
      producto: "Una historia animada con conversación, cambio de escena y respuesta.",
      antes: ["Escribe antes 2 preguntas y 2 respuestas con datos del dossier.", "Elige dos personajes: el reportero y el entrevistado.", "Elige un fondo de redacción y otro del país.", "Evita estereotipos: cuenta datos reales y respetuosos."],
      rutas: [["Sencilla", "Los dos personajes hablan por turnos: 2 preguntas y 2 respuestas.", "Empezar una historia · Empezar una conversación"], ["Intermedia", "La escena pasa de la redacción al país y un personaje reacciona al clic.", "Cambiar fondos · Pinchar en un personaje"], ["Avanzada", "El entrevistado responde a un mensaje y la entrevista tiene una segunda escena.", "Responder a un personaje · Añadir una escena"]],
      compruebo: ["Los turnos no se pisan (uso esperar o mensajes).", "Las respuestas tienen datos reales del país.", "La historia tiene principio y final."],
      ind: [["3.2.2", "Coordino a los personajes por turnos con esperas y mensajes."], ["2.1.2", "Presento el país sin estereotipos y con alguna palabra en su lengua."]],
      archivo: "B3_Entrevista_Pais_TripulacionN.sb3", billete: "¿Para qué sirve «enviar mensaje» en una historia?"
    },
    {
      id: "B4", titulo: "La sintonía de Europa", tri: "2.º trimestre", sda: "SdA 2 · Redacción La Piña 3.0",
      mision: "La sección europea de La Piña 3.0 y la radio del cole necesitan una sintonía. Programa ritmos y una melodía. Los más atrevidos tocarán el principio del Himno de Europa (Oda a la alegría, Beethoven).",
      producto: "Una sintonía programada con ritmo y melodía.",
      antes: ["Abre un proyecto nuevo.", "Pulsa Añadir extensión (abajo a la izquierda) → Música.", "Elige un instrumento de la biblioteca de objetos (categoría Música).", "Usa auriculares o el volumen bajo."],
      rutas: [["Sencilla", "Un tambor suena al hacer clic y repite un ritmo.", "Tocar un tambor · Haz un ritmo"], ["Intermedia", "El instrumento se anima y toca una melodía de 8 notas.", "Animar un instrumento · Haz una melodía"], ["Avanzada", "Programa el principio del Himno de Europa con la tabla de notas.", "Toca una canción"]],
      compruebo: ["Uso repetir para no copiar bloques.", "La sintonía dura menos de 15 segundos.", "Cada sonido empieza con un evento (clic o tecla)."],
      ind: [["3.2.3", "Uso bucles («repetir») para crear un ritmo y convierto una melodía en una secuencia de notas."], ["3.4.2", "Sé que el Himno de Europa es de dominio público y por eso lo puedo usar."]],
      archivo: "B4_Sintonia_TripulacionN.sb3", billete: "¿Qué ahorra el bloque «repetir»?"
    },
    {
      id: "B5", titulo: "EuroRuta 1: preparamos el equipaje", tri: "3.er trimestre", sda: "SdA 3 · Ingeniería sostenible",
      mision: "Llega el proyecto final: la tripulación viajará en Scratch a los países que eligió. Hoy cada viajero prepara su país: un objeto que, al recibir el aviso de llegada, cambia el fondo y cuenta lo más interesante, incluido un dato sostenible (energía, reciclaje, transporte…).",
      producto: "El objeto-país de cada viajero, exportado y listo para unirlo al proyecto de la tripulación.",
      antes: ["Reparte en la tripulación: un país por viajero (los del dossier).", "Recupera de OneDrive tus proyectos B1 a B4: puedes reutilizar tu guía, tu nombre animado o la sintonía.", "Crea el fondo de tu país y un objeto (bandera, monumento o guía).", "Usa el mensaje exacto: ir a + el nombre de tu país."],
      rutas: [["Sencilla", "Al recibir «ir a [país]», cambia el fondo y tu objeto dice 3 datos.", "Cambiar fondos · Carta EuroRuta 1"], ["Intermedia", "Además, tu guía anda o planea por el fondo mientras habla.", "Planea de un punto a otro · Animar - hablar"], ["Avanzada", "Además, al acabar envía «volver» y el dato sostenible aparece con un efecto.", "Pinchar en un personaje · Carta EuroRuta 1"]],
      compruebo: ["El mensaje se llama igual en todos: «ir a Italia», «ir a Grecia»…", "Mi objeto funciona solo: lo pruebo con un botón provisional.", "Exporto mi objeto: clic derecho → exportar → .sprite3."],
      ind: [["3.2.2", "Programo «al recibir» y «enviar» mensajes y planifico qué pasa en mi escena."], ["2.3.1", "Respeto el trabajo de cada viajero y acordamos los cambios."], ["1.2.1", "Guardo mi objeto con un nombre claro en la carpeta común."]],
      archivo: "Pais_Viajero.sprite3 (carpeta «Scratch EuroRuta» de la tripulación)", billete: "¿Qué pasaría si un compañero escribe el mensaje distinto?"
    },
    {
      id: "B6", titulo: "EuroRuta 2: ¡despegamos!", tri: "3.er trimestre", sda: "SdA 3 · Ingeniería sostenible",
      mision: "El capitán o la capitana abre el proyecto común: un mapa de Europa y un avión que sale de Mojados. Al pulsar un país, el avión vuela hasta él y el viajero de ese país toma la palabra. Al final, ¡publicamos el viaje!",
      producto: "Proyecto de la tripulación: viaje por Europa con todos los países, sintonía y créditos.",
      antes: ["Fondo 1: mapa de Europa con licencia (Wikimedia Commons, «mapa mudo de Europa»).", "Objeto avión que empieza en España.", "Subir objeto: importad los .sprite3 de cada viajero.", "Un punto sobre cada país del mapa."],
      rutas: [["Sencilla", "Al pulsar un punto, el avión desliza hasta el país y llega el mensaje «ir a…».", "Deslizar a un punto · Carta EuroRuta 2"], ["Intermedia", "Con «volver», el avión regresa a Mojados; suena la sintonía al empezar.", "Toca una canción · Carta EuroRuta 2"], ["Avanzada", "Al volver, el avión pregunta algo del país y suma puntos si aciertas.", "Conseguir puntos · Carta EuroRuta 2"]],
      compruebo: ["Completamos la tabla de pruebas: todos los países funcionan.", "Notas y créditos: autores, imágenes, mapa y webs.", "Compartimos el enlace o el .sb3 por Teams y comprobamos que se abre."],
      ind: [["3.2.2", "Integro eventos, mensajes y, en la avanzada, variables."], ["3.2.6", "Pruebo cada país y apunto 2 mejoras."], ["3.3.2", "Incluyo créditos completos en «Notas y créditos»."], ["2.2.1", "Comparto el proyecto y compruebo que los demás pueden abrirlo."]],
      archivo: "EuroRuta_TripulacionN.sb3 + enlace en Teams", billete: "¿Qué parte del viaje mejorarías si tuvieras otra sesión?"
    }
  ];
  window.RETOS_SCRATCH = RETOS;
  // Indicador que corrige solo Pinicratch al entregar (pinicratch/pinicratch-rubricas.js).
  const AUTO = { B1: "3.2.1", B2: "3.2.2", B3: "3.2.2", B4: "3.2.3", B5: "3.2.2", B6: "3.2.2" };

  const alumno = () => (V() ? V().alumno() : { nombre: "", usuario: "", clase: "" });
  const curso = () => (V() ? V().curso() : "5º");
  const esSexto = () => curso() === "6º" && !window.ADAPTADO;
  const destino = (r) => `Programación · Scratch ${r.id} · ${r.titulo}`.slice(0, 60);
  const actividad = (r) => `Scratch ${r.id} · ${r.titulo}`;
  const codigos = (r) => r.ind.map((x) => x[0]);
  const etapa = (r) => ({ etapa: "prog-scratch-" + r.id, titulo: `Programa · Scratch ${r.id} · ${r.titulo}`, rincon: `Programa · Scratch ${r.id}`, codigos: codigos(r) });
  const quien = () => { const a = alumno(); return (a.usuario || a.nombre || "anonimo").toLowerCase(); };
  function leerLocal() { try { return JSON.parse(localStorage.getItem(LOCAL) || "{}") || {}; } catch (e) { return {}; } }
  const mio = () => leerLocal()[quien()] || {};
  function guardarMio(id, datos) {
    const o = leerLocal(), u = quien(); o[u] = o[u] || {}; o[u][id] = Object.assign({}, o[u][id] || {}, datos);
    try { localStorage.setItem(LOCAL, JSON.stringify(o)); } catch (e) {}
  }
  const hoja = {};   // retos terminados según la hoja
  const terminado = (r) => !!((mio()[r.id] || {}).fin || hoja[r.id]);
  const saAbierta = (k) => !window.SA || window.SA.abierta(RETOS[k].sda);   // js/sa-abiertas.js
  const abierto = (k) => saAbierta(k) && (k === 0 || terminado(RETOS[k]) || terminado(RETOS[k - 1]));

  // «Mis notas», Excel e insignias: un apartado por reto, con sus indicadores (las notas las pone el profe).
  if (V() && V().añadirActividades) V().añadirActividades("prog", () => esSexto() ? [].concat(...RETOS.map((r) => codigos(r).map((cod) => ({
    clave: `scr-${r.id}-${cod}`, pantalla: "Programación", actividad: actividad(r), destino: destino(r), ciudad: r.titulo, tipo: "fijo", ref: cod
  })))) : []);
  // Panel del profe (js/profe.js, catalogo): los retos como actividades de Programa de 6.º que se terminan, como Crea.
  const extraAnterior = window.PROG_EXTRA;
  window.PROG_EXTRA = function (c, a) {
    const L = extraAnterior ? extraAnterior(c, a) || [] : [];
    if (c !== "6º" || (a && a.adaptado === true)) return L;
    RETOS.forEach((r) => L.push({ rincon: "prog", titulo: `Scratch ${r.id} · ${r.titulo}`, destino: destino(r), ciudad: r.titulo, inds: codigos(r), grupo: "scratch", nombreGrupo: "Retos Scratch", terminable: true, sa: r.sda }));
    return L;
  };

  let ultima = 0;
  async function recuperarHoja(forzar) {
    const R = window.REGISTRO || {}, s = window.Acceso && window.Acceso.sesion ? window.Acceso.sesion() : null;
    if (!R.url || !s || !s.token) return;
    if (!forzar && Date.now() - ultima < 30000) return;
    ultima = Date.now();
    try {
      const resp = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ accion: "alumnoResultados", usuario: s.usuario, token: s.token }) });
      const j = JSON.parse(await resp.text());
      if (!j || !j.ok) return;
      (j.hechos || []).forEach((h) => { const r = RETOS.find((x) => destino(x) === String(h[0])); if (r) hoja[r.id] = String(h[1] || "").replace(/^Terminado ·\s*/, "") || true; });
      const notas = window.Profe && window.Profe.notasDe ? window.Profe.notasDe(j.cab || [], j.fila || [], curso()) : {};
      RETOS.forEach((r) => codigos(r).forEach((cod) => {
        const col = destino(r) + " · Ind. " + cod;
        if (Number.isFinite(notas[col]) && V()) V().registrar(`scr-${r.id}-${cod}`, { nota: notas[col], codigo: cod, pantalla: "Programación", actividad: actividad(r) }, true);
      }));
    } catch (e) { /* sin conexión */ }
  }

  /* ---------- Lista en #programa ---------- */
  function pintarLista() {
    const L = $("#scratch-retos-lista");
    if (!L) return;
    if (!esSexto()) { L.innerHTML = ""; return; }
    L.innerHTML = `<div class="aventura sc-aventura"><div class="aventura-cab"><span class="etiqueta">Retos Scratch</span><h3>Agencia EuroRuta</h3><p>Programa en <b>Pinicratch</b> (o en scratch.mit.edu), guarda con Archivo → Guardar en tu ordenador y súbelo a OneDrive (carpeta TIAC / Scratch EuroRuta). Las rutas se suman: para la intermedia, haz antes la sencilla; para la avanzada, la intermedia.</p><span class="aventura-cuenta">${RETOS.filter(terminado).length} / ${RETOS.length}</span></div>
      <div class="destinos sc-retos">${RETOS.map((r, k) => {
        const ok = abierto(k), fin = terminado(r), ruta = (mio()[r.id] || {}).ruta || (typeof hoja[r.id] === "string" ? hoja[r.id] : "");
        return `<button class="destino sc-reto" data-id="${r.id}" ${ok ? "" : "disabled"}><span class="num">${esc(r.id)} · ${esc(r.tri)}</span><span class="sc-ico" aria-hidden="true">${["🔤", "🧭", "🎤", "🎵", "🧳", "✈️"][k]}</span><strong>${esc(r.titulo)}</strong><span class="pais">${esc(r.sda)}</span><span class="ind-mini">Ind. ${esc(codigos(r).join(" · "))}</span><span class="estrellas">${!saAbierta(k) ? "🔒 " + esc(window.SA.etiqueta(r.sda)) : !ok ? "Bloqueado" : fin ? `<b>✓ Terminado${ruta && ruta !== true ? " · " + esc(ruta) : ""}</b>` : "Por hacer"}</span></button>`;
      }).join("")}</div></div>`;
    L.querySelectorAll(".sc-reto").forEach((b) => (b.onclick = () => { location.hash = "programa-scratch-" + b.dataset.id; }));
  }

  /* ---------- Ficha de un reto ---------- */
  let raiz = null;
  function montar() {
    if (raiz) return raiz;
    raiz = document.createElement("main"); raiz.id = "scratch-reto"; raiz.hidden = true;
    const juego = $("#juego");
    (juego && juego.parentNode ? juego.parentNode : document.body).insertBefore(raiz, juego ? juego.nextSibling : null);
    return raiz;
  }
  function pintarReto(r) {
    montar();
    ["#inicio", "#juego", "#robotica", "#rincones", "#pinicraft"].forEach((s) => { const e = $(s); if (e) e.hidden = true; });
    raiz.hidden = false;
    document.body.dataset.seccion = "programa";
    const m = mio()[r.id] || {}, fin = terminado(r), k = RETOS.indexOf(r);
    const textoInd = (cod) => ((((window.INDICADORES || {})["6º"] || {})[cod]) || "");
    raiz.innerHTML = `
      <div class="barra-juego"><div class="envoltura"><button class="volver" id="sc-volver">← Programa</button><div><h2>${esc(r.titulo)}</h2><div class="pais">Scratch ${esc(r.id)} de 6 · ${esc(r.tri)} · ${esc(r.sda)}</div></div>${fin ? `<div class="contador">✓ Terminado</div>` : ""}</div></div>
      <div class="envoltura sc-ficha">
        <section class="sc-caja sc-mision"><h3>🎯 Misión</h3><p>${esc(r.mision)}</p><p><b>Producto:</b> ${esc(r.producto)}</p>
          <p class="sc-botones"><a class="btn" href="pinicratch/?reto=${esc(r.id)}" target="_blank" rel="noopener">Abrir Pinicratch ↗</a><a class="btn sec" href="https://scratch.mit.edu/projects/editor/" target="_blank" rel="noopener">Abrir Scratch ↗</a><a class="btn sec" id="sc-pdf" href="scratch/${esc(r.id)}.pdf" target="_blank" rel="noopener" hidden>Ver las tarjetas (PDF)</a></p></section>
        <section class="sc-caja"><h3>🧳 Antes de empezar</h3><ol>${r.antes.map((t) => `<li>${esc(t)}</li>`).join("")}</ol></section>
        <section class="sc-caja"><h3>🛫 Elige tu ruta</h3><div class="sc-rutas">${r.rutas.map(([n, t, tar], j) => `<label class="sc-ruta"><input type="radio" name="sc-ruta" value="${esc(n)}" ${m.ruta === n ? "checked" : ""}><span><b>● Ruta ${esc(n.toLowerCase())}</b>${esc(t)}<small>Tarjetas: ${esc(tar)}</small></span></label>`).join("")}</div><p class="sc-nota">Las rutas se suman: para la intermedia, haz antes la sencilla; para la avanzada, la intermedia.</p></section>
        <section class="sc-caja"><h3>✅ Compruebo antes de guardar</h3>${r.compruebo.map((t, j) => `<label class="sc-check"><input type="checkbox" data-j="${j}" ${m.ok && m.ok[j] ? "checked" : ""}> ${esc(t)}</label>`).join("")}</section>
        <section class="sc-caja"><h3>📋 Mis indicadores</h3><ul class="sc-ind">${r.ind.map(([cod, t]) => `<li><span class="cod">Ind. ${esc(cod)}</span> <b>${esc(t)}</b>${textoInd(cod) ? `<small>${esc(textoInd(cod))}</small>` : ""}</li>`).join("")}</ul><p class="sc-nota">Haz el reto en <b>Pinicratch</b>: con «🔍 Comprobar» ves qué te falta y con «📤 Entregar a la profe» se guarda tu proyecto y se pone sola la nota del indicador <b>${esc(AUTO[r.id] || "")}</b> (cuenta tu mejor entrega). Los demás indicadores los pone tu profe; si tu profe corrige una nota, vale la suya.</p></section>
        <section class="sc-caja"><h3>💾 Mochila digital</h3><p>Al entregar en Pinicratch, tu profe recibe una copia. Guarda también la tuya: Archivo → Guardar en tu ordenador y súbelo a OneDrive, a la carpeta <b>TIAC / Scratch EuroRuta</b>.<br>Nombre: <code>${esc(r.archivo)}</code><br>Lo reutilizarás en el proyecto final del 3.er trimestre.</p>
          <label class="sc-campo">Enlace a tu proyecto (de Scratch o de OneDrive), si lo tienes<input id="sc-enlace" type="url" maxlength="200" placeholder="https://…" value="${esc(m.enlace || "")}"></label></section>
        <section class="sc-caja"><h3>🎟️ Billete de salida</h3><label class="sc-campo">${esc(r.billete)}<textarea id="sc-billete" rows="3" maxlength="300">${esc(m.billete || "")}</textarea></label></section>
        <div class="enviar-fila"><button class="btn" id="sc-fin">${fin ? "Volver a enviar" : "✓ He terminado el reto"}</button><span class="estado" id="sc-estado" aria-live="polite">${fin ? "Ya lo marcaste como terminado." : ""}</span></div>
        ${k < RETOS.length - 1 ? `<p class="sc-nota">Al terminarlo y hacer tu autoevaluación se abre <b>${esc(RETOS[k + 1].id)} · ${esc(RETOS[k + 1].titulo)}</b>.</p>` : ""}
      </div>`;
    $("#sc-volver").onclick = () => { location.hash = "programa"; };
    fetch(`scratch/${r.id}.pdf`, { method: "HEAD" }).then((x) => { if (x.ok) $("#sc-pdf").hidden = false; }).catch(() => {});
    raiz.addEventListener("change", (e) => {
      if (e.target.name === "sc-ruta") guardarMio(r.id, { ruta: e.target.value });
      if (e.target.matches(".sc-check input")) { const ok = Object.assign({}, (mio()[r.id] || {}).ok || {}); ok[e.target.dataset.j] = e.target.checked; guardarMio(r.id, { ok }); }
    });
    raiz.addEventListener("input", (e) => {
      if (e.target.id === "sc-billete") guardarMio(r.id, { billete: e.target.value });
      if (e.target.id === "sc-enlace") guardarMio(r.id, { enlace: e.target.value });
    });
    $("#sc-fin").onclick = () => terminar(r);
    window.scrollTo(0, 0);
  }
  async function terminar(r) {
    const est = $("#sc-estado"), b = $("#sc-fin"), m = mio()[r.id] || {};
    const pon = (t, cl) => { est.textContent = t; est.className = "estado" + (cl ? " " + cl : ""); };
    if (!m.ruta) { pon("Elige la ruta que has hecho.", "error"); return; }
    if (r.compruebo.some((_, j) => !(m.ok && m.ok[j]))) { pon("Marca las comprobaciones de la lista antes de terminar.", "error"); return; }
    if (!String(m.billete || "").trim()) { pon("Contesta el billete de salida.", "error"); return; }
    b.disabled = true; pon("Enviando a tu profe…");
    const ok = V() ? await V().enviar({ destino: destino(r), ciudad: r.titulo.slice(0, 40), personaje: "Scratch", programa: "Terminado · Ruta " + m.ruta.toLowerCase() }) : false;
    if (ok && V()) V().enviar({ destino: destino(r), ciudad: r.titulo.slice(0, 40), personaje: "Scratch", programa: `Billete: ${String(m.billete).trim()}${m.enlace ? " · Proyecto: " + String(m.enlace).trim() : ""}`.slice(0, 490) });
    b.disabled = false;
    if (!ok) { pon("No se ha podido enviar. Comprueba que has entrado con tu contraseña y la conexión, y vuelve a pulsar.", "error"); return; }
    guardarMio(r.id, { fin: new Date().toISOString() });
    hoja[r.id] = "Ruta " + m.ruta.toLowerCase();
    pon("✓ Reto terminado y enviado a tu profe.", "ok");
    const k = RETOS.indexOf(r);
    // Autoevaluación obligatoria para abrir el siguiente reto.
    if (window.Autoeval && window.Autoeval.asegurar) { try { await window.Autoeval.asegurar(etapa(r), true); } catch (e) {} }
    if (k < RETOS.length - 1) pon(`✓ Reto terminado. Ya puedes abrir ${RETOS[k + 1].id} · ${RETOS[k + 1].titulo}.`, "ok");
  }

  async function enrutar() {
    const m = HASH.exec(location.hash);
    if (!m) {
      if (raiz && !raiz.hidden) { raiz.hidden = true; if (location.hash === "#programa") { const i = $("#inicio"); if (i) i.hidden = false; } }
      if (location.hash === "#programa") { pintarLista(); recuperarHoja().then(pintarLista); }
      return;
    }
    if (window.Candado && window.Candado.cerrado && window.Candado.cerrado()) { location.replace("#"); return; }
    const k = RETOS.findIndex((x) => x.id === m[1]);
    if (!esSexto() || !alumno().nombre) { location.replace("#programa"); return; }
    await recuperarHoja();
    if (!abierto(k)) { alert(!saAbierta(k) ? window.SA.aviso(RETOS[k].sda) : "Este reto está bloqueado: termina antes el anterior."); location.replace("#programa"); return; }
    // Antes de abrir un reto nuevo, la autoevaluación del anterior tiene que estar hecha.
    if (k > 0 && !terminado(RETOS[k]) && window.Autoeval && window.Autoeval.asegurar) {
      let ok = true; try { ok = await window.Autoeval.asegurar(etapa(RETOS[k - 1])); } catch (e) {}
      if (!ok) { location.replace("#programa"); return; }
    }
    pintarReto(RETOS[k]);
  }
  window.addEventListener("hashchange", enrutar);
  ["alumno-cambiado", "progreso-remoto"].forEach((e) => window.addEventListener(e, () => { if (location.hash === "#programa") pintarLista(); }));
  pintarLista();
  enrutar();
  window.RetosScratch = { RETOS, pintarLista, recuperarHoja, terminado };
})();
