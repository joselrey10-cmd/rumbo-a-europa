/*
  SITUACIONES DE APRENDIZAJE ABIERTAS AL ALUMNADO
  ------------------------------------------------
  ★ INTERRUPTOR DEL PROFE ★  Cambia solo esta línea:
      ["SA1"]                → solo la SA1 (desde el 24-nov-2026)
      ["SA1", "SA2"]         → SA1 y SA2
      ["SA1", "SA2", "SA3"]  → todo abierto
  Vale para los 4 rincones y para 5.º y 6.º. Lo que ya está hecho no se borra: las notas siguen en la hoja
  y en el panel; solo se cierra la entrada a las pantallas y retos de las SA cerradas.
*/
window.SA_ABIERTAS = ["SA1"];
// Actividades «ExtraTIC» de Piensa (no están en la programación de ese curso): true = abiertas.
window.EXTRATIC_ABIERTO = false;

/* ---------- A qué SA pertenece cada cosa (normalmente no hace falta tocarlo) ---------- */
window.SA_DE = {
  // Programa: aventuras de los países, en orden (Occidental = SA1, Norte = SA2 S3, Este = SA2 S4).
  programa: [1, 2, 2],
  // PiniCraft (5.º, 2.º trimestre): Aventurero y El viaje del héroe.
  pinicraft: [2, 2],
  // Robótica: SA de cada uno de los 10 retos, según el indicador que evalúa (programaciones de 5.º y 6.º).
  //  5.º: 3.2.3 = SA1, 3.2.6 = SA2, 3.2.9 = SA3 (SPIKE Prime no está en 5.º hasta la SA3).
  //  6.º: los tres robots se usan ya en la SA1 (S5 SPIKE Prime, S6 robot ratón / Essential / Prime).
  robotica: {
    "5º": { robot: [1, 1, 1, 1, 2, 2, 2, 2, 2, 2], essential: [1, 1, 3, 3, 3, 3, 3, 3, 3, 3], prime: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3] },
    "6º": { robot: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], essential: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], prime: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }
  }
};

window.SA = (function () {
  const num = (sa) => { const m = /SA\s*·?\s*(\d)|SdA\s*(\d)/i.exec(String(sa == null ? "" : sa)); return m ? +(m[1] || m[2]) : (typeof sa === "number" ? sa : 0); };
  const abierta = (sa) => {
    const n = num(sa);
    if (!n) return true; // sin SA: no se toca
    return (window.SA_ABIERTAS || []).some((x) => num(x) === n);
  };
  const curso = () => (window.Valoraciones && window.Valoraciones.curso ? window.Valoraciones.curso() : "5º");
  return {
    num, abierta,
    // Texto corto para las tarjetas cerradas.
    aviso: (sa) => `🔒 Es de la SA${num(sa) || ""}: tu profe la abrirá más adelante. Ahora toca la ${(window.SA_ABIERTAS || []).join(" y ")}.`,
    etiqueta: (sa) => `SA${num(sa)}`,
    programa: (ai) => abierta((window.SA_DE.programa || [])[ai] || 1),
    pinicraft: (ai) => abierta((window.SA_DE.pinicraft || [])[ai] || 2),
    robotica: (modo, i) => { const t = ((window.SA_DE.robotica || {})[curso()] || {})[modo]; return abierta(t ? t[i] || 1 : 1); },
    saRobotica: (modo, i) => { const t = ((window.SA_DE.robotica || {})[curso()] || {})[modo]; return t ? t[i] || 1 : 1; },
    // Piensa: "SA1 · S8" → SA1; "ExtraTIC" → según EXTRATIC_ABIERTO.
    piensa: (texto) => (/extra/i.test(String(texto || "")) ? !!window.EXTRATIC_ABIERTO : abierta(texto)),
    // Lista de SA abiertas para los textos ("SA1", "SA1 y SA2"…).
    lista: () => (window.SA_ABIERTAS || []).join(" y ")
  };
})();
