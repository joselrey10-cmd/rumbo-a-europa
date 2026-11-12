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
  let raiz = null, datos = null, grupo = "P5A", alumnoSel = null, extra = [], cambios = {}, avisoAlta = "", vista = "trabajo";
  const trabajos = {};   // id del alumno -> filas de «Resultados» ya cargadas en esta sesión

  const G = (t) => (window.normGrupo ? window.normGrupo(t) : String(t || ""));
  const cursoDe = (g) => (/6/.test(g || "") ? "6º" : "5º");
  const igual = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
  // Con adaptación curricular (a = alumno marcado) se enseña el texto del indicador adaptado (mismo número).
  const textoInd = (c, cod, a) => (a && esAC(a) && ((window.INDICADORES_AC || {})[c] || {})[cod]) || ((window.INDICADORES || {})[c] || {})[cod] || "";
  // a.adaptado lo trae el script en la vista de familias y en «Mis notas»; en el panel se mira la lista de adaptados.
  const esAC = (a) => !!a && (a.adaptado === true || (typeof esAdaptado === "function" && esAdaptado(a)));
  const columna = (destino, cod) => String(destino).slice(0, 60) + " · Ind. " + cod;
  /* Indicadores de una actividad para un alumno: los de ahora y, si en la hoja tiene notas con códigos
     antiguos (p. ej. tras cambiar los indicadores de 6º en SA1), también esos, para que no se pierdan. */
  function indsAl(x, a) {
    const pre = String(x.destino).slice(0, 60) + " · Ind. ", L = x.inds.slice();
    Object.keys((a && a.notas) || {}).forEach((k) => { if (k.indexOf(pre) === 0) { const c = k.slice(pre.length); if (L.indexOf(c) < 0) L.push(c); } });
    return L;
  }

  /* Todas las actividades de un curso, con su texto de "Actividad" tal como llega a la hoja. */
  // a (opcional): con adaptación curricular, Programa son las 10 pantallas de la aventura 1 (las que juega con flechas)
  // y Robótica solo el robot de flechas con sus 10 retos adaptados. Las columnas de la hoja son las mismas.
  function catalogo(c, a) {
    const L = [], ac = !!(a && esAC(a));
    ((window.CREA || {})[c] || []).forEach((a) => L.push({ rincon: "crea", titulo: `${a.sa} ${a.s} · ${a.titulo}`, destino: `Crea · ${a.sa} ${a.s} · ${a.titulo}`, ciudad: a.titulo, inds: a.ind }));
    (window.PROG_NIVELES || []).forEach((n, i) => {
      if (ac && n.aventura !== 0) return;
      const cod = ((window.INDICADOR_PROGRAMACION || {})[c] || {})[n.ciudad];
      L.push({ rincon: "prog", titulo: `${i + 1}. ${n.ciudad}`, destino: `Programación · ${i + 1}. ${n.ciudad}`, ciudad: n.ciudad, inds: cod ? [cod] : [] });
    });
    const R = window.Robotica || {};
    Object.keys(R.MODOS || {}).filter((k) => !ac || k === "robot").forEach((k) => ((ac && window.RETOS_ROB_AC) || R.RETOS || []).forEach((r, i) => {
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
      const u = iU >= 0 ? String(f[iU] || "") : "", n = String(f[iN] || ""), c = G(f[iC]);
      const notas = notasDe(cab, f, cursoDe(c));
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
    // Pantallas superadas en Programa y Robótica (pestaña «Progreso por rutas»): la nota que reparte 5 puntos entre las pantallas.
    (datos.rutas || []).forEach((f) => {
      const n = String(f[0] || ""), u = String(f[1] || ""), c = G(f[2]);
      const a = lista.find((x) => u ? igual(x.usuario, u) : (igual(x.nombre, n) && igual(x.clase, c)));
      const r = (i) => ({ hechas: Number(f[i]) || 0, total: Number(f[i + 1]) || 0, nota: Number(f[i + 2]) || 0 });
      if (a) a.rutas = { prog: r(3), robot: r(6), essential: r(9), prime: r(12) };
    });
    // Notas puestas en esta sesión (aún no recargadas de la hoja)
    lista.forEach((a) => Object.assign(a.notas, cambios[idDe(a)] || {}));
    extra.forEach((x) => { x.terminados = x.terminados || {}; if (!lista.some((a) => igual(a.nombre, x.nombre) && igual(a.clase, x.clase))) lista.push(x); });
    return lista;
  }
  const esAdaptado = (a) => !!a.usuario && (datos && datos.adaptados || []).indexOf(String(a.usuario).trim().toLowerCase()) >= 0;
  const idDe = (a) => (a.usuario ? "u:" + String(a.usuario).trim().toLowerCase() : "n:" + String(a.nombre || "").trim().toLowerCase() + "|" + G(a.clase));
  /* Al pasar de 17 a 30 pantallas cambió el número de muchas ciudades (Dublín era la 8 y ahora es la 11).
     Las columnas antiguas de la hoja («Programación · 8. Dublín · Ind. …») se leen con el número de ahora,
     buscando la ciudad. Si hay nota en la antigua y en la nueva, vale la más alta. */
  /* El 11-nov algunas pantallas nuevas (Londres, Zúrich, Tallin…) llegaron a la hoja sin «Nº indicador» y su
     columna es solo «Programación · 8. Londres». Con el curso (5º/6º) se les pone el indicador que tiene ahora esa ciudad. */
  function normCol(t, curso) {
    t = String(t);
    let m = /^Programación · \d+\. (.+?) · Ind\. (.+)$/.exec(t);
    if (!m && curso) {
      const s = /^Programación · \d+\. (.+)$/.exec(t), cod = s && ((window.INDICADOR_PROGRAMACION || {})[curso] || {})[s[1].trim()];
      if (cod) m = [t, s[1].trim(), cod];
    }
    if (!m) return t;
    const i = (window.PROG_NIVELES || []).findIndex((n) => n.ciudad === m[1]);
    return i < 0 ? columna(t.replace(/ · Ind\. .*$/, ""), m[2]) : columna(`Programación · ${i + 1}. ${m[1]}`, m[2]);
  }
  // curso (opcional, "5º"/"6º"): necesario para leer las columnas de Programa que no llevan indicador.
  function notasDe(cab, f, curso) {
    const notas = {};
    (cab || []).forEach((t, i) => {
      t = String(t);
      if (!f || f[i] === "" || f[i] == null) return;
      if (!/ · Ind\. /.test(t) && !(curso && /^Programación · \d+\. /.test(t))) return;
      const k = normCol(t, curso), n = Number(f[i]);
      if (!/ · Ind\. /.test(k)) return;
      if (!(k in notas) || n > notas[k]) notas[k] = n;
    });
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

  /* Programa por pantallas superadas: 5 puntos repartidos entre las 30 pantallas (lo calcula el script en «Progreso por rutas»). */
  const coma = (x) => String(Math.round(x * 100) / 100).replace(".", ",");
  function lineaPantallas(a) {
    const p = a.rutas && a.rutas.prog;
    return `<small class="p-pantallas">🧩 ${p ? p.hechas : 0}/${p && p.total ? p.total : 30} pantallas · <b>${coma(p ? p.nota : 0)}</b> de 5</small>`;
  }
  function celdaProg(a, r) {
    const p = a.rutas && a.rutas.prog;
    return `<td title="Nota por pantallas superadas (5 puntos entre ${p && p.total ? p.total : 30} pantallas). Debajo, la media de calidad de las pantallas hechas."><b>${coma(p ? p.nota : 0)}</b><small>🧩 ${p ? p.hechas : 0}/${p && p.total ? p.total : 30} pantallas</small><small>calidad ${r.media === null ? "–" : coma(r.media)} · ${r.hechas} notas</small></td>`;
  }
  function resumen(a, c) {
    const cat = catalogo(c, a), out = {};
    RINC.forEach((r) => {
      const notas = [], total = cat.filter((x) => x.rincon === r.id).reduce((n, x) => n + indsAl(x, a).length, 0);
      cat.filter((x) => x.rincon === r.id).forEach((x) => indsAl(x, a).forEach((cod) => { const v = a.notas[columna(x.destino, cod)]; if (v !== undefined) notas.push(v); }));
      out[r.id] = { retos: r.id === "crea" ? cat.filter((x) => x.rincon === "crea" && a.terminados && a.terminados[x.destino.slice(0, 60)]).length : 0, nRetos: cat.filter((x) => x.rincon === r.id).length, hechas: notas.length, total, media: notas.length ? Math.round(notas.reduce((s, v) => s + v, 0) / notas.length * 10) / 10 : null };
    });
    return out;
  }
  // Desglose de Robótica por modalidad para que el profesor compare Robot, Essential y Prime.
  function resumenRobotica(a, c) {
    const cat = catalogo(c, a), modos = (window.Robotica && window.Robotica.MODOS) || {};
    return Object.keys(modos).filter((k) => !esAC(a) || k === "robot").map((k) => {
      const nombre = modos[k].nombre;
      const retos = cat.filter((x) => x.rincon === "rob" && x.destino.indexOf(`Robótica · ${nombre} ·`) === 0);
      const notas = [];
      retos.forEach((x) => indsAl(x, a).forEach((cod) => {
        const v = a.notas[columna(x.destino, cod)];
        if (v !== undefined) notas.push(v);
      }));
      return { nombre, hechas: notas.length, total: retos.reduce((n, x) => n + indsAl(x, a).length, 0),
        media: notas.length ? Math.round(notas.reduce((s, v) => s + v, 0) / notas.length * 10) / 10 : null };
    });
  }

  function mediasInd(lista, c) {
    const por = {};
    lista.forEach((a) => catalogo(c, a).forEach((x) => indsAl(x, a).forEach((cod) => {
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
      <button type="button" class="btn sec" id="p-textos" title="Cambia los textos que ve el alumnado en los rincones">✏️ Editar textos</button><button type="button" class="btn sec" id="p-excel" title="Prepara en la hoja una pestaña por grupo con los indicadores en el orden del Excel de evaluación">📊 Notas para el Excel</button><button type="button" class="btn sec" id="p-recargar">Recargar datos</button><span class="estado" id="p-excel-est" aria-live="polite"></span><button type="button" class="btn sec" id="p-salir">Salir</button></div>`;
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
          return `<tr><td><button type="button" class="p-alumno" data-i="${i}">${esc(verNombre(a))}</button>${esAdaptado(a) ? ` <span class="p-ac-marca" title="Adaptación curricular">AC</span>` : ""}</td><td>${esc(a.usuario)}${a.correo ? ` <span title="${esc(a.correo)}">✉️</span>` : ""}</td>
            ${RINC.map((r) => r.id === "prog" && !esAC(a) ? celdaProg(a, res.prog) : `<td>${res[r.id].media === null ? "–" : `<b>${res[r.id].media}</b>`}<small>${res[r.id].hechas}/${res[r.id].total} notas</small>${r.id === "crea" ? `<small>✓ ${res.crea.retos}/${res.crea.nRetos} retos</small>` : ""}</td>`).join("")}<td><b>${media}</b></td><td><button type="button" class="p-papelera" data-i="${i}" title="Dar de baja a ${esc(verNombre(a))}" aria-label="Dar de baja a ${esc(verNombre(a))}">🗑️</button></td></tr>`;
        }).join("")}</tbody></table></div>` : `<p class="intro">Todavía no hay notas de este grupo en la hoja.</p>`}
      ${barraCodigos(lista)}
      <div class="p-codigos"><div><b>🔑 Contraseñas del alumnado</b><p class="intro">Cada alumno elige su propia contraseña al entrar por primera vez. Si alguien la olvida, puedes consultarla en la pestaña «Accesos alumnado» de la hoja de Google vinculada al proyecto.</p>
        ${(window.REGISTRO || {}).hoja ? `<p><a href="${esc((window.REGISTRO || {}).hoja)}" target="_blank" rel="noopener">Abrir hoja de cálculo y consultar contraseñas ↗</a></p>` : ""}</div></div>
      <details class="p-import"><summary>Importar alumnado desde un CSV</summary>
        <p class="intro">Columnas obligatorias: <b>nombre; apellidos; usuario</b> (de Educacyl) y <b>curso</b>. Solo se importan las filas con el curso escrito exactamente <b>P5A, P5B, P6A o P6B</b>; el resto (Infantil, otros cursos o vacío) se salta. Opcionales: hasta dos <b>correos</b> de los tutores (columnas «correo tutor 1» y «correo tutor 2») para que la familia pueda consultar los resultados. Si un alumno ya está, se actualizan sus datos.</p>
        <div class="p-barra"><input type="file" id="p-csv" accept=".csv,text/csv,text/plain"><button type="button" class="btn sec" id="p-plantilla">Descargar plantilla CSV</button></div>
        <div id="p-csv-vista"></div>
      </details>
      <form class="alumno p-nuevo" id="p-nuevo" autocomplete="off">
        <label>Añadir alumno a ${grupo}<input id="p-n-nombre" maxlength="30" placeholder="Nombre y apellido"></label>
        <label>Usuario Educacyl<input id="p-n-usuario" maxlength="60" placeholder="nombre.apellido"></label>
        <button class="btn sec" type="submit">Añadir y poner notas</button>
        <span class="estado" id="p-n-estado" aria-live="polite"></span>
      </form>
      <h2 class="sa-tit">Media de cada indicador en ${grupo}</h2>
      ${mediasTabla(lista, c)}
      </div>`;
    if (avisoAlta) {
      const aviso = document.createElement("p");
      aviso.className = "estado"; aviso.dataset.tipo = "ok"; aviso.setAttribute("role", "status");
      aviso.textContent = avisoAlta; avisoAlta = "";
      const zona = raiz.querySelector(".envoltura.seccion");
      if (zona) zona.insertBefore(aviso, zona.firstChild);
    }
    $("#p-nuevo").addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombreCompleto = $("#p-n-nombre").value.trim();
      const usuario = $("#p-n-usuario").value.trim().replace(/@.*$/, "");
      const est = $("#p-n-estado"), boton = $('#p-nuevo button[type="submit"]');
      if (!nombreCompleto || !usuario) {
        est.textContent = "Escribe el nombre y el usuario de Educacyl para guardar el alumno.";
        est.dataset.tipo = "error";
        return;
      }
      const partesNombre = nombreCompleto.split(/\s+/);
      const nombre = partesNombre.shift();
      const apellidos = partesNombre.join(" ");
      boton.disabled = true;
      est.textContent = "Guardando en Google Sheets…";
      est.dataset.tipo = "";
      try {
        const guardado = await llamar({
          accion: "importar",
          alumnos: [{ nombre, apellidos, usuario, clase: grupo, correo: "" }]
        });
        if (!guardado || !guardado.ok) throw new Error((guardado && guardado.error) || "Google Sheets no ha confirmado el guardado.");
        const actualizado = await llamar({ accion: "datos" });
        if (!actualizado || !actualizado.ok) throw new Error((actualizado && actualizado.error) || "Google Sheets no ha permitido comprobar el alta. Los datos siguen en el formulario.");
        const confirmado = (actualizado.alumnado || []).some((f) => igual(f[2], usuario) && igual(G(f[3]), grupo));
        if (!confirmado) throw new Error("Google Sheets respondió, pero el alumno no aparece en la pestaña «Alumnado» del registro. No se ha confirmado el alta. Comprueba que la implementación de Apps Script esté actualizada y que el grupo sea P5A, P5B, P6A o P6B.");
        datos = actualizado;
        extra = extra.filter((x) => !igual(x.usuario, usuario));
        avisoAlta = guardado.nuevos
          ? "✓ Alumno guardado y verificado en Google Sheets."
          : "✓ El usuario ya existía: sus datos se han actualizado y verificado en Google Sheets.";
        pintarGrupo();
      } catch (err) {
        est.textContent = err.message === "Failed to fetch"
          ? "No se ha podido conectar con Google Sheets. El alumno no se ha confirmado como guardado."
          : err.message;
        est.dataset.tipo = "error";
        boton.disabled = false;
      }
    });
    raiz.querySelectorAll(".p-alumno").forEach((b) => b.onclick = () => pintarAlumno(lista[+b.dataset.i]));
    const bg = $("#p-cod-grupo"); if (bg) bg.onclick = () => mandarCodigos(lista, bg, `las familias de ${grupo}`);
    const bt = $("#p-cod-todos"); if (bt) bt.onclick = () => mandarCodigos(alumnos().filter((x) => GRUPOS.indexOf(G(x.clase)) >= 0), bt, "las familias de todos los grupos");
    raiz.querySelectorAll(".p-papelera").forEach((b) => b.onclick = () => darDeBaja(lista[+b.dataset.i], b, null));
    $("#p-excel").onclick = async () => {
      const b = $("#p-excel"), est = $("#p-excel-est"); b.disabled = true; est.textContent = "Preparando las pestañas…"; est.dataset.tipo = "";
      const j = await llamar({ accion: "excel" }).catch(() => null);
      b.disabled = false;
      if (j && j.ok) { est.innerHTML = `✓ Listo: pestañas «Excel P5A», «Excel P5B», «Excel P6A» y «Excel P6B». <a href="${esc(j.url)}" target="_blank" rel="noopener">Abrir la hoja ↗</a>`; est.dataset.tipo = "ok"; }
      else { est.textContent = (j && j.error) || "No se ha podido preparar."; est.dataset.tipo = "error"; }
    };
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
  // "APELLIDOS, NOMBRE" en una sola columna → se separa.
  function partirNombre(a) {
    if (!a.apellidos && a.nombre.indexOf(",") > 0) { const p = a.nombre.split(","); a.apellidos = p[0].trim(); a.nombre = p.slice(1).join(",").trim(); }
    return a;
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
    let iN = col("nombre") >= 0 ? col("nombre") : cab.findIndex((c) => /^alumn/.test(c) && !/correo|mail/.test(c)), iA = col("apellido"), iU = col("usuario", "educacyl", "user"), iC = col("curso", "clase", "grupo"), iE = col("correo", "email", "mail");
    // Correos de los tutores: no se cogen las columnas del correo del alumno (alumno, educa, usuario…).
    const iEs = cab.map((c, i) => (/correo|email|mail/.test(c) && !/alumn|educa|usuario|user/.test(c) ? i : -1)).filter((i) => i >= 0);
    let datosF = filas.slice(1);
    if (iN < 0 && iU < 0) { iN = 0; iA = 1; iU = 2; iC = filas[0].length > 3 ? 3 : -1; iE = filas[0].length > 4 ? 4 : -1; iEs.length = 0; for (let k = 4; k < filas[0].length; k++) iEs.push(k); datosF = filas; }   // sin cabecera
    const sinPropio = (lista, usuario) => lista.filter((c) => !usuario || String(c).trim().toLowerCase().replace(/@.*$/, "") !== usuario.toLowerCase());
    const alumnosCSV = datosF.map((f) => partirNombre({
      nombre: f[iN] || "", apellidos: iA >= 0 ? f[iA] || "" : "", usuario: (f[iU] || "").replace(/@.*$/, ""),
      clase: iC >= 0 ? claseValida(f[iC]) : "", otroCurso: !(iC >= 0 && claseValida(f[iC])), correo: unirCorreos(sinPropio(iEs.map((k) => f[k]).flatMap(separarCorreos), (f[iU] || "").replace(/@.*$/, "")))
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
    if (!R.url) throw new Error("No está configurada la URL de Google Apps Script (REGISTRO.url).");
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
    const frases = Object.assign({}, (window.AUTOEVAL || {})[c] || {}, esAC(a) ? (window.AUTOEVAL_AC || {})[c] || {} : {}), ESC = window.ESCALA_AUTO || [];
    if (!k.length) return `<details class="p-rincon"><summary style="color:#14225a">Autoevaluación</summary><p class="intro">Todavía no ha hecho la autoevaluación de Programa y Robótica.</p></details>`;
    const fecha = a.autoFecha && !isNaN(new Date(a.autoFecha)) ? ` · ${new Date(a.autoFecha).toLocaleDateString("es-ES")}` : "";
    return `<details class="p-rincon" open><summary style="color:#14225a">Autoevaluación del alumno${fecha}</summary>
      <div class="tabla-scroll"><table class="p-tabla"><thead><tr><th>Rincón</th><th>Lo que dice que sabe hacer</th><th>0-5</th></tr></thead><tbody>
      ${k.sort().map((t) => { const m = /^(.*) · Ind\. (.*)$/.exec(t) || ["", t, ""]; return `<tr><td>${esc(m[1])}</td><td><span class="cod-p">${esc(m[2])}</span> ${esc(frases[m[2]] || textoInd(c, m[2], a))}</td><td><b>${a.auto[t]}</b><small>${esc(ESC[a.auto[t]] || "")}</small></td></tr>`; }).join("")}
      </tbody></table></div></details>`;
  }
  function chips(col, valor) {
    return `<div class="chips" role="radiogroup" aria-label="Nota de 0 a 5" data-col="${esc(col)}">${[0, 1, 2, 3, 4, 5].map((n) =>
      `<button type="button" role="radio" aria-checked="${valor === n}" data-n="${n}">${n}</button>`).join("")}</div>`;
  }
  function pintarAlumno(a) {
    alumnoSel = a;
    const c = cursoDe(a.clase), cat = catalogo(c, a), res = resumen(a, c);
    raiz.innerHTML = cab(`${esc(verNombre(a))} · ${esc(a.clase)}${a.usuario ? " · " + esc(a.usuario) : ""} · indicadores de ${c}`) +
      `<div class="envoltura seccion">
      <p class="p-barra"><button type="button" class="btn sec" id="p-volver">← Volver a ${esc(a.clase)}</button>
        <button type="button" class="btn sec p-borrar" id="p-borrar">🗑️ Dar de baja</button><span class="estado" id="p-borrar-est" aria-live="polite"></span></p>
      <div class="rutas p-vistas" role="tablist" aria-label="Qué quieres ver">
        <button type="button" role="tab" class="ruta p-vista" data-v="trabajo" aria-selected="${vista === "trabajo"}"><b>📂 Su trabajo</b><span>Lo que ha hecho en cada rincón</span></button>
        <button type="button" role="tab" class="ruta p-vista" data-v="notas" aria-selected="${vista === "notas"}"><b>📝 Notas y datos</b><span>Notas por indicador, correos de la familia y adaptación</span></button>
      </div>
      <div id="p-trabajo"${vista === "trabajo" ? "" : " hidden"}><p class="estado">Cargando su trabajo…</p></div>
      <div id="p-notas"${vista === "notas" ? "" : " hidden"}>
      <form class="alumno p-correo" id="p-correo" autocomplete="off">
        <label>Correo tutor 1<input id="p-correo-in" type="email" maxlength="120" value="${esc(separarCorreos(a.correo)[0] || "")}" placeholder="tutor1@ejemplo.com"></label>
        <label>Correo tutor 2 <small>(opcional)</small><input id="p-correo-in2" type="email" maxlength="120" value="${esc(separarCorreos(a.correo)[1] || "")}" placeholder="tutor2@ejemplo.com"></label>
        <button class="btn sec" type="submit"${a.usuario ? "" : " disabled title=\"Hace falta el usuario de Educacyl\""}>Guardar correos</button>
        <button class="btn sec" type="button" id="p-cod-uno"${a.usuario && a.correo ? "" : " disabled"}>✉️ Enviar código</button>
        <label class="p-ac"><input type="checkbox" id="p-ac"${esAdaptado(a) ? " checked" : ""}${a.usuario ? "" : " disabled"}> Adaptación curricular <small>(entra directamente y ve los contenidos adaptados)</small></label>
        <span class="estado" id="p-correo-est">${a.usuario ? "Con cualquiera de estos correos la familia puede ver los resultados en la pestaña Familias." : "Este alumno no tiene usuario de Educacyl: impórtalo con su usuario."}</span>
      </form>
      <div class="p-resumen">${RINC.map((r) => `<div style="--rc:${r.color}"><b>${r.nombre}</b><span>${res[r.id].media === null ? "–" : res[r.id].media}</span><small>${res[r.id].hechas} de ${res[r.id].total} con nota${r.id === "crea" ? ` · ✓ ${res.crea.retos}/${res.crea.nRetos} retos terminados` : ""}</small>${r.id === "prog" && !esAC(a) ? lineaPantallas(a) : ""}</div>`).join("")}</div>
      <h2 class="sa-tit">Robótica · resultados por modalidad</h2>
      <div class="p-resumen">${resumenRobotica(a, c).map((m, i) => `<div style="--rc:${["#3a7bd5", "#e8489b", "#14225a"][i] || "#2f8f5b"}"><b>${esc(m.nombre)}</b><span>${m.media === null ? "–" : m.media}</span><small>${m.hechas} de ${m.total} indicadores con nota</small></div>`).join("")}</div>
      <p class="intro">Las casillas marcadas son las notas que ya hay en la hoja. En Crea, el alumno solo marca el reto como terminado: la nota de cada indicador la pones tú aquí. Al pulsar una nota se guarda sola en la hoja (verás «✓ Guardada»).</p>
      ${autoTabla(a, c)}
      ${RINC.map((r) => `<details class="p-rincon" ${r.id === "crea" ? "open" : ""}><summary style="color:${r.color}">${r.nombre}</summary>
        <div class="retos-r">${cat.map((x, k) => ({ x, k })).filter(({ x }) => x.rincon === r.id && x.inds.length).map(({ x, k }) => `
          <article class="reto-r" data-k="${k}">
            <div class="reto-r-cab"><h3>${esc(x.titulo)}</h3>${x.rincon === "crea" ? (() => { const t = (a.terminados || {})[x.destino.slice(0, 60)]; return t ? `<span class="p-hecho">✓ Terminado${t.ruta && t.ruta !== "Todos" ? " · " + esc(t.ruta) : ""}${t.fecha && !isNaN(new Date(t.fecha)) ? " · " + new Date(t.fecha).toLocaleDateString("es-ES") : ""}</span>` : `<span class="p-hecho no">Sin terminar</span>`; })() : ""}</div>
            <div class="inds">${indsAl(x, a).map((cod) => { const col = columna(x.destino, cod), viejo = x.inds.indexOf(cod) < 0; return `<div class="fila-ind"><div class="fila-ind-t"><span class="cod">Ind. ${cod}</span> ${esc(textoInd(c, cod, a))}${viejo ? " <small>(indicador anterior: nota ya puesta)</small>" : ""}</div>${chips(col, a.notas[col])}</div>`; }).join("")}</div>
            <div class="enviar-fila"><button type="button" class="btn sec enviar-p">Volver a enviar</button><span class="estado" aria-live="polite"></span></div>
          </article>`).join("")}</div></details>`).join("")}
      </div></div>`;
    $("#p-volver").onclick = pintarGrupo;
    raiz.querySelectorAll(".p-vista").forEach((b) => b.onclick = () => {
      vista = b.dataset.v;
      raiz.querySelectorAll(".p-vista").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      $("#p-trabajo").hidden = vista !== "trabajo"; $("#p-notas").hidden = vista !== "notas";
    });
    cargarTrabajo(a);
    $("#p-borrar").onclick = () => darDeBaja(a, $("#p-borrar"), $("#p-borrar-est"));
    $("#p-ac").onchange = async (e) => {
      const est = $("#p-correo-est"), si = e.target.checked; e.target.disabled = true;
      est.textContent = "Guardando…"; est.dataset.tipo = "";
      const j = await llamar({ accion: "adaptacion", usuario: a.usuario, valor: si }).catch(() => null);
      e.target.disabled = false;
      if (j && j.ok) { datos.adaptados = j.adaptados; est.textContent = si ? "✓ Con adaptación: entra directamente y ve los contenidos adaptados." : "✓ Sin adaptación."; est.dataset.tipo = "ok"; }
      else { e.target.checked = !si; est.textContent = (j && j.error) || "No se ha podido guardar."; est.dataset.tipo = "error"; }
    };
    $("#p-cod-uno").onclick = () => mandarCodigos([a], $("#p-cod-uno"), `la familia de ${verNombre(a)}`, $("#p-correo-est"));
    $("#p-correo").addEventListener("submit", async (e) => {
      e.preventDefault();
      const est = $("#p-correo-est"), lista = [$("#p-correo-in").value, $("#p-correo-in2").value].map((x) => x.trim().toLowerCase()).filter((x) => x);
      if (lista.some((x) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x))) { est.textContent = "Revisa los correos: alguno no es válido."; est.dataset.tipo = "error"; return; }
      const correo = unirCorreos(lista);
      const partes = a.nombre.split(" ");
      const j = await llamar({ accion: "guardarCorreosFamilia", usuario: a.usuario, correo }).catch(() => ({ ok: false, error: "No se ha podido conectar con la hoja." }));
      if (j.ok) { a.correo = j.correo == null ? correo : j.correo; a.registrado = true; $("#p-cod-uno").disabled = !correo; est.textContent = correo ? "✓ Correos guardados." : "✓ Correos borrados."; est.dataset.tipo = "ok"; } else { est.textContent = j.error; est.dataset.tipo = "error"; }
    });
    window.scrollTo(0, 0);
  }

  /* ---------- Su trabajo: lo que ha hecho el alumno en cada rincón (filas de «Resultados») ---------- */
  async function cargarTrabajo(a, recargar) {
    const caja = $("#p-trabajo"), id = idDe(a);
    if (!caja) return;
    if (!trabajos[id] || recargar) {
      caja.innerHTML = `<p class="estado">Cargando su trabajo…</p>`;
      const j = await llamar({ accion: "trabajoAlumno", usuario: a.usuario, nombre: a.nombre, clase: a.clase }).catch(() => null);
      if (alumnoSel !== a) return;   // el profe ya ha cambiado de alumno
      if (!j || !j.ok) {
        caja.innerHTML = `<p class="estado" data-tipo="error">${esc((j && j.error && !/responde bien/.test(j.error)) ? j.error : "La hoja todavía no sabe enviar el trabajo del alumno. Añade al script la función «trabajoAlumno» (mira las instrucciones del paquete) y crea una nueva versión de la implementación.")}</p>`;
        return;
      }
      trabajos[id] = (j.filas || []).map((f) => ({ fecha: f[0], act: String(f[1] || ""), reto: String(f[2] || ""), est: f[3] === "" ? null : Number(f[3]), bloques: f[4], intentos: f[5], pers: String(f[6] || ""), prog: String(f[7] || ""), ind: String(f[8] || ""), val: f[9] === "" || f[9] == null ? null : Number(f[9]) }));
    }
    caja.innerHTML = trabajoHTML(a, cursoDe(a.clase), trabajos[id]);
    const rb = $("#p-trab-recargar", caja); if (rb) rb.onclick = () => cargarTrabajo(a, true);
  }
  const fechaCorta = (f) => { const d = new Date(f); return isNaN(d) ? "" : d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }); };
  const estrellas = (n) => n == null || isNaN(n) ? "" : "★".repeat(Math.max(0, Math.min(3, n))) + "☆".repeat(3 - Math.max(0, Math.min(3, n)));
  /* El programa llega como texto («Avanzar, Repetir 3 [Saltar, Avanzar]»): se dibuja como bloques. */
  function partirNivel(t) {
    const out = []; let prof = 0, ini = 0;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (ch === "[") prof++; else if (ch === "]") prof--;
      else if (ch === "," && prof === 0) { out.push(t.slice(ini, i).trim()); ini = i + 1; }
    }
    if (t.slice(ini).trim()) out.push(t.slice(ini).trim());
    return out;
  }
  function bloquesHTML(t) {
    t = String(t || "").trim();
    if (!t) return `<span class="bq-vacio">(programa vacío)</span>`;
    return partirNivel(t).map((it) => {
      const k = it.indexOf("[");
      if (k < 0) return `<span class="bq ${tipoBloque(it)}">${esc(it)}</span>`;
      // Cabecera y uno o más cuerpos entre corchetes («Si … [..] si no [..]»)
      let html = `<div class="bq-c ${tipoBloque(it)}"><span class="bq-cab">${esc(it.slice(0, k).trim())}</span>`, i = k;
      while (i < it.length && it[i] === "[") {
        let prof = 0, j = i;
        for (; j < it.length; j++) { if (it[j] === "[") prof++; else if (it[j] === "]" && --prof === 0) break; }
        let dentro = it.slice(i + 1, j), etiqueta = "";
        const m = /^si no:\s*/i.exec(dentro); if (m) { etiqueta = "si no"; dentro = dentro.slice(m[0].length); }
        if (etiqueta) html += `<span class="bq-cab">${etiqueta}</span>`;
        html += `<div class="bq-cuerpo">${bloquesHTML(dentro)}</div>`;
        const resto = it.slice(j + 1), m2 = /^\s*(si no)\s*(?=\[)/i.exec(resto);
        i = j + 1;
        if (m2) { html += `<span class="bq-cab">si no</span>`; i += m2[0].length; }
      }
      return html + `</div>`;
    }).join("");
  }
  function tipoBloque(t) {
    t = t.toLowerCase();
    if (/^repetir/.test(t)) return "b-rep";
    if (/^si\b/.test(t)) return "b-si";
    if (/girar|gira|izquierda|derecha|°/.test(t)) return "b-giro";
    if (/saltar/.test(t)) return "b-salto";
    return "b-mov";
  }
  const sinProfe = (r) => r.pers !== "Profe" && r.prog !== "Nota del profe" && r.prog !== "Nota revisada";
  function mejor(rs) {
    return rs.slice().sort((x, y) => (y.val || 0) - (x.val || 0) || (y.est || 0) - (x.est || 0) || String(y.fecha).localeCompare(String(x.fecha)))[0];
  }
  /* Tarjeta de una pantalla o reto: estado, mejor resultado, su programa y todos sus envíos. */
  function tarjetaPrograma(titulo, rs, conEstrellas) {
    const env = rs.filter(sinProfe).sort((x, y) => String(x.fecha).localeCompare(String(y.fecha)));
    const b = env.length ? mejor(env) : null;
    const sup = !!b && ((b.val || 0) >= 3 || (conEstrellas && (b.est || 0) >= 1));
    const estado = !b ? "sin" : sup ? "si" : "no";
    return `<details class="p-trab ${estado}"><summary><span class="p-trab-tit">${esc(titulo)}</span>
        <span class="p-trab-est">${!b ? "Sin empezar" : sup ? "✓ Superada" : "Intentada"}</span>
        ${b ? `<span class="p-trab-dat">${conEstrellas && b.est != null ? `<span class="p-estrellas" title="${b.est} estrellas">${estrellas(b.est)}</span>` : ""}${b.val != null ? `<b>${b.val}</b>/5` : ""} · ${env.length} ${env.length === 1 ? "envío" : "envíos"}</span>` : ""}</summary>
      ${b ? `<div class="p-trab-cuerpo"><p class="p-trab-sub">Su mejor programa${b.bloques ? ` · ${b.bloques} bloques` : ""}${b.intentos ? ` · ${b.intentos} intentos` : ""}${b.pers ? ` · ${esc(b.pers)}` : ""} · ${fechaCorta(b.fecha)}</p>
        <div class="bq-prog">${bloquesHTML(b.prog)}</div>
        ${env.length > 1 ? `<details class="p-trab-hist"><summary>Ver los ${env.length} envíos</summary><ol>${env.map((r) => `<li><small>${fechaCorta(r.fecha)}${conEstrellas && r.est != null ? " · " + estrellas(r.est) : ""}${r.bloques ? " · " + r.bloques + " bloques" : ""}${r.val != null ? " · nota " + r.val : ""}</small><div class="bq-prog">${bloquesHTML(r.prog)}</div></li>`).join("")}</ol></details>` : ""}
      </div>` : ""}</details>`;
  }
  // Igual que «Mis insignias» del alumno: una por actividad; en Crea basta con terminar el reto.
  function insignias(a, c, filas) {
    const out = {};
    catalogo(c, a).forEach((x) => {
      const o = out[x.rincon] = out[x.rincon] || { ganadas: 0, total: 0 };
      const inds = x.inds; if (!inds.length) return;
      o.total++;
      if (x.rincon === "crea" && ((a.terminados || {})[x.destino.slice(0, 60)] || filas.some((r) => r.act === x.destino.slice(0, 60) && /^Terminado/.test(r.prog)))) { o.ganadas++; return; }
      const n = inds.map((cod) => a.notas[columna(x.destino, cod)]).filter((v) => v !== undefined);
      if (n.length === inds.length && n.reduce((s, v) => s + v, 0) / n.length >= 2.5) o.ganadas++;
    });
    return out;
  }
  /* Indicadores automáticos de Programa y Robótica (lo mismo que hace el script al preparar «Notas para el Excel»):
     suma de la mejor nota de cada pantalla o reto del indicador ÷ cuántas son (las no hechas cuentan 0), redondeada.
     Si el profe ha puesto nota a una pantalla, vale su última nota. En Robótica, la modalidad en la que mejor va. */
  function indicadoresAuto(a, c, filas) {
    const notaDe = (rs) => {
      const pr = rs.filter((r) => r.prog === "Nota del profe" && r.val != null).sort((x, y) => String(x.fecha).localeCompare(String(y.fecha))).pop();
      if (pr) return pr.val;
      const v = rs.filter((r) => sinProfe(r) && r.val != null).map((r) => r.val);
      return v.length ? Math.max(...v) : null;
    };
    const reparte = (items, filasDe) => {
      const t = {};
      items.forEach((x) => (x.inds || []).slice(0, 1).forEach((cod) => { const o = t[cod] = t[cod] || { s: 0, n: 0, h: 0 }, v = notaDe(filasDe(x)); o.n++; if (v != null) { o.s += v; o.h++; } }));
      const out = {}; Object.keys(t).forEach((cod) => { if (t[cod].h) out[cod] = { nota: Math.round(t[cod].s / t[cod].n), hechas: t[cod].h, de: t[cod].n }; });
      return out;
    };
    const cat = catalogo(c, a);
    const prog = reparte(cat.filter((x) => x.rincon === "prog"), (x) => filas.filter((r) => r.act.indexOf("Programación") === 0 && (r.reto === x.ciudad || r.act.replace(/^Programación · \d+\. /, "") === x.ciudad)));
    const rob = {};
    Object.keys((window.Robotica || {}).MODOS || {}).forEach((k) => {
      const nombre = window.Robotica.MODOS[k].nombre, items = cat.filter((x) => x.rincon === "rob" && x.destino.indexOf(`Robótica · ${nombre} ·`) === 0);
      if (!items.length) return;
      const r = reparte(items, (x) => filas.filter((f) => f.act === x.destino));
      Object.keys(r).forEach((cod) => { if (!rob[cod] || r[cod].nota > rob[cod].nota) rob[cod] = Object.assign({ modo: nombre }, r[cod]); });
    });
    return { prog, rob };
  }
  function autoIndHTML(a, c, filas) {
    const ind = indicadoresAuto(a, c, filas), L = [];
    [["prog", "Programa"], ["rob", "Robótica"]].forEach(([k, nom]) => Object.keys(ind[k]).sort().forEach((cod) => L.push(`<tr><td>${nom}${ind[k][cod].modo ? " · " + esc(ind[k][cod].modo) : ""}</td><td><span class="cod-p">${esc(cod)}</span> ${esc(textoInd(c, cod, a))}</td><td>${ind[k][cod].hechas} de ${ind[k][cod].de}</td><td><b>${ind[k][cod].nota}</b></td></tr>`)));
    return `<details class="p-rincon" open><summary style="color:#14225a">Indicadores de Programa y Robótica (automáticos)</summary>
      ${L.length ? `<p class="intro">Se calculan solos con su trabajo y van redondeados a «Notas para el Excel»: mejor nota de cada pantalla o reto, sumadas y divididas entre todas las del indicador (las que no ha hecho cuentan 0). Si corriges la nota de una pantalla en «Notas y datos», vale la tuya.</p>
      <div class="tabla-scroll"><table class="p-tabla"><thead><tr><th>Rincón</th><th>Indicador</th><th>Hechas</th><th>Nota</th></tr></thead><tbody>${L.join("")}</tbody></table></div>` : `<p class="intro">Todavía no tiene pantallas ni retos hechos.</p>`}</details>`;
  }
  function trabajoHTML(a, c, filas) {
    const ac = esAC(a), R = window.Robotica || {}, ins = insignias(a, c, filas);
    // Programa: se busca por ciudad (la numeración de las pantallas cambió al pasar a 30).
    const niveles = (window.PROG_NIVELES || []).map((n, i) => ({ n, i })).filter(({ n }) => !ac || n.aventura === 0);
    const deProg = (ciudad) => filas.filter((r) => r.act.indexOf("Programación") === 0 && (r.reto === ciudad || r.act.replace(/^Programación · \d+\. /, "") === ciudad));
    const supProg = niveles.filter(({ n }) => deProg(n.ciudad).filter(sinProfe).some((r) => (r.val || 0) >= 3 || (r.est || 0) >= 1)).length;
    const AV = window.AVENTURAS || [];
    const progHTML = AV.map((av, k) => {
      const L = niveles.filter(({ n }) => n.aventura === k);
      if (!L.length) return "";
      return `<h4 class="p-trab-grupo">${esc(av.nombre || "Aventura " + (k + 1))}</h4><div class="p-trab-lista">${L.map(({ n, i }) => tarjetaPrograma(`${i + 1}. ${n.ciudad}`, deProg(n.ciudad), true)).join("")}</div>`;
    }).join("");
    // Robótica: por modalidad y reto.
    const modos = Object.keys(R.MODOS || {}).filter((k) => !ac || k === "robot"), retos = (ac && window.RETOS_ROB_AC) || R.RETOS || [];
    let supRob = 0;
    const robHTML = modos.map((k) => {
      const nombre = R.MODOS[k].nombre;
      const tarjetas = retos.map((r, i) => {
        const rs = filas.filter((x) => x.act === `Robótica · ${nombre} · reto ${i + 1}`);
        if (rs.filter(sinProfe).some((x) => (x.val || 0) >= 3)) supRob++;
        return tarjetaPrograma(`Reto ${i + 1}. ${r.titulo}`, rs, false);
      });
      return `<h4 class="p-trab-grupo">${esc(nombre)}</h4><div class="p-trab-lista">${tarjetas.join("")}</div>`;
    }).join("");
    // Crea: retos terminados (con su ruta) y las notas que les has puesto.
    const crea = catalogo(c, a).filter((x) => x.rincon === "crea");
    const creaHTML = crea.map((x) => {
      const fin = filas.filter((r) => r.act === x.destino.slice(0, 60) && /^Terminado/.test(r.prog)).pop();
      const t = fin ? { ruta: fin.prog.replace(/^Terminado ·\s*/, ""), fecha: fin.fecha } : (a.terminados || {})[x.destino.slice(0, 60)];
      const notas = x.inds.map((cod) => [cod, a.notas[columna(x.destino, cod)]]).filter((p) => p[1] !== undefined);
      return `<div class="p-trab ${t ? "si" : "sin"} p-trab-fija"><div class="p-trab-fila"><span class="p-trab-tit">${esc(x.titulo)}</span>
        <span class="p-trab-est">${t ? `✓ Terminado${t.ruta && t.ruta !== "Todos" ? " · ruta " + esc(t.ruta) : ""}${t.fecha ? " · " + fechaCorta(t.fecha) : ""}` : "Sin terminar"}</span>
        <span class="p-trab-dat">${notas.length ? notas.map((p) => `<span class="cod-p">${esc(p[0])}</span> ${p[1]}`).join(" · ") : "Sin notas tuyas todavía"}</span></div></div>`;
    }).join("");
    // Piensa: la llave enviada y la nota de cada indicador.
    const piensaHTML = (window.PIENSA || []).map((p) => {
      const rs = filas.filter((r) => r.act === `Piensa · ${p.titulo}`.slice(0, 60) && sinProfe(r));
      const ult = rs[rs.length - 1], llave = ult && /^Llave /.test(ult.prog) ? ult.prog.slice(6) : "";
      const porInd = {}; rs.forEach((r) => { if (r.ind) porInd[r.ind] = r.val; });
      return `<div class="p-trab ${ult ? "si" : "sin"} p-trab-fija"><div class="p-trab-fila"><span class="p-trab-tit">${esc(p.titulo)}</span>
        <span class="p-trab-est">${ult ? `✓ Llave enviada${llave ? " · " + esc(llave) : ""} · ${fechaCorta(ult.fecha)}` : "Sin llave"}</span>
        <span class="p-trab-dat">${Object.keys(porInd).map((k) => `<span class="cod-p">${esc(k)}</span> ${porInd[k]}`).join(" · ")}</span></div></div>`;
    }).join("");
    const nCrea = crea.filter((x) => (a.terminados || {})[x.destino.slice(0, 60)] || filas.some((r) => r.act === x.destino.slice(0, 60) && /^Terminado/.test(r.prog))).length;
    const nPiensa = (window.PIENSA || []).filter((p) => filas.some((r) => r.act === `Piensa · ${p.titulo}`.slice(0, 60) && sinProfe(r))).length;
    const totIns = Object.keys(ins).reduce((s, k) => s + ins[k].total, 0), ganIns = Object.keys(ins).reduce((s, k) => s + ins[k].ganadas, 0);
    const caja = (r, valor, sub) => `<div style="--rc:${r.color}"><b>${r.nombre}</b><span>${valor}</span><small>${sub}</small></div>`;
    const ri = (id) => RINC.find((r) => r.id === id), insTxt = (id) => ins[id] ? ` · 🏅 ${ins[id].ganadas}/${ins[id].total}` : "";
    return `<div class="p-resumen">
        ${caja(ri("crea"), `${nCrea}/${crea.length}`, "retos terminados" + insTxt("crea"))}
        ${caja(ri("prog"), `${supProg}/${niveles.length}`, "pantallas superadas" + insTxt("prog"))}
        ${caja(ri("rob"), `${supRob}/${modos.length * retos.length}`, "retos superados" + insTxt("rob"))}
        ${caja(ri("piensa"), `${nPiensa}/${(window.PIENSA || []).length}`, "llaves enviadas" + insTxt("piensa"))}
      </div>
      <p class="intro">🏅 ${ganIns} de ${totIns} insignias, según las notas de la hoja (una por actividad: todos sus indicadores con nota y media de 2,5 o más; en Crea, al terminar el reto). Pulsa una pantalla o un reto para ver su programa y todos sus envíos.
        <button type="button" class="btn sec" id="p-trab-recargar">Recargar su trabajo</button></p>
      ${!filas.length ? `<p class="estado">Todavía no hay nada suyo en la hoja.</p>` : ""}
      ${autoIndHTML(a, c, filas)}
      <details class="p-rincon" open><summary style="color:${ri("prog").color}">Programa</summary>${progHTML}</details>
      <details class="p-rincon"><summary style="color:${ri("rob").color}">Robótica</summary>${robHTML}</details>
      <details class="p-rincon"><summary style="color:${ri("crea").color}">Crea</summary><div class="p-trab-lista">${creaHTML}</div></details>
      <details class="p-rincon"><summary style="color:${ri("piensa").color}">Piensa</summary><div class="p-trab-lista">${piensaHTML}</div></details>`;
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

  function claveGuardada() { try { return sessionStorage.getItem(CLAVE_SES) || ""; } catch (e) { return ""; } }
  async function enviarProfe(caja, todas) {
    const a = alumnoSel, x = catalogo(cursoDe(a.clase), a)[+caja.dataset.k], est = $(".estado", caja), filas = [];
    caja.querySelectorAll(".chips").forEach((g, i) => {
      const b = g.querySelector('[aria-checked="true"]');
      if (!b) return;
      const nota = +b.dataset.n, cod = indsAl(x, a)[i];
      if (!todas && a.notas[g.dataset.col] === nota) return;   // sin cambios
      filas.push({ col: g.dataset.col, nota, d: { clave: claveGuardada(), nombre: a.nombre, usuario: a.usuario, clase: a.clase, destino: x.destino, ciudad: x.ciudad, personaje: "Profe", programa: "Nota del profe", indicador: cod, valoracion: nota } });
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
        if (e.target.closest("#p-textos") && window.Textos) { window.Textos.activar(true); location.hash = ""; return; }
        if (e.target.closest("#p-salir")) { try { sessionStorage.removeItem(CLAVE_SES); } catch (x) {} datos = null; cambios = {}; pintarClave(); return; }
        const env = e.target.closest(".enviar-p"); if (env) enviarProfe(env.closest(".reto-r"), true);
      }, true);
    }
    if (!datos) pintarClave();
    else if (alumnoSel) pintarAlumno(alumnoSel);
    else pintarGrupo();
  }
  return { pintar, catalogo, notasDe, normCol, resumen, columna, RINC, textoInd, mediasInd };
})();
