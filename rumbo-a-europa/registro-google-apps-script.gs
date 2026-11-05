/*
  Registro de resultados de "Rumbo a Europa"
  Pega este código en Extensiones → Apps Script de tu hoja de Google
  y publícalo como aplicación web (mira LEEME.md).

  Crea dos pestañas:
  - "Resultados": una fila cada vez que un alumno termina (o intenta) una actividad.
  - "Valoraciones": una fila por alumno (nombre + clase) y una columna por actividad e indicador,
    con la mejor valoración (0-5) conseguida. Las casillas vacías son 0 (no hecho).
  - "Medias por indicador": la media de cada indicador por alumno (se recalcula sola).
*/
const COLUMNAS = ["Fecha", "Nombre", "Clase", "Actividad", "Ciudad / reto", "Estrellas", "Bloques", "Intentos", "Personaje / robot", "Programa", "Nº indicador", "Valoración (0-5)"];

function doPost(e) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = libro.getSheetByName("Resultados") || libro.insertSheet("Resultados");
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, COLUMNAS.length).setFontWeight("bold");
  }
  const d = JSON.parse(e.postData.contents);
  const limpiar = (v, max) => String(v == null ? "" : v).slice(0, max);
  const nombre = limpiar(d.nombre, 30), clase = limpiar(d.clase, 12);
  const nota = d.valoracion === "" || d.valoracion == null ? "" : Number(d.valoracion);
  hoja.appendRow([
    new Date(d.fecha), nombre, clase, limpiar(d.destino, 60), limpiar(d.ciudad, 40),
    d.estrellas === "" ? "" : Number(d.estrellas), Number(d.bloques) || "", Number(d.intentos) || "",
    limpiar(d.personaje, 30), limpiar(d.programa, 500), limpiar(d.indicador, 10), nota
  ]);
  if (nota !== "") {
    const columna = limpiar(d.destino, 60) + (d.indicador ? " · Ind. " + limpiar(d.indicador, 10) : "");
    actualizarValoraciones(libro, nombre, clase, columna, nota);
  }
  return ContentService.createTextOutput("ok");
}

// Prueba: abre la URL de la aplicación web en el navegador. Si todo está bien verás
// "Funciona" y aparecerá una fila de prueba en la pestaña Resultados.
function doGet() {
  doPost({ postData: { contents: JSON.stringify({ fecha: new Date().toISOString(), nombre: "PRUEBA", clase: "-", destino: "Prueba de conexión", ciudad: "", estrellas: "", valoracion: "" }) } });
  return ContentService.createTextOutput("Funciona: revisa la pestaña Resultados de tu hoja.");
}

function actualizarValoraciones(libro, nombre, clase, columna, nota) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const hoja = libro.getSheetByName("Valoraciones") || libro.insertSheet("Valoraciones");
    if (hoja.getLastRow() === 0) {
      hoja.appendRow(["Nombre", "Clase"]);
      hoja.setFrozenRows(1); hoja.setFrozenColumns(2);
      hoja.getRange(1, 1, 1, 2).setFontWeight("bold");
    }
    const cab = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
    let col = cab.indexOf(columna) + 1;
    if (!col) { col = cab.length + 1; hoja.getRange(1, col).setValue(columna).setFontWeight("bold"); }
    const filas = hoja.getLastRow() > 1 ? hoja.getRange(2, 1, hoja.getLastRow() - 1, 2).getValues() : [];
    const igual = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    let fila = filas.findIndex((f) => igual(f[0], nombre) && igual(f[1], clase)) + 2;
    if (fila < 2) { fila = hoja.getLastRow() + 1; hoja.getRange(fila, 1, 1, 2).setValues([[nombre, clase]]); }
    const celda = hoja.getRange(fila, col), antes = celda.getValue();
    if (antes === "" || nota > Number(antes)) celda.setValue(nota);
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
  const filas = [["Nombre", "Clase"].concat(cods.map((c) => "Media Ind. " + c + " (" + grupos[c].length + " act.)"))];
  datos.slice(1).forEach((f) => {
    filas.push([f[0], f[1]].concat(cods.map((c) => {
      const n = grupos[c].map((i) => Number(f[i]) || 0);
      return Math.round(n.reduce((a, b) => a + b, 0) / n.length * 10) / 10;
    })));
  });
  const hoja = libro.getSheetByName("Medias por indicador") || libro.insertSheet("Medias por indicador");
  hoja.clearContents();
  hoja.getRange(1, 1, filas.length, filas[0].length).setValues(filas);
  hoja.getRange(1, 1, 1, filas[0].length).setFontWeight("bold");
  hoja.setFrozenRows(1); hoja.setFrozenColumns(2);
}
