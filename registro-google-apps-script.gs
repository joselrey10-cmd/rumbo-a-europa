/*
  Registro de resultados de "Rumbo a Europa"
  Pega este código en Extensiones → Apps Script de tu hoja de Google
  y publícalo como aplicación web (mira LEEME.md).

  Pestañas que crea:
  - "Autoevaluación": lo que cada alumno dice que sabe hacer en Programa y Robótica (aparte de las notas).
  - "Alumnado": la lista importada por el profe (con el correo de la familia).
  - "Resultados": una fila cada vez que un alumno termina (o intenta) una actividad.
  - "Valoraciones": una fila por alumno (usuario Educacyl, o nombre + clase) y una columna por actividad
    e indicador de los cuatro rincones (Crea, Programa, Robótica, Piensa), con la última nota enviada. Las casillas vacías son 0 (no hecho).
  - "Medias por indicador": la media de cada indicador por alumno (se recalcula sola).
*/
// CLAVE DEL PANEL DEL PROFESOR: cámbiala por una tuya (la pedirá la página "Profe" de la web).
// Está solo aquí, en el script, así que el alumnado no la puede ver.
const CLAVE_PROFE = "47001559";

// CORREO PARA LAS RESPUESTAS DE LAS FAMILIAS: si una familia contesta al correo del código, le llega a esta dirección.
// Vacío ("") = las respuestas llegan a esta misma cuenta. Una dirección de otro dominio hace que más correos acaben en spam.
const CORREO_RESPUESTA = "";
// Opciones comunes de los correos (nombre del remitente y, si hay, dirección de respuesta).
function opcionesCorreo(o) { o.name = "Rumbo a Europa · CEIP Tierra de Pinares"; if (CORREO_RESPUESTA) o.replyTo = CORREO_RESPUESTA; return o; }
const htmlDe = (t) => "<div style=\"font-family:Arial,sans-serif;font-size:15px;line-height:1.5\">" + String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>").replace(/(https:\/\/[^\s<]+)/g, "<a href=\"$1\">$1</a>") + "</div>";

// HOJA DE GOOGLE donde se guarda todo. Déjalo vacío ("") y el script usa (o crea) la suya.
// Si quieres usar una hoja que ya tienes, pega aquí su enlace (docs.google.com/spreadsheets/d/...).
const HOJA_URL = "https://docs.google.com/spreadsheets/d/1_6XcAUVOc52FE5fTFvh8pritJGjrx_7n3RM0rPN1QjY/edit";

// DIRECCIÓN DE LA WEB que se pone en los correos con el código para las familias.
const WEB_FAMILIAS = "https://rumbo-a-europa.vercel.app/#familias";
// Días que vale el código cuando lo envía el profe desde el panel.
const DIAS_CODIGO_PROFE = 7;

const COLUMNAS = ["Fecha", "Nombre", "Usuario Educacyl", "Clase", "Actividad", "Ciudad / reto", "Estrellas", "Bloques", "Intentos", "Personaje / robot", "Programa", "Nº indicador", "Valoración (0-5)"];

function doPost(e) {
  const libro = abrirLibro();
  const pedido = JSON.parse(e.postData.contents);
  if (pedido.accion === "datos") return datosProfe(libro, pedido);
  if (pedido.accion === "importar") return importarAlumnado(libro, pedido);
  if (pedido.accion === "borrar") return borrarAlumno(libro, pedido);
  if (pedido.accion === "autoevaluacion") return guardarAutoevaluacion(libro, pedido);
  if (pedido.accion === "familiaCodigo") return familiaCodigo(libro, pedido);
  if (pedido.accion === "familiaDatos") return familiaDatos(libro, pedido);
  if (pedido.accion === "nombresGrupo") return nombresGrupo(libro, pedido);
  if (pedido.accion === "comprobarAlumno") return comprobarAlumno(libro, pedido);
  if (pedido.accion === "enviarCodigos") return enviarCodigos(libro, pedido);
  if (pedido.accion === "textos") return leerTextos(libro);
  if (pedido.accion === "guardarTexto") return guardarTexto(libro, pedido);
  const hoja = libro.getSheetByName("Resultados") || libro.insertSheet("Resultados");
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, COLUMNAS.length).setFontWeight("bold");
  } else if (hoja.getRange(1, 3).getValue() !== "Usuario Educacyl") {
    // Hoja de la versión anterior: añade la columna del usuario detrás del nombre.
    hoja.insertColumnAfter(2);
    hoja.getRange(1, 3).setValue("Usuario Educacyl").setFontWeight("bold");
  }
  const d = pedido;
  const limpiar = (v, max) => String(v == null ? "" : v).slice(0, max);
  const clase = normGrupo(limpiar(d.clase, 12));
  const usuario = usuarioDeLista(libro, limpiar(d.nombre, 60), limpiar(d.usuario, 60), clase);
  const nombre = nombreCompleto(libro, limpiar(d.nombre, 60), usuario);
  const nota = d.valoracion === "" || d.valoracion == null ? "" : Number(d.valoracion);
  hoja.appendRow([
    new Date(d.fecha), nombre, usuario, clase, limpiar(d.destino, 60), limpiar(d.ciudad, 40),
    d.estrellas === "" ? "" : Number(d.estrellas), Number(d.bloques) || "", Number(d.intentos) || "",
    limpiar(d.personaje, 30), limpiar(d.programa, 500), limpiar(d.indicador, 10), nota
  ]);
  if (nota !== "") {
    const columna = limpiar(d.destino, 60) + (d.indicador ? " · Ind. " + limpiar(d.indicador, 10) : "");
    actualizarValoraciones(libro, nombre, usuario, clase, columna, nota);
  }
  return ContentService.createTextOutput("ok");
}

