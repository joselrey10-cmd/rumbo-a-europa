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
  - "Progreso por rutas": nota proporcional por pantallas superadas en Programa y cada modalidad de Robótica.
  - "Accesos alumnado": contraseñas elegidas por el alumnado, para recuperación por el profesor.
*/
// CLAVE DEL PANEL DEL PROFESOR: cámbiala por una tuya (la pedirá la página "Profe" de la web).
// Está solo aquí, en el script, así que el alumnado no la puede ver.
const CLAVE_PROFE = "cambia-esta-clave";   // pon aquí tu clave SOLO en Apps Script, no en GitHub (el repo es público)

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
// Entrada del alumnado con contraseña elegida por el alumno y recuperable por el docente desde «Accesos alumnado».
// true: las notas solo se guardan si el alumno ha entrado con su código. false: como antes (sin código).
const CODIGO_ALUMNO = true;
const DOMINIO_ALUMNADO = "educa.jcyl.es";    // el correo del alumno es usuario@educa.jcyl.es
const DIAS_SESION_ALUMNO = 120;               // días que el ordenador recuerda que el alumno ha entrado

const COLUMNAS = ["Fecha", "Nombre", "Usuario Educacyl", "Clase", "Actividad", "Ciudad / reto", "Estrellas", "Bloques", "Intentos", "Personaje / robot", "Programa", "Nº indicador", "Valoración (0-5)"];

