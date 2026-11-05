/*
  VALORACIONES: guarda la nota (0-5) de cada actividad por alumno y genera el Excel.
  Se guarda en el navegador del alumno. El Excel se crea con SheetJS (js/vendor/xlsx.mini.min.js).
*/
window.Valoraciones = (function () {
  "use strict";
  const CLAVE_ALUMNO = "rumbo-a-europa-v1";
  const CLAVE = "rumbo-valoraciones-v1";
  const actividades = {};   // grupo -> [{ clave, pantalla, actividad, tipo, ref }]

  function leerJSON(k, def) { try { return JSON.parse(localStorage.getItem(k) || "null") || def; } catch (e) { return def; } }
  function escribirJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function alumno() { return Object.assign({ nombre: "", usuario: "", clase: "" }, leerJSON(CLAVE_ALUMNO, {}).alumno || {}); }
  function ponerAlumno(nombre, clase, usuario) {
    const g = leerJSON(CLAVE_ALUMNO, {}), antes = g.alumno || {};
    g.alumno = { nombre: (nombre || "").trim(), clase: (clase || "").trim(), usuario: (usuario === undefined ? antes.usuario || "" : usuario).trim() };
    escribirJSON(CLAVE_ALUMNO, g);
    window.dispatchEvent(new CustomEvent("alumno-cambiado", { detail: g.alumno }));
  }
  const curso = () => (/^\s*6/.test(alumno().clase || "") ? "6º" : "5º");

  function indicador(tipo, ref) {
    const c = curso();
    if (tipo === "fijo") return { codigo: ref, texto: ((window.INDICADORES || {})[c] || {})[ref] || "", curso: c };
    const cod = tipo === "prog"
      ? ((window.INDICADOR_PROGRAMACION || {})[c] || {})[ref]
      : (((window.INDICADOR_ROBOTICA || {})[c] || {})[ref[0]] || [])[ref[1]];
    if (!cod) return null;
    return { codigo: cod, texto: ((window.INDICADORES || {})[c] || {})[cod] || "", curso: c };
  }

  function nota({ completado, parcial, intentos, bloques, reto }) {
    if (!completado) return parcial ? 2 : 1;
    let n = intentos <= 2 ? 5 : intentos <= 4 ? 4 : 3;
    if (reto && bloques > reto) n -= bloques <= reto + 2 ? 1 : 2;
    return Math.max(3, n);
  }

  function leer() { return leerJSON(CLAVE, {}); }
  // reemplazar = true: guarda la nota aunque sea más baja (nota puesta a mano).
  function registrar(clave, datos, reemplazar) {
    const v = leer(), prev = v[clave];
    const intentos = Math.max(datos.intentos || 0, prev ? prev.intentos || 0 : 0);
    if (!prev || reemplazar || datos.nota >= prev.nota) v[clave] = Object.assign({}, datos, { intentos, fecha: new Date().toISOString() });
    else prev.intentos = intentos;
    escribirJSON(CLAVE, v);
    return v[clave];
  }
  // lista puede ser una función (para listas que cambian con el curso).
  function definirActividades(grupo, lista) { actividades[grupo] = lista; }
  const ORDEN = ["crea", "prog", "rob", "piensa"];
  const grupos = () => Object.keys(actividades).sort((a, b) => ORDEN.indexOf(a) - ORDEN.indexOf(b));

  function filas() {
    const v = leer(), a = alumno(), out = [];
    grupos().forEach((g) => (typeof actividades[g] === "function" ? actividades[g]() : actividades[g]).forEach((act) => {
      const ind = indicador(act.tipo, act.ref) || { codigo: "", texto: "" };
      const r = v[act.clave];
      out.push({
        clave: act.clave, grupo: g, destino: act.destino || act.actividad, ciudad: act.ciudad || "",
        nombre: a.nombre, usuario: a.usuario, clase: a.clase, curso: curso(), pantalla: act.pantalla, actividad: act.actividad,
        codigo: ind.codigo, indicador: ind.texto, nota: r ? r.nota : 0, intentos: r ? r.intentos : 0,
        bloques: r && r.bloques !== undefined ? r.bloques : "", fecha: r ? new Date(r.fecha).toLocaleString("es-ES") : ""
      });
    }));
    return out;
  }

  function excel() {
    if (!window.XLSX) return false;
    const a = alumno(), f = filas();
    const cab = ["Nombre", "Usuario Educacyl", "Clase", "Curso", "Rincón", "Actividad", "Nº indicador", "Indicador de logro", "Valoración (0-5)", "Intentos", "Bloques", "Fecha"];
    const filas1 = [cab].concat(f.map((r) => [r.nombre, r.usuario, r.clase, r.curso, r.pantalla, r.actividad, r.codigo, r.indicador, r.nota, r.intentos, r.bloques, r.fecha]));
    // Al final: media de los indicadores iguales
    const grupos = {};
    f.forEach((r) => { if (r.codigo) (grupos[r.codigo] = grupos[r.codigo] || { texto: r.indicador, notas: [] }).notas.push(r.nota); });
    filas1.push([]);
    filas1.push(["", "", "", "", "", "MEDIA POR INDICADOR", "Nº indicador", "Indicador de logro", "Media (0-5)", "Actividades"]);
    Object.keys(grupos).sort().forEach((k) => {
      const n = grupos[k].notas;
      filas1.push([a.nombre, a.usuario, a.clase, curso(), "", "Media del indicador " + k, k, grupos[k].texto, Math.round(n.reduce((s, x) => s + x, 0) / n.length * 10) / 10, n.length]);
    });
    const hoja1 = XLSX.utils.aoa_to_sheet(filas1);
    hoja1["!cols"] = [14, 16, 8, 6, 14, 34, 11, 70, 15, 9, 8, 18].map((w) => ({ wch: w }));
    // Resumen por indicador
    const por = {};
    f.forEach((r) => { if (!r.codigo) return; (por[r.codigo] = por[r.codigo] || { texto: r.indicador, notas: [] }).notas.push(r.nota); });
    const res = [["Nombre", "Usuario Educacyl", "Clase", "Nº indicador", "Indicador de logro", "Actividades", "Hechas", "Media (0-5)", "Máxima"]];
    Object.keys(por).sort().forEach((k) => {
      const n = por[k].notas, media = n.reduce((s, x) => s + x, 0) / n.length;
      res.push([a.nombre, a.usuario, a.clase, k, por[k].texto, n.length, n.filter((x) => x > 0).length, Math.round(media * 10) / 10, Math.max(...n)]);
    });
    const hoja2 = XLSX.utils.aoa_to_sheet(res);
    hoja2["!cols"] = [14, 16, 8, 11, 70, 11, 8, 11, 8].map((w) => ({ wch: w }));
    const hoja3 = XLSX.utils.aoa_to_sheet([["Valoración", "Significado"], [0, "No hecho"], [1, "Lo ha intentado sin conseguir nada"], [2, "Lo ha intentado y ha conseguido una parte"], [3, "Conseguido con más de 4 intentos o con un programa mucho más largo de lo necesario"], [4, "Conseguido con 3 o 4 intentos o con un programa algo más largo"], [5, "Realizado perfectamente: 1 o 2 intentos y sin pasarse del reto de bloques"]]);
    hoja3["!cols"] = [{ wch: 11 }, { wch: 80 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, hoja1, "Valoración");
    XLSX.utils.book_append_sheet(wb, hoja2, "Por indicador");
    XLSX.utils.book_append_sheet(wb, hoja3, "Escala");
    const limpio = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ºª]/g, "").replace(/[^\w ]+/g, "").trim().replace(/\s+/g, "_");
    const nombreArchivo = `Valoracion_${limpio(a.clase) || "clase"}_${limpio(a.nombre) || "alumno"}.xlsx`;
    const datos = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const url = URL.createObjectURL(new Blob([datos], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const enlace = document.createElement("a");
    enlace.href = url; enlace.download = nombreArchivo; enlace.style.display = "none";
    document.body.appendChild(enlace); enlace.click();
    setTimeout(() => { URL.revokeObjectURL(url); enlace.remove(); }, 4000);
    return true;
  }

  /* Envía una fila a la hoja de Google (REGISTRO.url). Añade fecha, nombre, usuario y clase. */
  function enviar(datos) {
    const R = window.REGISTRO || {};
    if (!R.url) return Promise.resolve(false);
    const a = alumno();
    const d = Object.assign({ fecha: new Date().toISOString(), nombre: a.nombre || "(sin nombre)", usuario: a.usuario || "", clase: a.clase || "",
      destino: "", ciudad: "", estrellas: "", bloques: "", intentos: "", personaje: "", programa: "", indicador: "", valoracion: "" }, datos);
    try {
      return fetch(R.url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(d) }).then(() => true, () => false);
    } catch (e) { return Promise.resolve(false); }
  }
  /* Varias filas, una detrás de otra (una por indicador). */
  async function enviarVarias(lista) {
    let ok = true;
    for (const d of lista) ok = (await enviar(d)) && ok;
    return ok;
  }

  return { alumno, ponerAlumno, curso, indicador, nota, registrar, definirActividades, filas, excel, leer, enviar, enviarVarias };
})();