// Panel del profesor: devuelve la pestaña "Valoraciones" (solo con la clave correcta).
function datosProfe(libro, d) {
  const salida = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  if (CLAVE_PROFE === "cambia-esta-clave") return salida({ ok: false, error: "Primero cambia CLAVE_PROFE en el script de la hoja y crea una nueva versión." });
  if (String(d.clave || "") !== CLAVE_PROFE) return salida({ ok: false, error: "Clave incorrecta." });
  // Retos de Crea terminados (filas de Resultados cuyo Programa empieza por "Terminado").
  const hechos = [];
  const res = libro.getSheetByName("Resultados");
  if (res && res.getLastRow() > 1) {
    const r = res.getDataRange().getValues(), c = r[0];
    const i = (t) => c.indexOf(t);
    const iF = i("Fecha"), iN = i("Nombre"), iU = i("Usuario Educacyl"), iC = i("Clase"), iA = i("Actividad"), iP = i("Programa");
    r.slice(1).forEach((f) => {
      if (String(f[iP]).indexOf("Terminado") === 0) hechos.push([f[iN], iU >= 0 ? f[iU] : "", f[iC], f[iA], f[iP], f[iF] instanceof Date ? f[iF].toISOString() : String(f[iF])]);
    });
  }
  const au = libro.getSheetByName("Autoevaluación");
  const autoeval = au && au.getLastRow() > 0 ? au.getDataRange().getValues() : [];
  const al = libro.getSheetByName("Alumnado");
  const alumnado = al && al.getLastRow() > 1 ? al.getRange(2, 1, al.getLastRow() - 1, ALUMNADO.length).getValues() : [];
  const hoja = libro.getSheetByName("Valoraciones");
  if (!hoja || hoja.getLastRow() < 1) return salida({ ok: true, cab: [], filas: [], hechos, alumnado, autoeval });
  const v = hoja.getDataRange().getValues();
  return salida({ ok: true, cab: v[0], filas: v.slice(1), hechos, alumnado, autoeval });
}

/* ---------- Autoevaluación (Programa y Robótica) ---------- */
// Pestaña "Autoevaluación": una fila por alumno y una columna por rincón e indicador ("Programa · Ind. 3.2.1"),
// con lo que el alumno dice que sabe hacer (0-5). Va aparte: no cuenta en las medias de las notas.
function guardarAutoevaluacion(libro, d) {
  const limpiar = (v, max) => String(v == null ? "" : v).slice(0, max);
  const clase = normGrupo(limpiar(d.clase, 12)), rincon = limpiar(d.rincon, 20);
  const usuario = usuarioDeLista(libro, limpiar(d.nombre, 60), limpiar(d.usuario, 60), clase);
  const nombre = nombreCompleto(libro, limpiar(d.nombre, 60), usuario);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const h = libro.getSheetByName("Autoevaluación") || libro.insertSheet("Autoevaluación");
    if (h.getLastRow() === 0) { h.appendRow(["Fecha", "Nombre", "Usuario Educacyl", "Clase"]); h.setFrozenRows(1); h.setFrozenColumns(4); h.getRange(1, 1, 1, 4).setFontWeight("bold"); }
    const cab = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0];
    const filas = h.getLastRow() > 1 ? h.getRange(2, 1, h.getLastRow() - 1, 4).getValues() : [];
    const igual = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    let fila = filas.findIndex((f) => usuario ? igual(f[2], usuario) : (igual(f[1], nombre) && igual(normGrupo(f[3]), clase))) + 2;
    if (fila < 2) fila = h.getLastRow() + 1;
    h.getRange(fila, 1, 1, 4).setValues([[new Date(), nombre, usuario || (filas[fila - 2] || [])[2] || "", clase]]);
    Object.keys(d.notas || {}).slice(0, 60).forEach((cod) => {
      const n = Number(d.notas[cod]); if (!(n >= 0 && n <= 5)) return;
      const t = rincon + " · Ind. " + limpiar(cod, 10);
      let col = cab.indexOf(t) + 1;
      if (!col) { cab.push(t); col = cab.length; h.getRange(1, col).setValue(t).setFontWeight("bold"); }
      h.getRange(fila, col).setValue(n);
    });
    SpreadsheetApp.flush();
    ordenarHoja(libro, "Autoevaluación", 1, 2, 3);
    return ContentService.createTextOutput("ok");
  } finally { lock.releaseLock(); }
}

