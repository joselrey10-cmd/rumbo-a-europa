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
  async function completar(secuencia, indice, total, notaPantalla) {
    if (!secuencias.includes(secuencia)) return { ok: false, error: "Secuencia no válida." };
    return llamar(secuencia, "completar", indice, total, null, notaPantalla);
  }
  async function entrar(secuencia, indice, total) {
    if (!secuencias.includes(secuencia)) return false;
    const estado = await llamar(secuencia, "estado", indice, total);
    if (!estado.ok) { alert(estado.error || "No se ha podido comprobar el progreso."); return false; }
    if (indice <= estado.desbloqueado) return true;
    if (indice !== estado.desbloqueado + 1) { alert("Este reto está bloqueado. Completa primero los retos anteriores."); return false; }
    const codigo = prompt("🔐 Este reto está protegido. Escribe el código que conseguiste al terminar el reto anterior:");
    if (!codigo) return false;
    const r = await llamar(secuencia, "desbloquear", indice, total, codigo);
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
      if (r && r.ok) remoto[sec] = { desbloqueado: Number(r.desbloqueado) || 0, completados: (r.completados || []).map(Number) };
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
    }
    return r;
  }
  const hecho = (sec, i) => !!(remoto[sec] && remoto[sec].completados.indexOf(i) >= 0);
  const abierto = (sec, i) => !!(remoto[sec] && i <= remoto[sec].desbloqueado);
  return { completar: completarYGuardar, entrar, sincronizar, remoto, hecho, abierto };
})();
