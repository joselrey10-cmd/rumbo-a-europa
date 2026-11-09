/* Códigos de desbloqueo. La validación definitiva se realiza en Apps Script. */
window.RetosCadena = (function () {
  "use strict";
  const secuencias = ["programa", "piensa", "robot-robot", "robot-essential", "robot-prime"];
  async function llamar(secuencia, op, indice, total, codigo) {
    const R = window.REGISTRO || {}, A = window.Acceso;
    if (!R.url || !A || !A.token()) return { ok: false, error: "Inicia sesión para utilizar los retos encadenados." };
    try {
      const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({ accion: "retoCadena", op, secuencia, indice, total }, A.datosEnvio(), codigo ? { codigo } : {})) });
      return await r.json();
    } catch (e) { return { ok: false, error: "No se ha podido conectar con el servidor. Inténtalo de nuevo." }; }
  }
  async function completar(secuencia, indice, total) {
    if (!secuencias.includes(secuencia)) return { ok: false, error: "Secuencia no válida." };
    return llamar(secuencia, "completar", indice, total);
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
  return { completar, entrar };
})();