/* ---------- Alumnado (importado por el profe desde un CSV) ---------- */
const ALUMNADO = ["Nombre", "Apellidos", "Usuario Educacyl", "Clase", "Correo familia"];
const json = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const minus = (v) => String(v == null ? "" : v).trim().toLowerCase();
// Grupo como P5A, P5B, P6A, P6B (P = Primaria). Convierte también el nombre antiguo 5ºA. Otros grupos (I5A de Infantil…) se quedan como están.
function normGrupo(t) {
  const s = String(t == null ? "" : t).trim();
  const m = /^p\s*([56])\s*([ab])$/i.exec(s) || /^([56])\s*[º°o.]*\s*([ab])$/i.exec(s);   // P5A, o el nombre antiguo 5ºA
  return m ? "P" + m[1] + m[2].toUpperCase() : String(t == null ? "" : t).trim();
}

function hojaAlumnado(libro) {
  const h = libro.getSheetByName("Alumnado") || libro.insertSheet("Alumnado");
  if (h.getLastRow() === 0) { h.appendRow(ALUMNADO); h.setFrozenRows(1); h.getRange(1, 1, 1, ALUMNADO.length).setFontWeight("bold"); }
  return h;
}

// Añade o actualiza alumnos por su usuario de Educacyl. El correo de la familia (hasta dos, separados por coma)
// solo se cambia si viene escrito; "-" lo borra.
function importarAlumnado(libro, d) {
  if (CLAVE_PROFE === "cambia-esta-clave" || String(d.clave || "") !== CLAVE_PROFE) return json({ ok: false, error: "Clave incorrecta." });
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = hojaAlumnado(libro);
    const filas = h.getLastRow() > 1 ? h.getRange(2, 1, h.getLastRow() - 1, ALUMNADO.length).getValues() : [];
    const pos = {}; filas.forEach((f, i) => { if (f[2]) pos[minus(f[2])] = i; });
    let nuevos = 0, cambiados = 0, sinUsuario = 0;
    (d.alumnos || []).slice(0, 2000).forEach((a) => {
      const u = String(a.usuario || "").trim().slice(0, 60);
      if (!u) { sinUsuario++; return; }
      if (["P5A", "P5B", "P6A", "P6B"].indexOf(String(a.clase || "").trim()) < 0) { sinUsuario++; return; }   // solo esos grupos
      const fila = limpiarFilaAlumno([String(a.nombre || "").trim().slice(0, 60), String(a.apellidos || "").trim().slice(0, 60), u, normGrupo(String(a.clase || "").trim().slice(0, 12)), String(a.correo || "").trim().slice(0, 250)]);
      if (String(a.correo || "").trim() === "-") fila[4] = "-";
      const i = pos[minus(u)];
      if (fila[4] === "-") fila[4] = i === undefined ? "" : "-";
      if (i === undefined) { pos[minus(u)] = filas.length; filas.push(fila); nuevos++; }
      else {
        const v = filas[i];
        filas[i] = [fila[0] || v[0], fila[1] || v[1], v[2], fila[3] || v[3], fila[4] === "-" ? "" : (fila[4] || v[4])];
        cambiados++;
      }
    });
    if (filas.length) h.getRange(2, 1, filas.length, ALUMNADO.length).setValues(filas);
    SpreadsheetApp.flush();
    ordenarTodo(libro);
    return json({ ok: true, nuevos, cambiados, sinUsuario });
  } finally { lock.releaseLock(); }
}

