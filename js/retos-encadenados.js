/* Códigos de desbloqueo. La validación definitiva se realiza en Apps Script. */
window.RetosCadena = (function () {
  "use strict";
  const secuencias = ["programa", "piensa", "robot-robot", "robot-essential", "robot-prime"];
  async function llamar(secuencia, op, indice, total, codigo, notaPantalla) {
    const R = window.REGISTRO || {}, A = window.Acceso;
    if (!R.url || !A || !A.token()) return { ok: false, error: "Inicia sesión para utilizar los retos encadenados." };
    try {
      const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({ accion: "retoCadena", op, secuencia, indice, total }, A.datosEnvio(), codigo ? { codigo } : {}, Number.isFinite(notaPantalla) ? { notaPantalla } : {})) });
      return await r.json();
    } catch (e) { return { ok: false, error: "No se ha podido conectar con el servidor. Inténtalo de nuevo." }; }
  }
  const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
  // 18-nov: con toda la clase a la vez el servidor a veces no responde a tiempo y la pantalla superada
  // no quedaba apuntada (luego le pedía un código que no tenía). Ahora se reintenta hasta 4 veces.
  async function completar(secuencia, indice, total, notaPantalla) {
    if (!secuencias.includes(secuencia)) return { ok: false, error: "Secuencia no válida." };
    let r;
    for (let k = 0; k < 4; k++) {
      r = await llamar(secuencia, "completar", indice, total, null, notaPantalla);
      if (r && (r.ok || r.sesion || (r.error && !r.ocupado && !/conectar/.test(r.error)))) return r;
      await pausa(2000 + k * 3000 + Math.random() * 2000);
    }
    return r;
  }
  // previoHecho: este ordenador sabe que el alumno superó el reto anterior. Si el servidor no lo tiene apuntado
  // (se perdió el aviso), se le vuelve a mandar en vez de pedir un código que el alumno no tiene.
  async function entrar(secuencia, indice, total, previoHecho) {
    if (!secuencias.includes(secuencia)) return false;
    const estado = await llamar(secuencia, "estado", indice, total);
    if (!estado.ok) { alert(estado.error || "No se ha podido comprobar el progreso."); return false; }
    if (indice <= estado.desbloqueado) return true;
    // Programa (21-nov): cada aventura (situación de aprendizaje) se empieza sin terminar la anterior; dentro de la
    // aventura, cada pantalla se abre al superar la anterior. El servidor manda la lista de pantallas abiertas.
    if (secuencia === "programa" && Array.isArray(estado.abiertos)) {
      if (estado.abiertos.map(Number).indexOf(indice) >= 0) return true;
      if (previoHecho && indice > 0) {
        const r = await completar(secuencia, indice - 1, total);
        if (r && r.ok && Array.isArray(r.abiertos) && r.abiertos.map(Number).indexOf(indice) >= 0) return true;
      }
      alert("Esta pantalla está bloqueada. Supera primero la pantalla anterior de esta aventura.");
      return false;
    }
    if (indice !== estado.desbloqueado + 1) { alert("Este reto está bloqueado. Completa primero los retos anteriores."); return false; }
    const cambioAventura = secuencia === "programa" && indice % 10 === 0;
    if (previoHecho && !cambioAventura && indice > 0) {
      const r = await completar(secuencia, indice - 1, total);
      if (r && r.ok && r.siguiente === indice && !r.codigo) return true;
    }
    // Autoevaluación obligatoria: la aventura siguiente de Programa no se abre sin la de la aventura terminada.
    if (secuencia === "programa" && indice % 10 === 0 && window.Autoeval && !(await window.Autoeval.asegurar(window.Autoeval.etapaPrograma(indice / 10 - 1)))) return false;
    const codigo = prompt("🔐 Este reto está protegido. Escribe el código que conseguiste al terminar el reto anterior:");
    if (!codigo) return false;
    const r = await llamar(secuencia, "desbloquear", indice, total, codigo);
    if (!r.ok && r.autoeval && window.Autoeval) {
      // El servidor no tenía apuntada la autoevaluación: se pide y se vuelve a probar el código.
      if (!(await window.Autoeval.asegurar(window.Autoeval.etapaPrograma(indice / 10 - 1), true))) return false;
      const r2 = await llamar(secuencia, "desbloquear", indice, total, codigo);
      if (!r2.ok) { alert(r2.error || "Código incorrecto."); return false; }
      return true;
    }
    if (!r.ok) { alert(r.error || "Código incorrecto."); return false; }
    return true;
  }
  /* Progreso guardado en la hoja: así se conserva aunque el alumno cambie de ordenador o pulse «Salir».
     remoto[secuencia] = { desbloqueado, completados: [índices] }. Al llegar, avisa con el evento «progreso-remoto». */
  const remoto = {};
  const TOTALES = { "programa": 30, "robot-robot": 10, "robot-essential": 10, "robot-prime": 10 };
  let ultimoToken = "", ultimaVez = 0;
  async function sincronizar(forzar) {
    const A = window.Acceso, tk = A && A.token ? A.token() : "";
    if (!tk) { Object.keys(remoto).forEach((k) => delete remoto[k]); ultimoToken = ""; return; }
    if (!forzar && tk === ultimoToken && Date.now() - ultimaVez < 20000) return;
    ultimoToken = tk; ultimaVez = Date.now();
    await Promise.all(Object.keys(TOTALES).map(async (sec) => {
      const r = await llamar(sec, "estado", 0, TOTALES[sec]);
      if (r && r.ok) remoto[sec] = { desbloqueado: Number(r.desbloqueado) || 0, completados: (r.completados || []).map(Number), abiertos: Array.isArray(r.abiertos) ? r.abiertos.map(Number) : null };
    }));
    window.dispatchEvent(new CustomEvent("progreso-remoto"));
  }
  // Al entrar (o al cambiar de alumno) y al volver a Programa o Robótica.
  setInterval(() => { const A = window.Acceso, tk = A && A.token ? A.token() : ""; if (tk !== ultimoToken) sincronizar(true); }, 1500);
  window.addEventListener("hashchange", () => { if (/^#(programa|robotica)$/.test(location.hash)) sincronizar(); });
  // Tras completar una pantalla se actualiza la copia local del progreso de la hoja.
  const completarOriginal = completar;
  async function completarYGuardar(secuencia, indice, total, notaPantalla) {
    const r = await completarOriginal(secuencia, indice, total, notaPantalla);
    if (r && r.ok) {
      const g = remoto[secuencia] || (remoto[secuencia] = { desbloqueado: 0, completados: [] });
      if (g.completados.indexOf(indice) < 0) g.completados.push(indice);
      if (!r.codigo && r.siguiente != null) g.desbloqueado = Math.max(g.desbloqueado, r.siguiente);
      if (Array.isArray(r.abiertos)) g.abiertos = r.abiertos.map(Number);
    }
    return r;
  }
  const hecho = (sec, i) => !!(remoto[sec] && remoto[sec].completados.indexOf(i) >= 0);
  const abierto = (sec, i) => !!(remoto[sec] && (i <= remoto[sec].desbloqueado || (remoto[sec].abiertos && remoto[sec].abiertos.indexOf(i) >= 0)));
  return { completar: completarYGuardar, entrar, sincronizar, remoto, hecho, abierto };
})();
