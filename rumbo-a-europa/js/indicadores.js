/*
  INDICADORES DE LOGRO (Programaciones didácticas de TIAC 2026-27, CEIP Tierra de Pinares)
  ----------------------------------------------------------------------------------------
  Textos copiados del apartado 6 de cada programación. El curso se saca de la clase
  que escribe el alumno: si empieza por 6 se usan los de 6.º; si no, los de 5.º.

  - INDICADORES[curso]: número del indicador -> texto.
  - INDICADOR_PROGRAMACION[curso]: ciudad -> indicador de ese destino.
  - INDICADOR_ROBOTICA[curso]: para cada nivel, el indicador de cada uno de sus 6 retos (en orden).
  Puedes cambiar cualquier relación aquí.

  Valoración automática de cada actividad (de 0 a 5):
    0 = no hecho
    1 = lo ha intentado sin conseguir nada
    2 = lo ha intentado y ha conseguido una parte (algún sello o alguna parada)
    3 = conseguido con más de 4 intentos o con un programa mucho más largo de lo necesario
    4 = conseguido con 3 o 4 intentos o con un programa algo más largo
    5 = realizado perfectamente: 1 o 2 intentos y sin pasarse del reto de bloques
*/
window.INDICADORES = {
  "5º": {
    "3.2.1": "STEM3 · CD5: Programa a Marco en Run Marco con secuencias de direcciones y giros hasta la casilla de su ruta y dice los pasos en voz alta antes de ejecutar.",
    "3.2.2": "STEM3 · CD5: Usa bucles en lugar de repetir bloques (y condicionales en la ruta avanzada) en Run Marco y en Minecraft Adventure de Code.org hasta la pantalla de su ruta.",
    "3.2.3": "STEM3 · CD3: Programa el Robot Mouse con flechas o el SPIKE Essential para ir de norte a sur y de Madrid a su país en el tablero, midiendo antes avances y giros.",
    "3.2.6": "STEM3 · CD3: Planifica en el panel la ruta de España a su país (por cuadros con Cody, por tierra o por aire), la programa y la amplía a ida y vuelta reutilizando el programa.",
    "3.2.9": "STEM3 · CD3: Mide distancias y calcula avances y giros para programar con LEGO SPIKE Essential el regreso de su país a España, ida y vuelta o por todos los países del grupo."
  },
  "6º": {
    "3.2.2": "Programa en Scratch personajes que se desplazan o conversan por turnos siguiendo una secuencia ordenada.",
    "3.2.3": "Utiliza bucles (repetir) para crear una sintonía o melodía en Scratch.",
    "3.2.5": "Programa el robot para recorrer una ruta por el tablero: mide, avanza y gira hasta llegar al país indicado.",
    "3.2.6": "Prueba su programa, localiza el error y lo corrige cambiando una cosa cada vez."
  }
};

window.INDICADOR_PROGRAMACION = {
  "5º": {
    "Madrid": "3.2.1", "Lisboa": "3.2.1", "París": "3.2.1", "Roma": "3.2.1",
    "Berlín": "3.2.2", "Ámsterdam": "3.2.2", "Bruselas": "3.2.2",
    "Dublín": "3.2.2", "Copenhague": "3.2.2", "Estocolmo": "3.2.2", "Oslo": "3.2.2", "Helsinki": "3.2.2",
    "Praga": "3.2.2", "Viena": "3.2.2", "Varsovia": "3.2.2", "Budapest": "3.2.2", "Bucarest": "3.2.2"
  },
  "6º": {
    "Madrid": "3.2.2", "Lisboa": "3.2.2", "París": "3.2.2", "Roma": "3.2.2",
    "Berlín": "3.2.3", "Ámsterdam": "3.2.3", "Bruselas": "3.2.3",
    "Dublín": "3.2.3", "Copenhague": "3.2.3", "Estocolmo": "3.2.3", "Oslo": "3.2.3", "Helsinki": "3.2.3",
    "Praga": "3.2.6", "Viena": "3.2.6", "Varsovia": "3.2.6", "Budapest": "3.2.6", "Bucarest": "3.2.6"
  }
};

window.INDICADOR_ROBOTICA = {
  "5º": {
    robot: ["3.2.3", "3.2.3", "3.2.6", "3.2.6", "3.2.6", "3.2.6"],
    essential: ["3.2.3", "3.2.3", "3.2.9", "3.2.9", "3.2.9", "3.2.9"],
    prime: ["3.2.9", "3.2.9", "3.2.9", "3.2.9", "3.2.9", "3.2.9"]
  },
  "6º": {
    robot: ["3.2.5", "3.2.5", "3.2.5", "3.2.5", "3.2.5", "3.2.5"],
    essential: ["3.2.5", "3.2.5", "3.2.5", "3.2.5", "3.2.5", "3.2.5"],
    prime: ["3.2.5", "3.2.5", "3.2.5", "3.2.5", "3.2.5", "3.2.5"]
  }
};