/* ---------- Consulta de las familias ---------- */
// 1) La familia escribe su correo: si está en la pestaña Alumnado, se le envía un código de 6 cifras (vale 15 minutos).
function familiaCodigo(libro, d) {
  const correo = minus(d.correo);
  const resp = { ok: true, mensaje: "Si ese correo está registrado en el colegio, recibirás un código en unos minutos." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return json({ ok: false, error: "Escribe un correo válido." });
  const cache = CacheService.getScriptCache();
  if (cache.get("espera_" + correo)) { console.log("Familias: " + correo + " ya pidió un código hace menos de 1 minuto."); return json(resp); }
  const h = libro.getSheetByName("Alumnado");
  const filas = h && h.getLastRow() > 1 ? h.getRange(2, 1, h.getLastRow() - 1, ALUMNADO.length).getValues() : [];
  const hijos = filas.filter((f) => minus(f[4]).split(/[;,\s]+/).indexOf(correo) >= 0);
  console.log("Familias: " + correo + " → " + hijos.length + " alumno(s) con ese correo en la pestaña Alumnado.");
  if (!hijos.length) return json(resp);
  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  cache.put("codigo_" + correo, JSON.stringify({ codigo, fallos: 0 }), 900);
  cache.put("espera_" + correo, "1", 60);
  const texto = "Hola:\n\nTu código para ver los resultados de " + hijos.map((f) => f[0]).join(" y ") + " en Rumbo a Europa es: " + codigo +
    "\n\nEl código vale 15 minutos. Si no lo has pedido tú, no hagas nada.\n\nCEIP Tierra de Pinares";
  MailApp.sendEmail(opcionesCorreo({ to: correo, subject: "Código de acceso a Rumbo a Europa", body: texto, htmlBody: htmlDe(texto) }));
  return json(resp);
}

// 2) Con el código correcto devuelve solo los datos de sus hijos.
function familiaDatos(libro, d) {
  const correo = minus(d.correo), cache = CacheService.getScriptCache();
  const props = PropertiesService.getScriptProperties();
  const p = JSON.parse(props.getProperty("fam_" + correo) || "null");   // código enviado por el profe (vale varios días)
  const delProfe = p && p.hasta > Date.now() && String(d.codigo || "").trim() === p.codigo;
  const g = JSON.parse(cache.get("codigo_" + correo) || "null");
  if (!g && !delProfe) {
    if (p && p.hasta > Date.now()) {
      p.fallos = (p.fallos || 0) + 1;
      if (p.fallos >= 5) props.deleteProperty("fam_" + correo); else props.setProperty("fam_" + correo, JSON.stringify(p));
      return json({ ok: false, error: p.fallos >= 5 ? "Demasiados intentos. Pide un código nuevo." : "Código incorrecto." });
    }
    return json({ ok: false, error: "El código ha caducado. Pide uno nuevo." });
  }
  if (!delProfe && String(d.codigo || "").trim() !== g.codigo) {
    g.fallos++;
    if (g.fallos >= 5) cache.remove("codigo_" + correo); else cache.put("codigo_" + correo, JSON.stringify(g), 900);
    return json({ ok: false, error: g.fallos >= 5 ? "Demasiados intentos. Pide un código nuevo." : "Código incorrecto." });
  }
  const h = libro.getSheetByName("Alumnado");
  const filas = h && h.getLastRow() > 1 ? h.getRange(2, 1, h.getLastRow() - 1, ALUMNADO.length).getValues() : [];
  const hijos = filas.filter((f) => minus(f[4]).split(/[;,\s]+/).indexOf(correo) >= 0);
  const val = libro.getSheetByName("Valoraciones");
  const v = val && val.getLastRow() > 0 ? val.getDataRange().getValues() : [[]];
  const cab = v[0], iU = cab.indexOf("Usuario Educacyl");
  const res = libro.getSheetByName("Resultados");
  const r = res && res.getLastRow() > 1 ? res.getDataRange().getValues() : [[]];
  const rc = r[0], rU = rc.indexOf("Usuario Educacyl"), rA = rc.indexOf("Actividad"), rP = rc.indexOf("Programa"), rF = rc.indexOf("Fecha");
  return json({ ok: true, cab, hijos: hijos.map((f) => ({
    nombre: f[0], apellidos: f[1], usuario: f[2], clase: f[3],
    fila: iU >= 0 ? (v.slice(1).find((x) => minus(x[iU]) === minus(f[2])) || null) : null,
    hechos: rU >= 0 ? r.slice(1).filter((x) => minus(x[rU]) === minus(f[2]) && String(x[rP]).indexOf("Terminado") === 0)
      .map((x) => [x[rA], x[rP], x[rF] instanceof Date ? x[rF].toISOString() : String(x[rF])]) : []
  })) });
}

// Prueba: abre la URL de la aplicación web en el navegador. Si todo está bien verás
// "Funciona" y aparecerá una fila de prueba en la pestaña Resultados.
// Busca la hoja: la del script si está unido a una hoja; si no, la guardada; si no hay, crea una nueva.
function abrirLibro() {
  const activo = SpreadsheetApp.getActiveSpreadsheet();
  if (activo) return activo;
  if (HOJA_URL) return SpreadsheetApp.openByUrl(HOJA_URL);
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("HOJA_ID");
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  const nuevo = SpreadsheetApp.create("Rumbo a Europa · Resultados");
  props.setProperty("HOJA_ID", nuevo.getId());
  return nuevo;
}

function doGet() {
  doPost({ postData: { contents: JSON.stringify({ fecha: new Date().toISOString(), nombre: "PRUEBA", clase: "-", destino: "Prueba de conexión", ciudad: "", estrellas: "", valoracion: "" }) } });
  return ContentService.createTextOutput("Funciona: revisa la pestaña Resultados de tu hoja: " + abrirLibro().getUrl());
}

function actualizarValoraciones(libro, nombre, usuario, clase, columna, nota) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const hoja = libro.getSheetByName("Valoraciones") || libro.insertSheet("Valoraciones");
    if (hoja.getLastRow() === 0) {
      hoja.appendRow(["Nombre", "Usuario Educacyl", "Clase"]);
      hoja.setFrozenRows(1); hoja.setFrozenColumns(3);
      hoja.getRange(1, 1, 1, 3).setFontWeight("bold");
    } else if (hoja.getRange(1, 2).getValue() !== "Usuario Educacyl") {
      hoja.insertColumnAfter(1);
      hoja.getRange(1, 2).setValue("Usuario Educacyl").setFontWeight("bold");
      hoja.setFrozenColumns(3);
    }
    const cab = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
    let col = cab.indexOf(columna) + 1;
    if (!col) { col = cab.length + 1; hoja.getRange(1, col).setValue(columna).setFontWeight("bold"); }
    const filas = hoja.getLastRow() > 1 ? hoja.getRange(2, 1, hoja.getLastRow() - 1, 3).getValues() : [];
    const igual = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    // El alumno se reconoce por su usuario de Educacyl; si no lo tiene, por nombre y clase.
    let fila = filas.findIndex((f) => usuario ? igual(f[1], usuario) : (igual(f[0], nombre) && igual(normGrupo(f[2]), clase))) + 2;
    if (fila < 2) { fila = hoja.getLastRow() + 1; hoja.getRange(fila, 1, 1, 3).setValues([[nombre, usuario, clase]]); }
    else hoja.getRange(fila, 1, 1, 3).setValues([[nombre, usuario || filas[fila - 2][1], clase]]);
    // Se guarda la última nota enviada (el alumno puede revisarla y volver a enviarla).
    hoja.getRange(fila, col).setValue(nota);
    SpreadsheetApp.flush();
    ordenarHoja(libro, "Valoraciones", 0, 1, 2);
    calcularMedias(libro);
  } finally {
    lock.releaseLock();
  }
}