function doPost(e) {
  const libro = abrirLibro();
  const pedido = JSON.parse(e.postData.contents);
  if (pedido.accion === "datos") return datosProfe(libro, pedido);
  if (pedido.accion === "importar") return importarAlumnado(libro, pedido);
  if (pedido.accion === "guardarCorreosFamilia") return guardarCorreosFamilia(libro, pedido);
  if (pedido.accion === "borrar") return borrarAlumno(libro, pedido);
  if (pedido.accion === "autoevaluacion") return guardarAutoevaluacion(libro, pedido);
  if (pedido.accion === "familiaCodigo") return familiaCodigo(libro, pedido);
  if (pedido.accion === "familiaDatos") return familiaDatos(libro, pedido);
  if (pedido.accion === "nombresGrupo") return nombresGrupo(libro, pedido);
  if (pedido.accion === "comprobarAlumno") return comprobarAlumno(libro, pedido);
  if (pedido.accion === "enviarCodigos") return enviarCodigos(libro, pedido);
  if (pedido.accion === "textos") return leerTextos(libro);
  if (pedido.accion === "alumnoCodigo") return json({ ok: false, error: "El acceso del alumnado ahora se realiza con una contraseña elegida por cada alumno." });
  if (pedido.accion === "alumnoEntrar") return alumnoEntrar(libro, pedido);
  if (pedido.accion === "alumnoSesion") return alumnoSesion(libro, pedido);
  if (pedido.accion === "alumnoResultados") return alumnoResultados(libro, pedido);
  if (pedido.accion === "alumnoDirecto") return alumnoDirecto(libro, pedido);
  if (pedido.accion === "alumnoCambiarCodigo") return alumnoCambiarCodigo(libro, pedido);
  if (pedido.accion === "codigosAlumnos") return json({ ok: false, error: "Las contraseñas se consultan en la pestaña «Accesos alumnado» de la hoja." });
  if (pedido.accion === "adaptacion") return ponerAdaptacion(libro, pedido);
  if (pedido.accion === "excel") return excelProfe(libro, pedido);
  if (pedido.accion === "guardarTexto") return guardarTexto(libro, pedido);
  if (pedido.accion === "retoCadena") return gestionarRetoCadena(libro, pedido);
  if (pedido.accion === "trabajoAlumno") return trabajoAlumno(libro, pedido);
  if (pedido.accion === "comentario") return comentarioProfe(libro, pedido);
  if (pedido.accion === "notasLote") return notasLote(libro, pedido);
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
  // Las notas que pone el profe desde el panel llevan su clave y no necesitan el código del alumno.
  const esProfe = CLAVE_PROFE !== "cambia-esta-clave" && String(d.clave || "") === CLAVE_PROFE;
  const ses = esProfe ? null : alumnoDeSesion(libro, d);
  if (CODIGO_ALUMNO && !ses && !esProfe) { console.log("Nota sin código de acceso: no se guarda (" + limpiar(d.nombre, 60) + ")."); return ContentService.createTextOutput("sesion"); }
  const clase = ses ? ses.clase : normGrupo(limpiar(d.clase, 12));
  const usuario = ses ? ses.usuario : usuarioDeLista(libro, limpiar(d.nombre, 60), limpiar(d.usuario, 60), clase);
  const nombre = ses ? ses.nombre : nombreCompleto(libro, limpiar(d.nombre, 60), usuario);
  const nota = d.valoracion === "" || d.valoracion == null ? "" : Number(d.valoracion);
  hoja.appendRow([
    new Date(d.fecha), nombre, usuario, clase, limpiar(d.destino, 60), limpiar(d.ciudad, 40),
    d.estrellas === "" ? "" : Number(d.estrellas), Number(d.bloques) || "", Number(d.intentos) || "",
    limpiar(d.personaje, 30), limpiar(d.programa, 500), d.indicador ? "'" + limpiar(d.indicador, 10) : "", nota
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
  // Nota de Programa y Robótica por pantallas superadas (pestaña «Progreso por rutas»).
  const pr = libro.getSheetByName("Progreso por rutas");
  const rutas = pr && pr.getLastRow() > 1 ? pr.getRange(2, 1, pr.getLastRow() - 1, 16).getValues().map((f) => f.slice(1)) : [];
  const hoja = libro.getSheetByName("Valoraciones");
  const comentarios = leerComentarios(libro);
  if (!hoja || hoja.getLastRow() < 1) return salida({ ok: true, cab: [], filas: [], hechos, alumnado, autoeval, rutas, comentarios, adaptados: leerAdaptados() });
  const v = hoja.getDataRange().getValues();
  return salida({ ok: true, cab: v[0], filas: v.slice(1), hechos, alumnado, autoeval, rutas, comentarios, adaptados: leerAdaptados() });
}

// Panel del profesor: todo lo que ha hecho un alumno (filas de «Resultados»: pantallas, programas, retos, llaves).
function trabajoAlumno(libro, d) {
  if (CLAVE_PROFE === "cambia-esta-clave" || String(d.clave || "") !== CLAVE_PROFE) return json({ ok: false, error: "Clave incorrecta." });
  const res = libro.getSheetByName("Resultados");
  if (!res || res.getLastRow() < 2) return json({ ok: true, filas: [] });
  const r = res.getDataRange().getValues(), c = r[0].map(String), i = (t) => c.indexOf(t);
  const iF = i("Fecha"), iN = i("Nombre"), iU = i("Usuario Educacyl"), iC = i("Clase"), iA = i("Actividad"), iR = i("Ciudad / reto"),
    iE = i("Estrellas"), iB = i("Bloques"), iI = i("Intentos"), iP = i("Personaje / robot"), iG = i("Programa"), iX = i("Nº indicador"), iV = i("Valoración (0-5)");
  const u = minus(d.usuario), n = minus(d.nombre), cl = normGrupo(d.clase);
  const filas = r.slice(1).filter((f) => u ? minus(f[iU]) === u : (minus(f[iN]) === n && normGrupo(f[iC]) === cl)).map((f) => [
    f[iF] instanceof Date ? f[iF].toISOString() : String(f[iF]), String(f[iA]), String(f[iR]), f[iE], f[iB], f[iI], String(f[iP]), String(f[iG]), codigoDe(f[iX]), f[iV]
  ]);
  return json({ ok: true, filas: filas.slice(-3000) });
}

/* ---------- Autoevaluación (Programa y Robótica) ---------- */
// Pestaña "Autoevaluación": una fila por alumno y una columna por rincón e indicador ("Programa · Ind. 3.2.1"),
// con lo que el alumno dice que sabe hacer (0-5). Va aparte: no cuenta en las medias de las notas.
function guardarAutoevaluacion(libro, d) {
  const limpiar = (v, max) => String(v == null ? "" : v).slice(0, max);
  const ses = alumnoDeSesion(libro, d);
  if (CODIGO_ALUMNO && !ses) return json({ ok: false, sesion: true, error: "Entra con tu contraseña antes de enviar." });
  const rincon = limpiar(d.rincon, 20);
  const clase = ses ? ses.clase : normGrupo(limpiar(d.clase, 12));
  const usuario = ses ? ses.usuario : usuarioDeLista(libro, limpiar(d.nombre, 60), limpiar(d.usuario, 60), clase);
  const nombre = ses ? ses.nombre : nombreCompleto(libro, limpiar(d.nombre, 60), usuario);
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
// Google Sheets convierte «1.1.1» en la fecha 1/1/2001. Esto devuelve el código del indicador aunque la celda sea una fecha.
function codigoDe(v) {
  if (v instanceof Date && !isNaN(v)) {
    const p = Utilities.formatDate(v, Session.getScriptTimeZone(), "d.M.yyyy").split(".");
    return p[0] + "." + p[1] + "." + (Number(p[2]) - 2000);
  }
  return String(v == null ? "" : v).trim().replace(/^'/, "");
}
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

/* Guarda de forma directa los dos correos familiares de un alumno ya registrado. */
function guardarCorreosFamilia(libro, d) {
  if (CLAVE_PROFE === "cambia-esta-clave" || String(d.clave || "") !== CLAVE_PROFE)
    return json({ ok: false, error: "Clave incorrecta." });
  const usuario = minus(d.usuario);
  if (!usuario) return json({ ok: false, error: "Falta el usuario de Educacyl." });
  const correos = Array.from(new Set(String(d.correo || "").toLowerCase().split(/[;,\s]+/)
    .map(c => c.trim()).filter(Boolean))).slice(0, 2);
  if (correos.some(c => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)))
    return json({ ok: false, error: "Revisa las direcciones de correo." });
  const h = hojaAlumnado(libro);
  if (h.getLastRow() < 2) return json({ ok: false, error: "No hay alumnado registrado." });
  const filas = h.getRange(2, 1, h.getLastRow() - 1, ALUMNADO.length).getValues();
  const i = filas.findIndex(f => minus(f[2]) === usuario);
  if (i < 0) return json({ ok: false, error: "No encuentro al alumno. Comprueba su usuario." });
  const valor = correos.join(", ");
  h.getRange(i + 2, 5).setValue(valor);
  SpreadsheetApp.flush();
  return json({ ok: true, correo: valor });
}

/* ---------- Consulta de las familias ---------- */
// Separa y valida los correos de la familia (admite coma, punto y coma o espacios).
function correosFamilia(valor) {
  return Array.from(new Set(String(valor || "").toLowerCase().split(/[;,\s]+/)
    .map((c) => c.trim()).filter((c) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c))));
}

// La familia escribe uno de sus correos: el mismo código se envía a TODOS los correos
// asociados al alumno y queda válido si cualquiera de los dos progenitores lo introduce.
function familiaCodigo(libro, d) {
  const correo = minus(d.correo);
  const resp = { ok: true, mensaje: "Si ese correo está registrado, recibiréis el código en los correos familiares asociados." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return json({ ok: false, error: "Escribe un correo válido." });
  const h = libro.getSheetByName("Alumnado");
  const filas = h && h.getLastRow() > 1 ? h.getRange(2, 1, h.getLastRow() - 1, ALUMNADO.length).getValues() : [];
  const hijos = filas.filter((f) => correosFamilia(f[4]).indexOf(correo) >= 0);
  if (!hijos.length) return json(resp);
  const destinatarios = Array.from(new Set(hijos.reduce((acc, f) => acc.concat(correosFamilia(f[4])), [])));
  const cache = CacheService.getScriptCache();
  if (destinatarios.some((c) => cache.get("espera_" + c))) return json(resp);
  if (destinatarios.length > MailApp.getRemainingDailyQuota()) return json({ ok: false, error: "Hoy no quedan envíos suficientes para enviar el código a los dos correos. Prueba mañana." });
  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  const texto = "Hola:\n\nTu código para ver los resultados de " + hijos.map((f) => f[0]).join(" y ") +
    " en Rumbo a Europa es: " + codigo + "\n\nEste mismo código se ha enviado a los correos familiares registrados y vale 15 minutos. Cualquiera de los dos progenitores puede utilizarlo.\n\nCEIP Tierra de Pinares";
  let enviados = 0; const fallos = [];
  destinatarios.forEach((c) => {
    try {
      MailApp.sendEmail(opcionesCorreo({ to: c, subject: "Código de acceso a Rumbo a Europa", body: texto, htmlBody: htmlDe(texto) }));
      cache.put("codigo_" + c, JSON.stringify({ codigo, fallos: 0 }), 900);
      cache.put("espera_" + c, "1", 60);
      enviados++;
    } catch (e) { fallos.push(c); console.error("No se pudo enviar el código a " + c + ": " + e); }
  });
  if (!enviados) return json({ ok: false, error: "No se ha podido enviar el correo. Comprueba los permisos y la cuota de Google." });
  console.log("Familias: código enviado a " + enviados + " de " + destinatarios.length + " correos. Fallos: " + fallos.join(", "));
  return json({ ok: true, mensaje: fallos.length ? "El código se ha enviado, pero ha fallado uno de los correos. Revisad la dirección del segundo progenitor." : "Código enviado a los dos correos familiares. Cualquiera de los dos puede utilizarlo." });
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
  const hijos = filas.filter((f) => correosFamilia(f[4]).indexOf(correo) >= 0);
  const val = libro.getSheetByName("Valoraciones");
  const v = val && val.getLastRow() > 0 ? val.getDataRange().getValues() : [[]];
  const cab = v[0], iU = cab.indexOf("Usuario Educacyl");
  const res = libro.getSheetByName("Resultados");
  const r = res && res.getLastRow() > 1 ? res.getDataRange().getValues() : [[]];
  const rc = r[0], rU = rc.indexOf("Usuario Educacyl"), rA = rc.indexOf("Actividad"), rP = rc.indexOf("Programa"), rF = rc.indexOf("Fecha");
  const adaptados = leerAdaptados(), coms = leerComentarios(libro);
  return json({ ok: true, cab, hijos: hijos.map((f) => ({
    nombre: f[0], apellidos: f[1], usuario: f[2], clase: f[3], adaptado: adaptados.indexOf(minus(f[2])) >= 0,
    comentarios: comentariosDe(coms, f[2]),
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

/* ---------- Notas para el Excel de evaluación ----------
   Crea una pestaña por grupo («Excel P5A»…) con los alumnos por apellidos y los indicadores EN EL MISMO ORDEN que
   las pestañas TIAC1, TIAC2 y TIAC3 del Excel de evaluación. Se copia el bloque de notas y se pega en el Excel (D9).
   Nota de cada indicador = media de las notas de ese indicador en el trimestre (la última de cada actividad).
   Trimestre: el de la SA de la actividad (Crea · SA1 → 1.º); si no tiene SA, por la fecha (sep-dic 1.º, ene-mar 2.º, abr-ago 3.º).
   Se ejecuta con el botón «Notas para el Excel» del panel o eligiendo prepararExcel aquí arriba. */
const ORDEN_EXCEL = {
  "5º": [
    "1.1.1 1.2.1 1.2.2 2.1.1 2.1.2 2.1.4 2.2.1 2.3.1 3.1.1 3.2.1 3.2.2 3.2.3 3.3.1 3.4.1 4.1.1 4.1.2 4.3.1 4.3.2 4.3.4 5.1.1 5.2.1 5.2.2 5.3.1 5.3.2",
    "1.1.2 1.1.3 1.1.4 1.2.3 2.1.3 2.1.4 2.2.2 3.1.2 3.1.3 3.2.4 3.2.5 3.2.6 3.3.2 4.1.2 4.1.3 4.2.1 4.2.2 4.3.4 5.1.2 5.2.3 5.3.1 5.3.2",
    "1.1.5 2.1.4 2.2.3 2.3.2 3.1.4 3.2.7 3.2.8 3.2.9 3.3.3 3.4.2 4.1.2 4.1.4 4.2.3 4.3.3 4.3.4 5.1.3 5.2.1 5.2.4 5.3.1 5.3.2 5.3.3"
  ],
  "6º": [
    "1.1.1 1.1.2 1.1.4 1.2.1 1.2.2 1.2.3 2.1.1 2.3.1 3.1.4 3.2.1 3.2.2 3.2.5 3.2.6 3.3.1 4.1.1 4.1.2 4.3.1 4.3.2 5.2.1",
    "1.1.2 1.1.3 2.1.1 2.2.2 2.3.2 3.1.1 3.1.2 3.1.4 3.2.2 3.2.3 3.2.5 3.2.6 3.4.1 3.4.2 4.1.3 5.3.1",
    "1.2.2 2.1.2 2.1.3 2.2.1 3.1.3 3.2.4 3.2.5 3.2.6 3.3.2 4.1.2 4.1.3 4.2.1 4.2.2 4.3.2 5.1.1 5.1.2 5.2.2 5.3.1 5.3.2"
  ]
};
const GRUPOS_EXCEL = ["P5A", "P5B", "P6A", "P6B"];
function trimestreDe(actividad, fecha) {
  const m = String(actividad || "").match(/\bSA\s?([123])\b/);
  if (m) return +m[1] - 1;
  const d = new Date(fecha); if (isNaN(d)) return 0;
  const mes = d.getMonth() + 1;
  return mes >= 9 ? 0 : mes <= 3 ? 1 : 2;
}
/* Indicador de las pantallas nuevas de Programa que llegaron a la hoja sin código
   (mismo reparto que window.INDICADOR_PROGRAMACION de js/indicadores.js). */
const IND_PROG_NUEVAS = {
  "5º": { "Londres": "3.2.2", "Zúrich": "3.2.2", "Luxemburgo": "3.2.2", "Reikiavik": "3.2.2", "Tallin": "3.2.2", "Riga": "3.2.2", "Vilna": "3.2.2", "Edimburgo": "3.2.2",
    "Bratislava": "3.2.2", "Liubliana": "3.2.2", "Zagreb": "3.2.2", "Sofía": "3.2.2", "Belgrado": "3.2.2" },
  "6º": { "Londres": "3.2.3", "Zúrich": "3.2.3", "Luxemburgo": "3.2.3", "Reikiavik": "3.2.3", "Tallin": "3.2.3", "Riga": "3.2.3", "Vilna": "3.2.3", "Edimburgo": "3.2.3",
    "Bratislava": "3.2.6", "Liubliana": "3.2.6", "Zagreb": "3.2.6", "Sofía": "3.2.6", "Belgrado": "3.2.6" }
};
function indicadorProgSinCodigo(actividad, clase) {
  const m = /^Programación · \d+\. (.+)$/.exec(String(actividad || ""));
  return m ? (IND_PROG_NUEVAS[/6/.test(normGrupo(clase)) ? "6º" : "5º"] || {})[m[1].trim()] || "" : "";
}

/* ---------- Indicadores automáticos de Programa y Robótica ----------
   Mismo reparto que js/indicadores.js (INDICADOR_PROGRAMACION e INDICADOR_ROBOTICA). Cada indicador vale la suma
   de la mejor nota de cada pantalla o reto que le corresponde, dividida entre cuántas son (las no hechas cuentan 0),
   redondeada a un número entero. En Robótica se toma la modalidad (Robot, Essential o Prime) en la que mejor va.
   Con adaptación curricular, Programa son solo las 10 primeras pantallas y Robótica solo el Robot. */
const PROG_ORDEN = ["Madrid", "Lisboa", "París", "Roma", "Berlín", "Ámsterdam", "Bruselas", "Londres", "Zúrich", "Luxemburgo",
  "Dublín", "Copenhague", "Estocolmo", "Oslo", "Helsinki", "Reikiavik", "Tallin", "Riga", "Vilna", "Edimburgo",
  "Praga", "Viena", "Varsovia", "Budapest", "Bucarest", "Bratislava", "Liubliana", "Zagreb", "Sofía", "Belgrado"];
const IND_PROG_TODAS = {
  "5º": ["3.2.1", "3.2.1", "3.2.1", "3.2.1"].concat(Array(26).fill("3.2.2")),
  "6º": ["3.2.2", "3.2.2", "3.2.2", "3.2.2"].concat(Array(16).fill("3.2.3"), Array(10).fill("3.2.6"))
};
const IND_ROB = {
  "5º": { "Robot": ["3.2.3", "3.2.3", "3.2.3", "3.2.3", "3.2.6", "3.2.6", "3.2.6", "3.2.6", "3.2.6", "3.2.6"],
    "SPIKE Essential": ["3.2.3", "3.2.3"].concat(Array(8).fill("3.2.9")), "SPIKE Prime": Array(10).fill("3.2.9") },
  "6º": { "Robot": Array(10).fill("3.2.5"), "SPIKE Essential": Array(10).fill("3.2.5"),
    "SPIKE Prime": Array(5).fill("3.2.5").concat(Array(5).fill("3.2.6")) }
};
// mejor: { "Programación|Madrid": 5, "Robótica|Robot|3": 4, … } (mejor nota de cada pantalla o reto de un alumno).
function indicadoresAuto(curso, mejor, adaptado) {
  const out = { prog: {}, rob: {} };
  const reparte = (lista, nota) => { const t = {}; lista.forEach((cod, i) => { const x = t[cod] = t[cod] || { s: 0, n: 0, hechas: 0 }; const v = nota(i); x.n++; if (v != null) { x.s += v; x.hechas++; } }); return t; };
  const nProg = adaptado ? 10 : 30;
  const tp = reparte(IND_PROG_TODAS[curso].slice(0, nProg), (i) => mejor["Programación|" + PROG_ORDEN[i]]);
  Object.keys(tp).forEach((cod) => { if (tp[cod].hechas) out.prog[cod] = Math.round(tp[cod].s / tp[cod].n); });
  Object.keys(IND_ROB[curso]).filter((m) => !adaptado || m === "Robot").forEach((m) => {
    const tr = reparte(IND_ROB[curso][m], (i) => mejor["Robótica|" + m + "|" + (i + 1)]);
    Object.keys(tr).forEach((cod) => { if (tr[cod].hechas) { const v = Math.round(tr[cod].s / tr[cod].n); if (!(cod in out.rob) || v > out.rob[cod]) out.rob[cod] = v; } });
  });
  return out;
}
/* El 10-nov (6.º B) la app de entonces guardaba en «Valoración» un reparto de 5 puntos entre las pantallas
   (0,29; 0,59…) en vez de la nota de la pantalla. Esas notas con decimales se recalculan con las estrellas y los intentos,
   igual que lo hace la app (js/valoraciones.js): 1-2 intentos = 5, 3-4 = 4, más = 3; −1 con 2 estrellas, −2 con 1; mínimo 3. */
function notaPantalla(valor, estrellas, intentos) {
  const v = Number(valor);
  if (v % 1 === 0) return v;
  const e = Number(estrellas) || 0, n = Number(intentos) || 1;
  if (e < 1) return 2;
  return Math.max(3, (n <= 2 ? 5 : n <= 4 ? 4 : 3) - (e >= 3 ? 0 : e === 2 ? 1 : 2));
}
// Clave de una fila de Resultados para indicadoresAuto (o "" si no es de Programa ni de Robótica).
function claveAuto(actividad, ciudad) {
  const a = String(actividad || "");
  let m = /^Programación · \d+\. (.+)$/.exec(a); if (m) return "Programación|" + m[1].trim();
  m = /^Robótica · (.+) · reto (\d+)$/.exec(a); if (m) return "Robótica|" + m[1].trim() + "|" + m[2];
  return "";
}
function prepararExcel(libro) {
  libro = libro || abrirLibro();
  const res = libro.getSheetByName("Resultados");
  const r = res && res.getLastRow() > 1 ? res.getDataRange().getValues() : [[]];
  const c = r[0].map(String), I = (t) => c.indexOf(t);
  const iF = I("Fecha"), iN = I("Nombre"), iU = I("Usuario Educacyl"), iC = I("Clase"), iA = I("Actividad"), iI = I("Nº indicador"), iV = I("Valoración (0-5)"), iPr = I("Programa"), iE = I("Estrellas"), iIn = I("Intentos");
  const mapa = mapaApellidos(libro);
  // Cada fila de Resultados se une a su alumno de Alumnado por el usuario (con o sin @educa…) o, si no, por el nombre.
  const sinDom = (u) => minus(u).replace(/@.*$/, "");
  const llano = (t) => minus(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zñ0-9]+/g, " ").trim();
  const porUsuario = {}, porNombre = {};
  filasAlumnado(libro).forEach((f) => {
    if (!f[2]) return; const id = "u:" + sinDom(f[2]), g = normGrupo(f[3]);
    porUsuario[sinDom(f[2])] = id;
    [textoAlumno(f), String(f[0] || "") + " " + String(f[1] || "")].forEach((t) => (porNombre[llano(t) + "|" + g] = id));
  });
  const idDe = (u, n, cl) => (u && porUsuario[sinDom(u)]) || porNombre[llano(n) + "|" + normGrupo(cl)] || (u ? "u:" + sinDom(u) : "n:" + llano(n) + "|" + normGrupo(cl));
  // 1) Última nota de cada alumno en cada actividad e indicador.
  const ultima = {};
  r.slice(1).forEach((f) => {
    // Pantallas de Programa guardadas sin «Nº indicador» (el 11-nov, antes de actualizar indicadores.js).
    if (!f[iI] && f[iV] !== "" && f[iV] != null) { const cod = indicadorProgSinCodigo(f[iA], f[iC]); if (cod) { f = f.slice(); f[iI] = cod; } }
    if (f[iV] === "" || f[iV] == null || !f[iI]) return;
    const k = idDe(f[iU], f[iN], f[iC]) + "#" + f[iA] + "#" + codigoDe(f[iI]), t = new Date(f[iF]).getTime() || 0;
    if (!ultima[k] || ultima[k].t <= t) ultima[k] = { t, f };
  });
  // 2) Media por alumno, trimestre e indicador. Programa y Robótica no se promedian aquí: van aparte (indicadores automáticos).
  const suma = {}, adaptados = leerAdaptados();
  const auto = {};   // id -> { curso, adaptado, mejor: {clave: nota}, fecha: {prog, rob} }
  r.slice(1).forEach((f) => {
    const k = claveAuto(f[iA]); if (!k || f[iV] === "" || f[iV] == null) return;
    const id = idDe(f[iU], f[iN], f[iC]), x = auto[id] = auto[id] || { curso: /6/.test(normGrupo(f[iC])) ? "6º" : "5º", adaptado: adaptados.indexOf(sinDom(f[iU])) >= 0, mejor: {}, profe: {}, fecha: {} };
    const v = k.indexOf("Programación") === 0 ? notaPantalla(f[iV], f[iE], f[iIn]) : Number(f[iV]), t0 = new Date(f[iF]).getTime() || 0;
    // Si el profe ha puesto nota a esa pantalla o reto en el panel, manda la última suya; si no, la mejor del alumno.
    if (String(f[iPr]) === "Nota del profe") { if (!x.profe[k] || x.profe[k].t <= t0) x.profe[k] = { t: t0, v }; }
    else if (!(k in x.mejor) || v > x.mejor[k]) x.mejor[k] = v;
    const r0 = k.split("|")[0] === "Programación" ? "prog" : "rob", t = new Date(f[iF]); if (!isNaN(t) && (!x.fecha[r0] || t > x.fecha[r0])) x.fecha[r0] = t;
  });
  const meter = (id, curso, tri, cod, v) => {
    const en = (t) => ORDEN_EXCEL[curso][t].split(" ").indexOf(cod) >= 0;
    if (!en(tri)) { const otro = [tri + 1, tri + 2, tri - 1, tri - 2].find((t) => t >= 0 && t < 3 && en(t)); if (otro != null) tri = otro; }
    const kk = id + "#" + tri + "#" + cod; (suma[kk] = suma[kk] || []).push(v);
  };
  Object.keys(auto).forEach((id) => {
    const x = auto[id]; Object.keys(x.profe).forEach((k) => (x.mejor[k] = x.profe[k].v));
    const ind = indicadoresAuto(x.curso, x.mejor, x.adaptado);
    ["prog", "rob"].forEach((r0) => Object.keys(ind[r0]).forEach((cod) => meter(id, x.curso, trimestreDe("", x.fecha[r0] || new Date()), cod, ind[r0][cod])));
  });
  Object.keys(ultima).forEach((k) => {
    if (claveAuto(ultima[k].f[iA])) return;
    const f = ultima[k].f, id = idDe(f[iU], f[iN], f[iC]), curso = /6/.test(normGrupo(f[iC])) ? "6º" : "5º";
    let tri = trimestreDe(f[iA], f[iF]), cod = codigoDe(f[iI]);
    // 6º: la presentación de PowerPoint (Crea SA1 S2) era el 3.1.2 y en la programación nueva es el 3.1.4.
    if (curso === "6º" && cod === "3.1.2" && /SA1 S2/.test(String(f[iA]))) cod = "3.1.4";
    // Si el indicador no se evalúa en ese trimestre según el Excel, la nota va al trimestre en el que sí está
    // (primero los siguientes y, si no, los anteriores). Así no queda ninguna nota aparte.
    const en = (t) => ORDEN_EXCEL[curso][t].split(" ").indexOf(cod) >= 0;
    if (!en(tri)) { const otro = [tri + 1, tri + 2, tri - 1, tri - 2].find((t) => t >= 0 && t < 3 && en(t)); if (otro != null) tri = otro; }
    const kk = id + "#" + tri + "#" + cod; (suma[kk] = suma[kk] || []).push(Number(f[iV]));
  });
  const notaDe = (id, tri, cod) => { const l = suma[id + "#" + tri + "#" + cod]; return l ? Math.round(l.reduce((a, b) => a + b, 0) / l.length) : ""; };   // redondeada a un número entero
  // 3) Una pestaña por grupo.
  const alumnado = filasAlumnado(libro), hechos = [];
  GRUPOS_EXCEL.forEach((g) => {
    const curso = /6/.test(g) ? "6º" : "5º";
    let lista = alumnado.filter((f) => normGrupo(f[3]) === g && f[2]).map((f) => ({ id: "u:" + sinDom(f[2]), nombre: textoAlumno(f), k: claveOrden(mapa, f[0], f[2], g, f[1]) }));
    // Alumnos con notas que no están en Alumnado (van al final).
    const vistos = {}; lista.forEach((a) => (vistos[a.id] = 1));
    Object.keys(ultima).forEach((k) => { const f = ultima[k].f; if (normGrupo(f[iC]) !== g) return; const id = idDe(f[iU], f[iN], f[iC]); if (!vistos[id]) { vistos[id] = 1; lista.push({ id, nombre: String(f[iN]) + " (no está en Alumnado)", k: ["~", minus(f[iN]), ""] }); } });
    lista.sort((a, b) => { for (let i = 0; i < 3; i++) { const x = a.k[i].localeCompare(b.k[i], "es"); if (x) return x; } return 0; });
    const filas = [], negritas = [];
    ORDEN_EXCEL[curso].forEach((txt, tri) => {
      const cods = txt.split(" ");
      // Indicadores con nota en este trimestre que no están en el Excel (p. ej. códigos antiguos): se ponen aparte, al final.
      const otros = [];
      Object.keys(suma).forEach((kk) => { const p = kk.split("#"); if (+p[1] === tri && cods.indexOf(p[2]) < 0 && otros.indexOf(p[2]) < 0 && lista.some((a) => a.id === p[0])) otros.push(p[2]); });
      otros.sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
      const ini = filas.length + 1;
      filas.push([`${tri + 1}.º TRIMESTRE · copia las notas (desde la columna B, sin la fila de los números) y pégalas en la pestaña TIAC${tri + 1} del Excel de ${g.charAt(1)}º${g.charAt(2)}, en la celda D9`]);
      const extra = otros.length ? ["", "NO ESTÁN EN EL EXCEL →"].concat(otros) : [];
      filas.push(["Alumno/a"].concat(cods, extra)); negritas.push(ini, ini + 1);
      lista.forEach((a) => filas.push([a.nombre].concat(cods.map((cod) => notaDe(a.id, tri, cod)), otros.length ? ["", ""].concat(otros.map((cod) => notaDe(a.id, tri, cod))) : [])));
      filas.push([""]);
    });
    const ancho = Math.max.apply(null, filas.map((f) => f.length));
    const datos = filas.map((f) => { const x = f.slice(); while (x.length < ancho) x.push(""); return x; });
    const nombre = "Excel " + g, h = libro.getSheetByName(nombre) || libro.insertSheet(nombre);
    h.clear();
    // Las filas de los códigos van como texto (si no, Google pone «1.1.1» como fecha).
    negritas.forEach((n) => h.getRange(n, 1, 1, ancho).setNumberFormat("@"));
    h.getRange(1, 1, datos.length, ancho).setValues(datos);
    negritas.forEach((n) => h.getRange(n, 1, 1, ancho).setFontWeight("bold"));
    h.setFrozenColumns(1);
    hechos.push(nombre + " (" + lista.length + " alumnos)");
  });
  SpreadsheetApp.flush();
  console.log("Pestañas preparadas: " + hechos.join(", "));
  return hechos;
}
function excelProfe(libro, d) {
  if (CLAVE_PROFE === "cambia-esta-clave" || String(d.clave || "") !== CLAVE_PROFE) return json({ ok: false, error: "Clave incorrecta." });
  return json({ ok: true, pestanas: prepararExcel(libro), url: libro.getUrl() });
}

/* ---------- Recuperar notas en Valoraciones ----------
   Ejecútala a mano (elige «recuperarNotas» arriba y pulsa ▶ Ejecutar). Lee TODAS las filas de Resultados que tienen
   nota y las vuelve a poner en Valoraciones (la última nota de cada alumno e indicador). No borra nada.
   En «Registro de ejecución» verás cuántas notas del profe hay por día y grupo. */
function recuperarNotas() {
  const libro = abrirLibro(), res = libro.getSheetByName("Resultados");
  if (!res || res.getLastRow() < 2) { console.log("Resultados está vacía."); return; }
  const r = res.getDataRange().getValues(), c = r[0].map(String), I = (t) => c.indexOf(t);
  const iF = I("Fecha"), iN = I("Nombre"), iU = I("Usuario Educacyl"), iC = I("Clase"), iA = I("Actividad"), iP = I("Personaje / robot"), iI = I("Nº indicador"), iV = I("Valoración (0-5)");
  const filas = r.slice(1).filter((f) => f[iV] !== "" && f[iV] != null && f[iA] !== "");
  filas.sort((a, b) => new Date(a[iF]) - new Date(b[iF]));
  const resumen = {};
  filas.forEach((f) => { if (String(f[iP]) === "Profe") { const k = Utilities.formatDate(new Date(f[iF]), "Europe/Madrid", "yyyy-MM-dd") + " " + normGrupo(f[iC]); resumen[k] = (resumen[k] || 0) + 1; } });
  console.log("Notas del profe en Resultados (día y grupo): " + JSON.stringify(resumen, null, 1));
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const hoja = libro.getSheetByName("Valoraciones") || libro.insertSheet("Valoraciones");
    let v = hoja.getLastRow() > 0 ? hoja.getDataRange().getValues() : [["Nombre", "Usuario Educacyl", "Clase"]];
    const cab = v[0].map(String), igual = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    let puestas = 0;
    filas.forEach((f) => {
      const columna = String(f[iA]).slice(0, 60) + (f[iI] ? " · Ind. " + codigoDe(f[iI]).slice(0, 10) : "");
      let col = cab.indexOf(columna);
      if (col < 0) { cab.push(columna); col = cab.length - 1; v.forEach((x, k) => { while (x.length < cab.length) x.push(k === 0 ? cab[x.length] : ""); }); }
      const u = String(f[iU] || ""), n = String(f[iN] || ""), cl = normGrupo(f[iC]);
      let fila = v.findIndex((x, k) => k > 0 && (u ? igual(x[1], u) : (igual(x[0], n) && igual(normGrupo(x[2]), cl))));
      if (fila < 0) { const x = cab.map(() => ""); x[0] = n; x[1] = u; x[2] = cl; v.push(x); fila = v.length - 1; }
      if (v[fila][col] !== Number(f[iV])) { v[fila][col] = Number(f[iV]); puestas++; }
    });
    v[0] = cab; v = v.map((x) => { while (x.length < cab.length) x.push(""); return x; });
    hoja.getRange(1, 1, v.length, cab.length).setValues(v);
    hoja.getRange(1, 1, 1, cab.length).setFontWeight("bold");
    SpreadsheetApp.flush();
    console.log("Notas recuperadas o corregidas en Valoraciones: " + puestas + " (de " + filas.length + " filas con nota en Resultados).");
  } finally { lock.releaseLock(); }
  ordenarTodo(libro);
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

/* ---------- Entrada del alumnado con contraseña elegida ----------
   El primer acceso crea la contraseña que el alumno elige. Se guarda también en la pestaña
   «Accesos alumnado» para que el docente pueda recuperarla si se olvida. El acceso queda
   limitado a alumnos incluidos en la pestaña Alumnado (sin bloqueo por fallos).
*/
function filaAlumno(libro, clase, nombre, usuario) {
  clase = normGrupo(clase);
  return filasAlumnado(libro).find((x) => normGrupo(x[3]) === clase && minus(textoAlumno(x)) === minus(nombre) && minus(x[2]) === minus(usuario));
}
function hojaAccesos(libro) {
  const h = libro.getSheetByName("Accesos alumnado") || libro.insertSheet("Accesos alumnado");
  const cab = ["Nombre", "Usuario Educacyl", "Clase", "Contraseña elegida", "Última actualización"];
  if (h.getLastRow() === 0) { h.appendRow(cab); h.setFrozenRows(1); h.getRange(1, 1, 1, cab.length).setFontWeight("bold"); }
  else {
    const actual = h.getRange(1, 1, 1, Math.max(cab.length, h.getLastColumn())).getValues()[0];
    cab.forEach((v, i) => { if (actual[i] !== v) h.getRange(1, i + 1).setValue(v).setFontWeight("bold"); });
  }
  return h;
}
function guardarAccesoAlumno(libro, alumno, password) {
  const h = hojaAccesos(libro), usuario = minus(alumno[2]);
  const n = h.getLastRow() - 1;
  const filas = n > 0 ? h.getRange(2, 1, n, 5).getValues() : [];
  let fila = filas.findIndex((f) => minus(f[1]) === usuario) + 2;
  if (fila < 2) fila = h.getLastRow() + 1;
  h.getRange(fila, 4).setNumberFormat("@");
  h.getRange(fila, 1, 1, 5).setValues([[textoAlumno(alumno), usuario, normGrupo(alumno[3]), String(password), new Date()]]);
  h.autoResizeColumns(1, 5);
}
function validarPassword(p) {
  p = String(p || "").trim();
  if (p.length < 4 || p.length > 24) return "La contraseña debe tener entre 4 y 24 caracteres.";
  if (/^[=+@-]/.test(p)) return "La contraseña no puede empezar por =, +, @ o - .";
  return "";
}
function guardarPin(usuario, p) { PropertiesService.getScriptProperties().setProperty("apin_" + minus(usuario), JSON.stringify(p)); }
function leerPin(usuario) { return JSON.parse(PropertiesService.getScriptProperties().getProperty("apin_" + minus(usuario)) || "null"); }
function alumnoEntrar(libro, d) {
  const f = filaAlumno(libro, d.clase, d.nombre, d.usuario);
  if (!f) return json({ ok: false, error: "Revisa tu grupo, tu nombre y tu usuario de Educacyl." });
  const password = String(d.password || "").trim(), error = validarPassword(password);
  if (error) return json({ ok: false, error });
  const usuario = minus(f[2]), p = leerPin(usuario) || {};
  let creada = false;
  // Si no hay contraseña nueva (incluidos códigos antiguos de versiones previas), el alumno la elige ahora.
  if (!p.p) {
    p.p = password; p.f = 0; p.b = 0; guardarPin(usuario, p); guardarAccesoAlumno(libro, f, password); creada = true;
  } else if (password !== p.p) {
    // Sin bloqueo por fallos: el alumno puede volver a intentarlo enseguida.
    return json({ ok: false, error: "Contraseña incorrecta. Comprueba lo que has escrito (pulsa «👁 Ver» para revisarla)." });
  } else if (p.f || p.b) { p.f = 0; p.b = 0; guardarPin(usuario, p); }
  // Reescribe la fila por si el docente ha creado de nuevo la pestaña de accesos.
  guardarAccesoAlumno(libro, f, password);
  return json(Object.assign(crearSesion(f), { creada }));
}
function alumnoCambiarCodigo(libro, d) {
  const s = alumnoDeSesion(libro, d);
  if (!s) return json({ ok: false, error: "Tu sesión ha caducado. Sal y vuelve a entrar con tu contraseña." });
  const nuevo = String(d.nuevo || "").trim(), error = validarPassword(nuevo);
  if (error) return json({ ok: false, error });
  const p = leerPin(s.usuario) || {};
  if (p.p && String(d.actual || "") !== p.p) return json({ ok: false, error: "Tu contraseña actual no es correcta." });
  guardarPin(s.usuario, { p: nuevo, f: 0, b: 0 });
  const f = filasAlumnado(libro).find((x) => minus(x[2]) === minus(s.usuario));
  if (f) guardarAccesoAlumno(libro, f, nuevo);
  return json({ ok: true });
}
function crearSesion(f) {
  const usuario = minus(f[2]), token = Utilities.getUuid().replace(/-/g, "");
  const props = PropertiesService.getScriptProperties();
  const lista = JSON.parse(props.getProperty("ases_" + usuario) || "[]").filter((x) => x.hasta > Date.now()).slice(-4);
  lista.push({ t: token, hasta: Date.now() + DIAS_SESION_ALUMNO * 86400000 });
  props.setProperty("ases_" + usuario, JSON.stringify(lista));
  return { ok: true, token, usuario, nombre: textoAlumno(f), clase: normGrupo(f[3]), adaptado: leerAdaptados().indexOf(usuario) >= 0 };
}
function alumnoDeSesion(libro, d) {
  const usuario = minus(d.usuario), token = String(d.token || "");
  if (!usuario || !token) return null;
  const lista = JSON.parse(PropertiesService.getScriptProperties().getProperty("ases_" + usuario) || "[]");
  if (!lista.some((x) => x.t === token && x.hasta > Date.now())) return null;
  const f = filasAlumnado(libro).find((x) => minus(x[2]) === usuario);
  return f ? { usuario, nombre: textoAlumno(f), clase: normGrupo(f[3]), adaptado: leerAdaptados().indexOf(usuario) >= 0 } : null;
}

/* Resultados del alumno autenticado: solo devuelve sus propias notas e hitos. */
function alumnoResultados(libro, d) {
  const s = alumnoDeSesion(libro, d);
  if (!s) return json({ ok: false, error: "Tu sesión ha caducado. Sal y vuelve a entrar." });
  const h = libro.getSheetByName("Valoraciones");
  const v = h && h.getLastRow() > 0 ? h.getDataRange().getValues() : [[]];
  const cab = v[0] || [], iU = cab.indexOf("Usuario Educacyl");
  const fila = iU >= 0 ? (v.slice(1).find(x => minus(x[iU]) === minus(s.usuario)) || null) : null;
  const res = libro.getSheetByName("Resultados");
  const r = res && res.getLastRow() > 1 ? res.getDataRange().getValues() : [[]];
  const rc = r[0] || [], rU = rc.indexOf("Usuario Educacyl"), rA = rc.indexOf("Actividad"), rP = rc.indexOf("Programa"), rF = rc.indexOf("Fecha");
  const hechos = rU >= 0 ? r.slice(1).filter(x => minus(x[rU]) === minus(s.usuario) && String(x[rP] || "").indexOf("Terminado") === 0)
    .map(x => [x[rA], x[rP], x[rF] instanceof Date ? x[rF].toISOString() : String(x[rF])]) : [];
  return json({ ok: true, nombre: s.nombre, clase: s.clase, cab, fila, hechos, comentarios: comentariosDe(leerComentarios(libro), s.usuario), adaptado: leerAdaptados().indexOf(minus(s.usuario)) >= 0 });
}

function alumnoSesion(libro, d) {
  const s = alumnoDeSesion(libro, d);
  return json({ ok: true, valida: !!s, requiere: CODIGO_ALUMNO, alumno: s });
}

/* ---------- Adaptación curricular ----------
   El profe marca en la ficha del alumno «Adaptación curricular». Se guarda en las propiedades del script
   (no en la hoja, para no cambiar sus columnas). Ese alumno entra solo con elegir su nombre (sin código)
   y la web le muestra los contenidos adaptados. */
function leerAdaptados() { return JSON.parse(PropertiesService.getScriptProperties().getProperty("adaptados") || "[]"); }
function ponerAdaptacion(libro, d) {
  if (CLAVE_PROFE === "cambia-esta-clave" || String(d.clave || "") !== CLAVE_PROFE) return json({ ok: false, error: "Clave incorrecta." });
  const u = minus(d.usuario); if (!u) return json({ ok: false, error: "Falta el usuario de Educacyl." });
  const l = leerAdaptados().filter((x) => x !== u);
  if (d.valor) l.push(u);
  PropertiesService.getScriptProperties().setProperty("adaptados", JSON.stringify(l));
  return json({ ok: true, adaptados: l });
}
// El alumno con adaptación entra solo con elegir grupo y nombre.
function alumnoDirecto(libro, d) {
  const clase = normGrupo(d.clase), nombre = minus(d.nombre), ad = leerAdaptados();
  const f = filasAlumnado(libro).find((x) => normGrupo(x[3]) === clase && minus(textoAlumno(x)) === nombre);
  if (!f || ad.indexOf(minus(f[2])) < 0) return json({ ok: false });
  return json(crearSesion(f));
}


/* ---------- Valoración proporcional de Programa y Robótica ----------
   Una pestaña de resumen por alumno. Cada pantalla superada aporta la misma fracción
   del máximo de su ruta: Programa 5/30; Robot 2,5/10; Essential 3,5/10; Prime 5/10.
   La adaptación curricular mantiene el máximo de 2,5 puntos en Robot con 10 pantallas adaptadas. */
function actualizarResumenRutas(libro, alumno) {
  const props = PropertiesService.getScriptProperties();
  const rutas = [
    { id: "programa", maximo: 5, total: 30, clave: "programa" },
    { id: "robot-robot", maximo: 2.5, total: 10, clave: "robot" },
    { id: "robot-essential", maximo: 3.5, total: 10, clave: "essential" },
    { id: "robot-prime", maximo: 5, total: 10, clave: "prime" }
  ];
  const salida = {};
  rutas.forEach((r) => {
    const clave = "cadena_" + Utilities.base64EncodeWebSafe(alumno.usuario + "|" + r.id).replace(/=+$/g, "");
    let estado = {};
    try { estado = JSON.parse(props.getProperty(clave) || "{}"); } catch (e) { estado = {}; }
    if (r.id.indexOf("robot-") === 0 && [4, 6].includes(Number(estado.total))) {
      const anterior = Number(estado.total);
      if (Array.isArray(estado.completados) && estado.completados.indexOf(anterior - 1) >= 0)
        estado.desbloqueado = Math.max(Number(estado.desbloqueado) || 0, anterior);
      estado.total = 10;
      props.setProperty(clave, JSON.stringify(estado));
    }
    const total = Math.max(1, Number(estado.total) || r.total);
    const hechas = Array.isArray(estado.completados) ? estado.completados.length : 0;
    salida[r.clave] = { hechas, total, maximo: r.maximo, nota: Math.round((r.maximo * hechas / total) * 100) / 100 };
  });
  const hoja = libro.getSheetByName("Progreso por rutas") || libro.insertSheet("Progreso por rutas");
  const cab = ["Última actualización", "Nombre", "Usuario Educacyl", "Clase",
    "Programa pantallas", "Programa total", "Nota Programa /5",
    "Robot pantallas", "Robot total", "Nota Robot /2,5",
    "SPIKE Essential pantallas", "SPIKE Essential total", "Nota Essential /3,5",
    "SPIKE Prime pantallas", "SPIKE Prime total", "Nota Prime /5"];
  if (hoja.getLastRow() === 0) { hoja.appendRow(cab); hoja.setFrozenRows(1); hoja.getRange(1, 1, 1, cab.length).setFontWeight("bold"); }
  else if (hoja.getRange(1, 1).getValue() !== cab[0]) { hoja.clearContents(); hoja.appendRow(cab); hoja.setFrozenRows(1); hoja.getRange(1, 1, 1, cab.length).setFontWeight("bold"); }
  const datos = hoja.getLastRow() > 1 ? hoja.getRange(2, 1, hoja.getLastRow() - 1, 4).getValues() : [];
  const igual = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
  let fila = datos.findIndex((f) => alumno.usuario ? igual(f[2], alumno.usuario) : (igual(f[1], alumno.nombre) && igual(normGrupo(f[3]), alumno.clase))) + 2;
  if (fila < 2) fila = hoja.getLastRow() + 1;
  const valores = [new Date(), alumno.nombre, alumno.usuario, alumno.clase,
    salida.programa.hechas, salida.programa.total, salida.programa.nota,
    salida.robot.hechas, salida.robot.total, salida.robot.nota,
    salida.essential.hechas, salida.essential.total, salida.essential.nota,
    salida.prime.hechas, salida.prime.total, salida.prime.nota];
  hoja.getRange(fila, 1, 1, valores.length).setValues([valores]);
  [7, 10, 13, 16].forEach((c) => hoja.getRange(fila, c).setNumberFormat("0.00"));
  hoja.autoResizeColumns(1, cab.length);
  return salida;
}

/* ---------- Retos encadenados: progreso y códigos individuales por alumno ----------
   Secuencias independientes: programa, piensa, robot-robot, robot-essential y robot-prime.
   El navegador nunca decide qué reto está desbloqueado: lo valida este servidor. */
function gestionarRetoCadena(libro, d) {
  const alumno = alumnoDeSesion(libro, d);
  if (!alumno) return json({ ok: false, sesion: true, error: "La sesión del alumno no es válida. Vuelve a entrar." });
  const secuencia = String(d.secuencia || "");
  if (!["programa", "piensa", "robot-robot", "robot-essential", "robot-prime"].includes(secuencia)) return json({ ok: false, error: "Secuencia no válida." });
  let total = Math.max(1, Math.min(100, Number(d.total) || 1));
  // Los totales evaluables se fijan en el servidor para que el navegador no pueda alterar la nota.
  if (secuencia === "programa") total = 30;
  if (secuencia.indexOf("robot-") === 0) total = 10;
  const props = PropertiesService.getScriptProperties();
  const clave = "cadena_" + Utilities.base64EncodeWebSafe(alumno.usuario + "|" + secuencia).replace(/=+$/g, "");
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let estado = {};
    try { estado = JSON.parse(props.getProperty(clave) || "{}"); } catch (e) { estado = {}; }
    estado.desbloqueado = Math.max(0, Math.min(total - 1, Number(estado.desbloqueado) || 0));
    estado.completados = estado.completados || [];
    estado.codigos = estado.codigos || {};
    estado.notas = estado.notas || {};
    if (estado.total && Number(estado.total) !== total) {
      const anterior = Number(estado.total);
      if (secuencia === "programa" && anterior === 17 && total === 30) {
        // Migración sin pérdida: Oeste conserva 0-6; Norte se desplaza +3 y Este +8.
        const mover = (i) => i < 7 ? i : i < 12 ? i + 3 : i + 8;
        estado.completados = (estado.completados || []).map(mover);
        estado.desbloqueado = mover(Number(estado.desbloqueado) || 0);
        const codigosNuevos = {};
        Object.keys(estado.codigos || {}).forEach((k) => { codigosNuevos[mover(Number(k))] = estado.codigos[k]; });
        estado.codigos = codigosNuevos;
        estado.total = total;
      } else if (secuencia.indexOf("robot-") === 0 && [4, 6].includes(anterior) && total === 10) {
        if (estado.completados.indexOf(anterior - 1) >= 0) estado.desbloqueado = Math.max(estado.desbloqueado, anterior);
        estado.total = total;
      } else return json({ ok: false, error: "Ha cambiado el número de pantallas de esta ruta. Contacta con tu profesor." });
    }
    estado.total = total;
    const op = String(d.op || "estado");
    if (op === "estado") return json({ ok: true, desbloqueado: estado.desbloqueado, completados: estado.completados });
    const indice = Number(d.indice);
    if (!Number.isInteger(indice) || indice < 0 || indice >= total) return json({ ok: false, error: "Reto no válido." });
    if (op === "completar") {
      if (indice > estado.desbloqueado) return json({ ok: false, error: "Este reto todavía está bloqueado." });
      if (estado.completados.indexOf(indice) < 0) estado.completados.push(indice);
      // La nota representa el mejor resultado demostrado en esta pantalla.
      // Repetir no suma puntos por sí mismo: solo se actualiza si la nueva
      // ejecución obtiene una calificación estrictamente superior. Nunca baja.
      const notaRecibida = Number(d.notaPantalla);
      if (d.notaPantalla !== "" && d.notaPantalla != null && Number.isFinite(notaRecibida) && notaRecibida >= 0 && notaRecibida <= 5) {
        const notaAnterior = estado.notas[indice] == null ? -1 : Number(estado.notas[indice]);
        if (!Number.isFinite(notaAnterior) || notaRecibida > notaAnterior) {
          estado.notas[indice] = Math.round(notaRecibida * 100) / 100;
        }
      }
      let codigo = "";
      const finAventura = secuencia === "programa" && [9, 19, 29].includes(indice);
      if (indice === estado.desbloqueado) {
        if (finAventura) {
          // Se entrega código de progreso al cerrar cada aventura, incluida la última.
          if (!estado.codigos[indice + 1]) estado.codigos[indice + 1] = Utilities.getUuid().replace(/-/g, "").slice(0, 8).toUpperCase();
          codigo = estado.codigos[indice + 1];
        } else if (indice + 1 < total) {
          // Dentro de una aventura se avanza sin pedir códigos; solo se bloquea al cambiar de aventura.
          estado.desbloqueado = indice + 1;
        }
      }
      props.setProperty(clave, JSON.stringify(estado));
      const claveResumen = secuencia === "programa" ? "programa" : secuencia === "robot-robot" ? "robot" : secuencia === "robot-essential" ? "essential" : secuencia === "robot-prime" ? "prime" : "";
      const resumen = claveResumen ? actualizarResumenRutas(libro, alumno) : null;
      const datoRuta = claveResumen ? resumen[claveResumen] : null;
      return json({ ok: true, codigo, siguiente: indice + 1 < total ? indice + 1 : null, completado: indice,
        completados: estado.completados.length, total, nota: datoRuta ? datoRuta.nota : null, maximo: datoRuta ? datoRuta.maximo : null,
        notaPantalla: estado.notas[indice] == null ? null : estado.notas[indice] });
    }
    if (op === "desbloquear") {
      if (indice <= estado.desbloqueado) return json({ ok: true, desbloqueado: estado.desbloqueado });
      const esperado = estado.codigos[indice];
      const recibido = String(d.codigo || "").trim().toUpperCase();
      if (indice !== estado.desbloqueado + 1 || !esperado || recibido !== esperado || estado.completados.indexOf(indice - 1) < 0)
        return json({ ok: false, error: "El código no es correcto para este reto. Comprueba el código del reto anterior." });
      estado.desbloqueado = indice;
      delete estado.codigos[indice];
      props.setProperty(clave, JSON.stringify(estado));
      return json({ ok: true, desbloqueado: indice });
    }
    return json({ ok: false, error: "Operación no válida." });
  } finally { lock.releaseLock(); }
}


/* ---------- Comentarios del profe por indicador (Crea) ---------- */
// Pestaña «Comentarios»: una fila por alumno y columna de Valoraciones («Crea · SA1 S2 · … · Ind. 2.1.1»),
// con el texto que leen el alumno (Mis notas) y su familia. Un comentario vacío borra la fila.
const COL_COMENTARIOS = ["Nombre", "Usuario Educacyl", "Clase", "Actividad e indicador", "Comentario", "Fecha"];
function hojaComentarios(libro) {
  let h = libro.getSheetByName("Comentarios");
  if (!h) { h = libro.insertSheet("Comentarios"); h.appendRow(COL_COMENTARIOS); h.setFrozenRows(1); h.getRange(1, 1, 1, COL_COMENTARIOS.length).setFontWeight("bold"); h.setColumnWidth(5, 420); }
  return h;
}
// Devuelve [[usuario, columna, comentario], ...]
function leerComentarios(libro) {
  const h = libro.getSheetByName("Comentarios");
  if (!h || h.getLastRow() < 2) return [];
  return h.getRange(2, 1, h.getLastRow() - 1, COL_COMENTARIOS.length).getValues()
    .filter((f) => f[1] && f[3] && String(f[4]).trim()).map((f) => [String(f[1]), String(f[3]), String(f[4])]);
}
function comentariosDe(lista, usuario) {
  const o = {}, u = minus(usuario);
  (lista || []).forEach((f) => { if (minus(f[0]) === u) o[f[1]] = f[2]; });
  return o;
}
// items: [{ nombre, usuario, clase, columna, comentario }]. Sin bloqueo: lo pone quien llama.
function escribirComentarios(libro, items) {
  if (!items.length) return;
  const h = hojaComentarios(libro);
  const n = h.getLastRow() - 1;
  let filas = n > 0 ? h.getRange(2, 1, n, COL_COMENTARIOS.length).getValues() : [];
  items.forEach((x) => {
    const u = minus(x.usuario), col = String(x.columna).slice(0, 90), t = String(x.comentario == null ? "" : x.comentario).trim().slice(0, 1500);
    const i = filas.findIndex((f) => minus(f[1]) === u && String(f[3]) === col);
    if (!t) { if (i >= 0) filas.splice(i, 1); return; }
    const fila = [x.nombre || "", x.usuario, normGrupo(x.clase), col, t, new Date()];
    if (i >= 0) filas[i] = fila; else filas.push(fila);
  });
  if (n > 0) h.getRange(2, 1, n, COL_COMENTARIOS.length).clearContent();
  if (filas.length) h.getRange(2, 1, filas.length, COL_COMENTARIOS.length).setValues(filas);
}
function comentarioProfe(libro, d) {
  if (CLAVE_PROFE === "cambia-esta-clave" || String(d.clave || "") !== CLAVE_PROFE) return json({ ok: false, error: "Clave incorrecta." });
  if (!d.usuario || !d.columna) return json({ ok: false, error: "Falta el alumno o el indicador." });
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    escribirComentarios(libro, [{ nombre: nombreCompleto(libro, String(d.nombre || ""), String(d.usuario)), usuario: String(d.usuario), clase: d.clase, columna: d.columna, comentario: d.comentario }]);
  } finally { lock.releaseLock(); }
  return json({ ok: true });
}

/* ---------- Notas del profe en lote (importar un CSV de correcciones) ---------- */
// notas: [{ nombre, usuario, clase, destino, ciudad, indicador, valoracion, comentario }]
// Escribe todo de una vez: filas en Resultados («Nota del profe»), celdas de Valoraciones y comentarios.
function notasLote(libro, d) {
  if (CLAVE_PROFE === "cambia-esta-clave" || String(d.clave || "") !== CLAVE_PROFE) return json({ ok: false, error: "Clave incorrecta." });
  const lista = (d.notas || []).filter((x) => x && x.usuario && x.destino && x.indicador).slice(0, 1500);
  if (!lista.length) return json({ ok: false, error: "No hay notas que guardar." });
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const limpiar = (v, max) => String(v == null ? "" : v).slice(0, max);
    const mapa = mapaApellidos(libro), ahora = new Date();
    lista.forEach((x) => { x.clase = normGrupo(limpiar(x.clase, 12)); x.nombre = nombreCompleto(libro, limpiar(x.nombre, 60), limpiar(x.usuario, 60), mapa); x.columna = limpiar(x.destino, 60) + " · Ind. " + limpiar(x.indicador, 10); });
    // 1) Resultados
    const res = libro.getSheetByName("Resultados");
    const conNota = lista.filter((x) => x.valoracion !== "" && x.valoracion != null && isFinite(Number(x.valoracion)));
    if (res && conNota.length) {
      const filas = conNota.map((x) => [ahora, x.nombre, limpiar(x.usuario, 60), x.clase, limpiar(x.destino, 60), limpiar(x.ciudad, 40), "", "", "", "Profe", "Nota del profe", "'" + limpiar(x.indicador, 10), Number(x.valoracion)]);
      res.getRange(res.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
    }
    // 2) Valoraciones (última nota)
    if (conNota.length) {
      const hoja = libro.getSheetByName("Valoraciones") || libro.insertSheet("Valoraciones");
      if (hoja.getLastRow() === 0) { hoja.appendRow(["Nombre", "Usuario Educacyl", "Clase"]); hoja.setFrozenRows(1); hoja.setFrozenColumns(3); }
      let v = hoja.getDataRange().getValues();
      const cab = v[0].map(String);
      conNota.forEach((x) => { if (cab.indexOf(x.columna) < 0) cab.push(x.columna); });
      const ancho = cab.length;
      v = v.map((f) => { f = f.slice(); while (f.length < ancho) f.push(""); return f; });
      v[0] = cab;
      conNota.forEach((x) => {
        let i = v.findIndex((f, k) => k > 0 && minus(f[1]) === minus(x.usuario));
        if (i < 0) { const f = new Array(ancho).fill(""); f[0] = x.nombre; f[1] = x.usuario; f[2] = x.clase; v.push(f); i = v.length - 1; }
        v[i][cab.indexOf(x.columna)] = Number(x.valoracion);
      });
      hoja.getRange(1, 1, v.length, ancho).setValues(v);
      hoja.getRange(1, 1, 1, ancho).setFontWeight("bold");
      SpreadsheetApp.flush();
      ordenarHoja(libro, "Valoraciones", 0, 1, 2);
      calcularMedias(libro);
    }
    // 3) Comentarios (solo si la fila trae la columna «comentario»)
    escribirComentarios(libro, lista.filter((x) => x.comentario !== undefined).map((x) => ({ nombre: x.nombre, usuario: x.usuario, clase: x.clase, columna: x.columna, comentario: x.comentario })));
    return json({ ok: true, notas: conNota.length, comentarios: lista.filter((x) => x.comentario !== undefined && String(x.comentario).trim()).length });
  } finally { lock.releaseLock(); }
}
