/*
  Registro de resultados de "Rumbo a Europa"
  Pega este código en Extensiones → Apps Script de tu hoja de Google
  y publícalo como aplicación web (mira LEEME.md).

  Crea dos pestañas:
  - "Resultados": una fila cada vez que un alumno termina (o intenta) una actividad.
  - "Valoraciones": una fila por alumno (usuario Educacyl, o nombre + clase) y una columna por actividad
    e indicador de los cuatro rincones (Crea, Programa, Robótica, Piensa), con la última nota enviada. Las casillas vacías son 0 (no hecho).
  - "Medias por indicador": la media de cada indicador por alumno (se recalcula sola).
*/
// CLAVE DEL PANEL DEL PROFESOR: cámbiala por una tuya (la pedirá la página "Profe" de la web).
// Está solo aquí, en el script, así que el alumnado no la puede ver.
const CLAVE_PROFE = "47001559";

const COLUMNAS = ["Fecha", "Nombre", "Usuario Educacyl", "Clase", "Actividad", "Ciudad / reto", "Estrellas", "Bloques", "Intentos", "Personaje / robot", "Programa", "Nº indicador", "Valoración (0-5)"];

function doPost(e) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const pedido = JSON.parse(e.postData.contents);
  if (pedido.accion === "datos") return datosProfe(libro, pedido);
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
  const nombre = limpiar(d.nombre, 30), usuario = limpiar(d.usuario, 60), clase = limpiar(d.clase, 12);
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
  const hoja = libro.getSheetByName("Valoraciones");
  if (!hoja || hoja.getLastRow() < 1) return salida({ ok: true, cab: [], filas: [] });
  const v = hoja.getDataRange().getValues();
  return salida({ ok: true, cab: v[0], filas: v.slice(1) });
}

// Prueba: abre la URL de la aplicación web en el navegador. Si todo está bien verás
// "Funciona" y aparecerá una fila de prueba en la pestaña Resultados.
function doGet() {
  doPost({ postData: { contents: JSON.stringify({ fecha: new Date().toISOString(), nombre: "PRUEBA", clase: "-", destino: "Prueba de conexión", ciudad: "", estrellas: "", valoracion: "" }) } });
  return ContentService.createTextOutput("Funciona: revisa la pestaña Resultados de tu hoja.");
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
    let fila = filas.findIndex((f) => usuario ? igual(f[1], usuario) : (igual(f[0], nombre) && igual(f[2], clase))) + 2;
    if (fila < 2) { fila = hoja.getLastRow() + 1; hoja.getRange(fila, 1, 1, 3).setValues([[nombre, usuario, clase]]); }
    else hoja.getRange(fila, 1, 1, 3).setValues([[nombre, usuario || filas[fila - 2][1], clase]]);
    // Se guarda la última nota enviada (el alumno puede revisarla y volver a enviarla).
    hoja.getRange(fila, col).setValue(nota);
    SpreadsheetApp.flush();
    calcularMedias(libro);
  } finally {
    lock.releaseLock();
  }
}

// Pestaña "Medias por indicador": una fila por alumno y una columna por indicador,
// con la media de todas las actividades de ese indicador (las no hechas cuentan 0).
function calcularMedias(libro) {
  const val = libro.getSheetByName("Valoraciones");
  if (!val || val.getLastRow() < 2) return;
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