// Pestaña "Medias por indicador": una fila por alumno y una columna por indicador,
// con la media de todas las actividades de ese indicador (las no hechas cuentan 0).
function calcularMedias(libro) {
  const val = libro.getSheetByName("Valoraciones");
  if (!val || val.getLastRow() < 2) { const m = libro.getSheetByName("Medias por indicador"); if (m) m.clearContents(); return; }
  const datos = val.getDataRange().getValues(), cab = datos[0];
  const grupos = {};
  cab.forEach((t, i) => { const m = String(t).match(/Ind\. ([\d.]+)$/); if (m) (grupos[m[1]] = grupos[m[1]] || []).push(i); });
  const cods = Object.keys(grupos).sort();
  const filas = [["Nombre", "Usuario Educacyl", "Clase"].concat(cods.map((c) => "Media Ind. " + c + " (" + grupos[c].length + " act.)"))];
  datos.slice(1).forEach((f) => {
    filas.push([f[0], f[1], f[2]].concat(cods.map((c) => {
      const n = grupos[c].map((i) => Number(f[i]) || 0);
      return Math.round(n.reduce((a, b) => a + b, 0) / n.length * 10) / 10;
    })));
  });
  const hoja = libro.getSheetByName("Medias por indicador") || libro.insertSheet("Medias por indicador");
  hoja.clearContents();
  hoja.getRange(1, 1, filas.length, filas[0].length).setValues(filas);
  hoja.getRange(1, 1, 1, filas[0].length).setFontWeight("bold");
  hoja.setFrozenRows(1); hoja.setFrozenColumns(3);
}

/* ---------- Orden por clase y apellidos ---------- */
// Las pestañas Alumnado, Valoraciones, Autoevaluación y Medias se ordenan por clase, luego apellidos y luego nombre.
// Los apellidos salen de la pestaña Alumnado (por el usuario de Educacyl); si el alumno no está, de su nombre
// escrito (todo lo que va detrás de la primera palabra). "Resultados" se queda por fecha, como un diario.
function mapaApellidos(libro) {
  const h = libro.getSheetByName("Alumnado"), m = {};
  if (h && h.getLastRow() > 1) h.getRange(2, 1, h.getLastRow() - 1, 3).getValues().forEach((f) => { if (f[2]) m[minus(f[2])] = [String(f[1] || ""), String(f[0] || "")]; });
  return m;
}
// Nombre del alumno en las pestañas: "Apellidos, Nombre" (de la pestaña Alumnado si está importado).
function nombreCompleto(libro, nombre, usuario, mapa) {
  const a = usuario ? (mapa || mapaApellidos(libro))[minus(usuario)] : null;
  if (!a) return nombre;
  return a[0] ? a[0] + ", " + a[1] : a[1];
}
function claveOrden(mapa, nombre, usuario, clase, apellidos) {
  let ap = apellidos, no = nombre;
  if (ap == null) {
    const a = mapa[minus(usuario)];
    if (a) { ap = a[0]; no = a[1]; }
    else if (String(nombre).indexOf(", ") > 0) { const p = String(nombre).split(", "); ap = p[0]; no = p.slice(1).join(", "); }
    else { const p = String(nombre || "").trim().split(/\s+/); no = p.shift() || ""; ap = p.join(" "); }
  }
  return [minus(clase), minus(ap), minus(no)];
}
function ordenarHoja(libro, nombreHoja, iN, iU, iC, iA) {
  const h = libro.getSheetByName(nombreHoja);
  if (!h || h.getLastRow() < 3) return;
  const mapa = mapaApellidos(libro), n = h.getLastRow() - 1, c = h.getLastColumn();
  const filas = h.getRange(2, 1, n, c).getValues();
  const cmp = (x, y) => { for (let i = 0; i < 3; i++) { const r = x[i].localeCompare(y[i], "es"); if (r) return r; } return 0; };
  // Fuera de Alumnado, el nombre se escribe como "Apellidos, Nombre".
  filas.forEach((f) => { f[iC] = normGrupo(f[iC]); if (iA == null) f[iN] = nombreCompleto(libro, f[iN], f[iU], mapa); });
  const ord = filas.map((f) => ({ f, k: claveOrden(mapa, f[iN], f[iU], f[iC], iA == null ? null : f[iA]) })).sort((a, b) => cmp(a.k, b.k)).map((x) => x.f);
  h.getRange(2, 1, n, c).setValues(ord);
}
// Arregla la pestaña Alumnado: separa "APELLIDOS, NOMBRE" si vino todo junto en Nombre,
// y quita de "Correo familia" el correo Educacyl del propio alumno (usuario@educa...).
function limpiarFilaAlumno(f) {
  if (!String(f[1] || "").trim() && String(f[0] || "").indexOf(",") > 0) {
    const p = String(f[0]).split(","); f[1] = p[0].trim(); f[0] = p.slice(1).join(",").trim();
  }
  const u = minus(f[2]).replace(/@.*$/, "");
  f[4] = minus(f[4]).split(/[;,\s]+/).filter((c) => c && (!u || c.replace(/@.*$/, "") !== u)).join(", ");
  return f;
}
function limpiarAlumnado(libro) {
  const h = libro.getSheetByName("Alumnado");
  if (!h || h.getLastRow() < 2) return;
  const r = h.getRange(2, 1, h.getLastRow() - 1, ALUMNADO.length);
  r.setValues(r.getValues().map(limpiarFilaAlumno));
}
function ordenarTodo(libro) {
  libro = libro || abrirLibro();
  limpiarAlumnado(libro);
  ordenarHoja(libro, "Alumnado", 0, 2, 3, 1);
  ordenarHoja(libro, "Valoraciones", 0, 1, 2);
  ordenarHoja(libro, "Autoevaluación", 1, 2, 3);
  SpreadsheetApp.flush();
  calcularMedias(libro);
}

/* ---------- Dar de baja a un alumno (panel del profe) ---------- */
// Borra al alumno de Alumnado, Valoraciones, Autoevaluación y Resultados (por su usuario; si no tiene, por nombre y clase).
function borrarAlumno(libro, d) {
  if (CLAVE_PROFE === "cambia-esta-clave" || String(d.clave || "") !== CLAVE_PROFE) return json({ ok: false, error: "Clave incorrecta." });
  const usuario = minus(d.usuario), nombre = minus(d.nombre), clase = minus(normGrupo(d.clase));
  if (!usuario && !nombre) return json({ ok: false, error: "Falta el alumno." });
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const borradas = {};
    ["Alumnado", "Valoraciones", "Autoevaluación", "Resultados"].forEach((t) => {
      const h = libro.getSheetByName(t);
      if (!h || h.getLastRow() < 2) return;
      const v = h.getDataRange().getValues(), cab = v[0].map(String);
      const iU = cab.indexOf("Usuario Educacyl"), iN = cab.indexOf("Nombre"), iC = cab.indexOf("Clase"), iA = cab.indexOf("Apellidos");
      const nombreDe = (f) => minus(iA >= 0 ? (f[iN] + " " + f[iA]) : f[iN]);
      const es = (f) => usuario ? (iU >= 0 && minus(f[iU]) === usuario) : (nombreDe(f) === nombre && minus(normGrupo(f[iC])) === clase && !(iU >= 0 && f[iU]));
      const quedan = v.slice(1).filter((f) => !es(f));
      const n = v.length - 1 - quedan.length;
      if (!n) return;
      borradas[t] = n;
      h.getRange(2, 1, v.length - 1, cab.length).clearContent();
      if (quedan.length) h.getRange(2, 1, quedan.length, cab.length).setValues(quedan);
    });
    SpreadsheetApp.flush();
    calcularMedias(libro);
    return json({ ok: true, borradas });
  } finally { lock.releaseLock(); }
}

/* ---------- Prueba del correo de las familias ---------- */
// Elige "probarCorreo" arriba y pulsa Ejecutar: te envía un correo de prueba a ti y te dice
// en el registro cuántos correos de familias hay guardados en la pestaña Alumnado.
function probarCorreo() {
  const yo = Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(opcionesCorreo({ to: yo, subject: "Prueba de Rumbo a Europa", body: "Si lees esto, el envío de códigos a las familias funciona." }));
  const h = abrirLibro().getSheetByName("Alumnado");
  const filas = h && h.getLastRow() > 1 ? h.getRange(2, 1, h.getLastRow() - 1, ALUMNADO.length).getValues() : [];
  const conCorreo = filas.filter((f) => String(f[4] || "").trim());
  console.log("Hoja: " + abrirLibro().getUrl());
  console.log("Correo de prueba enviado a " + yo + ". Quedan " + MailApp.getRemainingDailyQuota() + " envíos hoy.");
  console.log("Alumnado: " + filas.length + " alumnos, " + conCorreo.length + " con correo de familia.");
  conCorreo.slice(0, 5).forEach((f) => console.log("  " + f[1] + ", " + f[0] + " (" + f[3] + "): " + f[4]));
}

/* ---------- Lista de nombres para el alumnado ---------- */
const GRUPOS_VALIDOS = ["P5A", "P5B", "P6A", "P6B"];
function filasAlumnado(libro) {
  const h = libro.getSheetByName("Alumnado");
  return h && h.getLastRow() > 1 ? h.getRange(2, 1, h.getLastRow() - 1, ALUMNADO.length).getValues() : [];
}
const textoAlumno = (f) => (String(f[1] || "").trim() ? String(f[1]).trim() + ", " : "") + String(f[0] || "").trim();

// Devuelve solo los nombres ("Apellidos, Nombre") de un grupo, para el desplegable. Ni usuarios ni correos.
function nombresGrupo(libro, d) {
  const clase = normGrupo(d.clase);
  if (GRUPOS_VALIDOS.indexOf(clase) < 0) return json({ ok: false, nombres: [] });
  const nombres = filasAlumnado(libro).filter((f) => normGrupo(f[3]) === clase && f[2]).map(textoAlumno)
    .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  return json({ ok: true, nombres });
}
// Comprueba si el usuario escrito es el del alumno elegido (solo dice sí o no).
function comprobarAlumno(libro, d) {
  const clase = normGrupo(d.clase), nombre = minus(d.nombre), usuario = minus(d.usuario);
  const f = filasAlumnado(libro).find((x) => normGrupo(x[3]) === clase && minus(textoAlumno(x)) === nombre);
  if (!f) return json({ ok: true, enLista: false });
  return json({ ok: true, enLista: true, coincide: !!usuario && minus(f[2]) === usuario });
}
// Si el alumno eligió su nombre de la lista pero escribió mal su usuario, se usa el de la lista (así no hay alumnos repetidos).
function usuarioDeLista(libro, nombre, usuario, clase) {
  const filas = filasAlumnado(libro);
  if (!filas.length) return usuario;
  if (usuario && filas.some((f) => minus(f[2]) === minus(usuario))) return usuario;
  const f = filas.find((x) => normGrupo(x[3]) === clase && minus(textoAlumno(x)) === minus(nombre));
  return f ? String(f[2]) : usuario;
}

/* ---------- El profe envía el código a las familias desde el panel ---------- */
function enviarCodigos(libro, d) {
  if (CLAVE_PROFE === "cambia-esta-clave" || String(d.clave || "") !== CLAVE_PROFE) return json({ ok: false, error: "Clave incorrecta." });
  const quienes = (d.usuarios || []).map(minus);
  const filas = filasAlumnado(libro).filter((f) => quienes.indexOf(minus(f[2])) >= 0);
  // Un código por correo (una familia con dos hijos recibe un solo código para los dos).
  const porCorreo = {};
  filas.forEach((f) => minus(f[4]).split(/[;,\s]+/).filter((c) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c))
    .forEach((c) => (porCorreo[c] = porCorreo[c] || []).push(String(f[0] || ""))));
  const correos = Object.keys(porCorreo);
  if (correos.length > MailApp.getRemainingDailyQuota()) return json({ ok: false, error: "Hoy ya no quedan envíos suficientes de Google. Prueba mañana o con menos familias." });
  const props = PropertiesService.getScriptProperties(), hasta = Date.now() + DIAS_CODIGO_PROFE * 86400000;
  let enviados = 0; const fallos = [];
  correos.forEach((c) => {
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    try {
      const texto = "Hola:\n\nYa podéis consultar los resultados de " + porCorreo[c].join(" y ") + " en Rumbo a Europa.\n\n" +
          "1. Entrad en " + WEB_FAMILIAS + "\n2. Escribid este correo: " + c + "\n3. Pulsad «Ya tengo un código» y escribid: " + codigo +
          "\n\nEl código vale " + DIAS_CODIGO_PROFE + " días. Después podéis pedir uno nuevo desde la misma página.\n\nCEIP Tierra de Pinares";
      MailApp.sendEmail(opcionesCorreo({ to: c, subject: "Resultados de Rumbo a Europa: código de acceso", body: texto, htmlBody: htmlDe(texto) }));
      props.setProperty("fam_" + c, JSON.stringify({ codigo, hasta, fallos: 0 }));
      enviados++;
    } catch (e) { fallos.push(c); }
  });
  const sinCorreo = quienes.length - filas.filter((f) => String(f[4] || "").trim()).length;
  console.log("Códigos enviados por el profe: " + enviados + " correos; fallos: " + fallos.join(", "));
  return json({ ok: true, enviados, sinCorreo, fallos });
}

// Prueba de entrega: escribe tu correo personal entre las comillas, elige "probarEntrega" y pulsa Ejecutar.
// Envía 3 correos distintos para ver cuál llega (A, B y C en el asunto).
const PRUEBA_A = "";
function probarEntrega() {
  if (!PRUEBA_A) throw new Error("Escribe tu correo en PRUEBA_A (justo encima de esta función) y guarda.");
  MailApp.sendEmail(PRUEBA_A, "Prueba A Rumbo a Europa", "Correo A: envío sencillo, sin nombre ni respuesta.");
  MailApp.sendEmail({ to: PRUEBA_A, name: "Rumbo a Europa · CEIP Tierra de Pinares", replyTo: CORREO_RESPUESTA || "rumboaeuropa@ceiptierradepinares.com",
    subject: "Prueba B Rumbo a Europa", body: "Correo B: igual que el de las familias (con nombre y dirección de respuesta)." });
  GmailApp.sendEmail(PRUEBA_A, "Prueba C Rumbo a Europa", "Correo C: enviado con Gmail en vez de MailApp.", { name: "Rumbo a Europa · CEIP Tierra de Pinares" });
  console.log("Enviados A, B y C a " + PRUEBA_A + ". Quedan " + MailApp.getRemainingDailyQuota() + " envíos hoy.");
}

/* ---------- Textos cambiados por el profe ----------
   Pestaña «Textos»: Pantalla | Texto original | Texto nuevo | Fecha. La lee toda la web al cargar (no tiene datos del alumnado).
   Se puede corregir a mano: si borras una fila, vuelve el texto original. */
const COL_TEXTOS = ["Pantalla", "Texto original", "Texto nuevo", "Fecha"];
function hojaTextos(libro) {
  let h = libro.getSheetByName("Textos");
  if (!h) {
    h = libro.insertSheet("Textos");
    h.appendRow(COL_TEXTOS); h.setFrozenRows(1);
    h.getRange(1, 1, 1, COL_TEXTOS.length).setFontWeight("bold");
    h.setColumnWidth(2, 380); h.setColumnWidth(3, 380);
  }
  return h;
}
function leerTextos(libro) {
  const h = libro.getSheetByName("Textos"), textos = {};
  if (h && h.getLastRow() > 1) {
    h.getRange(2, 1, h.getLastRow() - 1, 3).getValues().forEach((f) => {
      const nuevo = String(f[2] || "").trim();
      if (f[1] !== "" && nuevo) textos[String(f[0] || "#") + "|" + String(f[1]).replace(/\s+/g, " ").trim()] = nuevo;
    });
  }
  return json({ ok: true, textos: textos });
}
function guardarTexto(libro, d) {
  if (CLAVE_PROFE === "cambia-esta-clave" || String(d.clave || "") !== CLAVE_PROFE) return json({ ok: false, error: "Clave incorrecta: entra otra vez en el panel del profe." });
  const id = String(d.id || ""), i = id.indexOf("|");
  if (i < 1) return json({ ok: false, error: "Texto no válido." });
  const pantalla = id.slice(0, i).slice(0, 40), original = id.slice(i + 1).slice(0, 2000);
  const nuevo = String(d.texto || "").replace(/\s+/g, " ").trim().slice(0, 2000);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = hojaTextos(libro), n = h.getLastRow() - 1;
    const filas = n > 0 ? h.getRange(2, 1, n, 2).getValues() : [];
    let fila = -1;
    filas.forEach((f, k) => { if (String(f[0]) === pantalla && String(f[1]).replace(/\s+/g, " ").trim() === original) fila = k + 2; });
    if (!nuevo) { if (fila > 0) h.deleteRow(fila); }
    else if (fila > 0) h.getRange(fila, 3, 1, 2).setValues([[nuevo, new Date()]]);
    else h.appendRow([pantalla, original, nuevo, new Date()]);
  } finally { lock.releaseLock(); }
  return json({ ok: true });
}
