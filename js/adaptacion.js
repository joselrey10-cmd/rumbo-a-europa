/*
  ADAPTACIÓN CURRICULAR (alumnado con ACI marcado en el panel del profe)
  -----------------------------------------------------------------------
  Si el alumno que ha entrado tiene adaptación (lo marca el profe en su ficha), esta hoja cambia los contenidos
  ANTES de que se pinten las pantallas:
  - Indicadores: los mismos números (mismo criterio de evaluación) con un logro muy básico, tomado de la
    programación de TIAC de 1.º de Primaria. Así las notas van a las mismas columnas de la hoja.
  - Crea: un texto corto con la información ya buscada y preguntas que se responden con una o dos palabras.
  - Programa: niveles cortos solo con flechas (delante, atrás, girar y saltar), con botones grandes.
  - Robótica: solo el robot de flechas y retos cortos.
  - Piensa: cada parada es una lectura de 2-3 líneas, un vídeo y un juego de «bien o mal» (piensa/facil.html).
  Todos los textos tienen un botón 🔊 para escucharlos.
  Puedes cambiar cualquier texto aquí (o con «Editar textos» del panel del profe).
*/
(function () {
  "use strict";
  let s = null;
  try { s = JSON.parse(localStorage.getItem("rumbo-sesion-alumno") || "null"); } catch (e) {}
  const ADAPTADO = !!(s && s.adaptado);
  window.ADAPTADO = ADAPTADO;

  /* ---------- Indicadores básicos (mismo número = mismo criterio) ---------- */
  window.INDICADORES_AC = {
    "5º": {
      "1.1.1": "Busca con ayuda la información de su país: lee o escucha la ficha y encuentra la capital.",
      "1.1.2": "Encuentra con ayuda un dato sencillo (bici o reciclaje) en la ficha que le da el docente.",
      "1.1.3": "Dice, con ayuda, si un dato viene de una web del cole o del docente.",
      "1.1.4": "Reconoce un anuncio en una pantalla y no lo pulsa.",
      "1.1.5": "Escucha cómo se dice «hola» en la lengua de su país y lo repite.",
      "1.2.1": "Guarda su trabajo en la carpeta indicada, con ayuda.",
      "1.2.2": "Abre una carpeta del ordenador y encuentra su archivo, con ayuda.",
      "1.2.3": "Guarda y vuelve a abrir su archivo en OneDrive, con ayuda.",
      "2.1.1": "Envía, con ayuda, un correo sencillo (saludo y una frase) a su docente.",
      "2.1.2": "Escribe, con ayuda, una palabra amable en un comentario del blog.",
      "2.1.3": "Dice si un mensaje le parece de verdad o de mentira, con ayuda.",
      "2.1.4": "Entra en Teams con ayuda y saluda con respeto.",
      "2.2.1": "Adjunta, con ayuda, su trabajo a un correo electrónico.",
      "2.2.2": "Escanea con ayuda un código QR y mira lo que aparece.",
      "2.2.3": "Comparte su archivo con el docente o su equipo, con ayuda.",
      "2.3.1": "Escribe su nombre o una palabra en el documento del equipo sin borrar lo de los demás.",
      "2.3.2": "Dice al equipo una palabra o un dato de su país para el guion.",
      "3.1.1": "Escribe palabras cortas en un documento siguiendo un modelo.",
      "3.1.2": "Escribe un número o una palabra en una casilla de una tabla, con ayuda.",
      "3.1.3": "Hace un cartel sencillo con una palabra y un dibujo, siguiendo un modelo.",
      "3.1.4": "Graba con ayuda una frase corta con su voz.",
      "3.2.1": "Programa con flechas el camino del personaje hasta la bandera.",
      "3.2.2": "Ordena flechas para llegar a la meta y prueba su programa.",
      "3.2.3": "Programa el robot con flechas (adelante, atrás y girar) para llegar a un país del tapete.",
      "3.2.4": "Pulsa una tecla o un botón y mira qué pasa en el programa.",
      "3.2.5": "Repite un camino corto con flechas hasta conseguirlo.",
      "3.2.6": "Elige la flecha correcta cuando el robot se equivoca y lo vuelve a probar.",
      "3.2.7": "Ve su nombre en la micro:bit con ayuda.",
      "3.2.8": "Agita la micro:bit y mira qué pasa, con ayuda.",
      "3.2.9": "Hace que el robot vaya adelante y atrás en el tapete.",
      "3.3.1": "Utiliza imágenes con licencia Creative Commons que le da el docente.",
      "3.3.2": "Usa en su cartel una imagen de las que le da el docente.",
      "3.3.3": "Usa en su grabación una música que le da el docente.",
      "3.4.1": "Reconoce, con ayuda, si una imagen se puede usar libremente (símbolo CC).",
      "3.4.2": "Reconoce el símbolo CC en un trabajo, con ayuda.",
      "4.1.1": "Sabe que su contraseña es secreta y no la dice a nadie.",
      "4.1.2": "Cierra sesión adecuadamente al dejar el dispositivo.",
      "4.1.3": "Busca el candado en la barra del navegador, con ayuda.",
      "4.1.4": "Dice si un correo es del cole o de alguien que no conoce, con ayuda.",
      "4.2.1": "Pide ayuda a un adulto cuando sale un aviso en la pantalla.",
      "4.2.2": "Sabe que no debe decir su nombre, su casa ni su teléfono en internet.",
      "4.2.3": "Si algo de internet le hace sentir mal, se lo cuenta a un adulto.",
      "4.3.1": "Usa los dispositivos de forma segura: sube o baja el sonido y el brillo con ayuda.",
      "4.3.2": "Nombra la pantalla, el teclado y el ratón.",
      "4.3.3": "No abre correos ni archivos de personas que no conoce.",
      "4.3.4": "Usa los dispositivos de forma responsable: se sienta bien y cuida el material.",
      "5.1.1": "Abre la aplicación que indica el docente desde su icono.",
      "5.1.2": "Elige, con ayuda, la aplicación correcta entre dos iconos.",
      "5.1.3": "Elige con ayuda un botón o sensor de la micro:bit.",
      "5.2.1": "Cuando el personaje no llega, cambia una flecha y lo vuelve a probar.",
      "5.2.2": "Si el ordenador no funciona, pide ayuda y dice qué pasa (no hay sonido, no hay internet).",
      "5.2.3": "Cuando sale un error, lo vuelve a intentar con ayuda.",
      "5.2.4": "Prueba otra vez su programa cuando no sale.",
      "5.3.1": "Espera su turno con el robot y deja trabajar al compañero.",
      "5.3.2": "Mira en su pasaporte las caras sonrientes que ha conseguido.",
      "5.3.3": "Enseña a un compañero lo que ha hecho."
    }
  };

  /* ---------- Fichas de países para Crea (información ya buscada) ---------- */
  const PAISES = {
    Francia: { flag: "🇫🇷", capital: "París", idioma: "francés", hola: "Bonjour", monumento: "la Torre Eiffel", colores: "azul, blanco y rojo", bici: "Mucha gente va en bici al trabajo.", recicla: "Separan la basura en contenedores de colores." },
    Italia: { flag: "🇮🇹", capital: "Roma", idioma: "italiano", hola: "Ciao", monumento: "el Coliseo", colores: "verde, blanco y rojo", bici: "En muchas ciudades hay carril bici.", recicla: "Reciclan el vidrio en el contenedor verde." },
    Portugal: { flag: "🇵🇹", capital: "Lisboa", idioma: "portugués", hola: "Olá", monumento: "la Torre de Belém", colores: "verde y rojo", bici: "En Lisboa hay bicicletas para alquilar.", recicla: "Reciclan el papel en el contenedor azul." },
    Alemania: { flag: "🇩🇪", capital: "Berlín", idioma: "alemán", hola: "Hallo", monumento: "la Puerta de Brandeburgo", colores: "negro, rojo y amarillo", bici: "Muchos niños van al cole en bici.", recicla: "Devuelven las botellas en la tienda." }
  };
  window.PAISES_AC = PAISES;
  // Cada reto de Crea adaptado: mismo SA, sesión, título e indicadores que el original (para que el profe ponga la nota
  // en la misma columna), con un título fácil, pasos con dibujos, la ficha ya buscada y preguntas de 1 o 2 palabras.
  // En los textos, {capital}, {idioma}… se cambian por los datos del país que elige la alumna.
  window.CREA_AC = {
    "5º": {
      "SA1-S1": {
        facil: "Mi país", pasos: ["👀 Mira la ficha de tu país.", "🔊 Escucha la ficha.", "✏️ Escribe la palabra que falta."],
        ficha: "{flag} Mi país es {pais}. La capital es {capital}. En {pais} hablan {idioma}. Para decir hola dicen «{hola}».",
        preguntas: [["¿Cuál es la capital?", "capital"], ["¿Qué idioma hablan?", "idioma"], ["¿Cómo dicen hola?", "hola"]]
      },
      "SA1-S2": {
        facil: "Un correo al consulado", pasos: ["📄 Guarda tu ficha con tu profe.", "📧 Escribe un correo corto.", "✏️ Responde aquí."],
        ficha: "{flag} El correo dice: «Hola. Me llamo … Mi país es {pais}. Adiós». Lo mandamos al consulado de {pais}.",
        preguntas: [["¿Qué palabra va al empezar el correo?", "=hola"], ["¿Qué palabra va al terminar?", "=adiós|adios"], ["¿Cuál es tu país?", "pais"]]
      },
      "SA2-S1": {
        facil: "La bici y el reciclaje", pasos: ["👀 Mira la ficha.", "🔊 Escucha la ficha.", "✏️ Escribe una palabra."],
        ficha: "{flag} En {pais}: {bici} {recicla} Usar la bici y reciclar cuida Europa.",
        preguntas: [["¿Qué vehículo cuida Europa?", "=bici|bicicleta"], ["¿Qué hacemos con la basura?", "=reciclar|reciclamos|separar"]]
      },
      "SA2-S2": {
        facil: "Mi cartel: Europa cuida", pasos: ["🎨 Haz un cartel con tu profe.", "🖼️ Pon un dibujo.", "✏️ Escribe una palabra."],
        ficha: "🌍 Para cuidar Europa: 💡 apaga la luz, 🚰 cierra el grifo y 🌳 cuida las plantas.",
        preguntas: [["¿Qué apagamos?", "=luz|la luz"], ["¿Qué cerramos?", "=grifo|el grifo"], ["¿Qué cuidamos?", "=plantas|las plantas|arboles|árboles"]]
      },
      "SA3-S1": {
        facil: "Mi frase del pódcast", pasos: ["👀 Mira la ficha.", "🔊 Escucha la ficha.", "✏️ Escribe una palabra."],
        ficha: "{flag} Mi frase para el pódcast: «Hola, soy de {pais}. La capital es {capital}. Allí dicen «{hola}»».",
        preguntas: [["¿Cuál es la capital?", "capital"], ["¿Cómo dicen hola?", "hola"]]
      },
      "SA3-S2": {
        facil: "Grabo mi voz", pasos: ["🎙️ Con tu profe, graba tu frase.", "🔊 Escucha tu grabación.", "✏️ Responde aquí."],
        ficha: "🎙️ Para grabar: pulsa el botón rojo ⏺️, di tu frase y pulsa parar ⏹️.",
        preguntas: [["¿De qué color es el botón para grabar?", "=rojo"], ["¿Qué dices en la grabación?", "=hola|mi frase|frase"]]
      }
    }
  };

  /* ---------- Programa: niveles cortos solo con flechas ---------- */
  // Mismas ciudades que la aventura 1 (así cada nivel lleva el mismo indicador). Bloques: avanzar, atras, izq, der, saltar.
  window.AVENTURAS_AC = [{
    nombre: "Mi viaje con flechas", resumen: "Flechas para llegar a la bandera.",
    niveles: [
      { ciudad: "Madrid", pais: "España", suelo: "#e3c99a", bandera: { o: "h", c: ["#c60b1e", "#ffc400", "#c60b1e"], w: [1, 2, 1] },
        dato: "Madrid es la capital de España.", objetivo: "Pulsa la flecha ⬆️ tres veces y luego ▶ Ejecutar.", mapa: ["XXXX", "P..G", "XXXX"], dir: 0, bloques: ["avanzar"], reto: 3 },
      { ciudad: "Lisboa", pais: "Portugal", suelo: "#e8dcc2", bandera: { o: "v", c: ["#046a38", "#da291c"], w: [2, 3] },
        dato: "Lisboa tiene tranvías amarillos.", objetivo: "La bandera está detrás. Usa la flecha ⬇️ atrás.", mapa: ["XXXX", "G..P", "XXXX"], dir: 0, bloques: ["avanzar", "atras"], reto: 3 },
      { ciudad: "París", pais: "Francia", suelo: "#d8d2c4", bandera: { o: "v", c: ["#0055a4", "#ffffff", "#ef4135"], w: [1, 1, 1] },
        dato: "En París está la Torre Eiffel.", objetivo: "Avanza, gira ↪️ y avanza.", mapa: ["P.", "X.", "XG"], dir: 0, bloques: ["avanzar", "atras", "der"], reto: 4 },
      { ciudad: "Roma", pais: "Italia", suelo: "#e6c7a1", bandera: { o: "v", c: ["#009246", "#ffffff", "#ce2b37"], w: [1, 1, 1] },
        dato: "En Roma está el Coliseo.", objetivo: "¡Una maleta! Usa ⤴️ saltar.", mapa: ["XXXXX", "P.B.G", "XXXXX"], dir: 0, bloques: ["avanzar", "atras", "saltar"], reto: 3 },
      { ciudad: "Berlín", pais: "Alemania", suelo: "#d4d4cc", bandera: { o: "h", c: ["#000000", "#dd0000", "#ffce00"], w: [1, 1, 1] },
        dato: "En Berlín está la Puerta de Brandeburgo.", objetivo: "Avanza y gira ↩️ a la izquierda.", mapa: ["XXG", "XX.", "P.."], dir: 0, bloques: ["avanzar", "atras", "izq", "der"], reto: 5 },
      { ciudad: "Bruselas", pais: "Bélgica", suelo: "#ddd6c8", bandera: { o: "v", c: ["#000000", "#fdda24", "#ef3340"], w: [1, 1, 1] },
        dato: "En Bruselas hay mucho chocolate.", objetivo: "Recoge el sello ⭐ y llega a la bandera.", mapa: ["P.S.", "XXX.", "XXXG"], dir: 0, bloques: ["avanzar", "atras", "izq", "der", "saltar"], reto: 6 }
    ]
  }];
  if (ADAPTADO && window.AVENTURAS) window.AVENTURAS = window.AVENTURAS_AC;

  /* ---------- Robótica: robot de flechas y retos cortos ---------- */
  window.RETOS_ROB_AC = [
    { titulo: "Hasta Italia", texto: "Ve de España a Italia con la flecha adelante.", inicio: ["A5", "E"], metas: [["D5", "Italia"]] },
    { titulo: "Vuelta a España", texto: "Vuelve a España con la flecha atrás.", inicio: ["D5", "E"], metas: [["A5", "España"]] },
    { titulo: "Sube al Reino Unido", texto: "Sube hasta el Reino Unido.", inicio: ["B5", "N"], metas: [["B3", "Reino Unido"]] },
    { titulo: "Hasta Alemania", texto: "Sube una casilla, gira y llega a Alemania.", inicio: ["A5", "N"], metas: [["C4", "Alemania"]] }
  ];

  /* ---------- Piensa: lectura corta, vídeo y juego de «bien o mal» ---------- */
  // juego: [dibujo, frase, true si está bien]
  window.PIENSA_AC = {
    itv: { lectura: "El ordenador tiene pantalla, teclado y ratón. Si no se oye, subimos el sonido. Si algo falla, pedimos ayuda.", video: "egTWbikmo4A",
      juego: [["🔊", "No se oye: subo el sonido.", true], ["🔨", "El ordenador no va: le doy un golpe.", false], ["🙋", "Algo falla: pido ayuda a mi profe.", true], ["🥤", "Pongo mi zumo encima del teclado.", false]] },
    contrasenas: { lectura: "La contraseña es secreta. No se la decimos a nadie. Solo la saben mi familia y mi profe.", video: "Cp4Tiq3LOrc",
      juego: [["🤫", "Mi contraseña es un secreto.", true], ["📢", "Digo mi contraseña a mis amigos.", false], ["🚪", "Al terminar, cierro sesión.", true], ["📝", "Escribo la contraseña en la mesa.", false]] },
    cartero: { lectura: "Un correo empieza con «Hola» y termina con «Adiós». Escribimos a quien conocemos.", video: "Kdn81wnb0gY",
      juego: [["👋", "Empiezo el correo con «Hola».", true], ["😠", "Escribo palabras feas.", false], ["📎", "Mi profe me ayuda a poner el archivo.", true], ["❓", "Abro un correo de alguien que no conozco.", false]] },
    netiqueta: { lectura: "En internet hablamos con respeto. Saludamos, damos las gracias y no gritamos.", video: "SrDvQCcNwWQ",
      juego: [["🙏", "Digo «por favor» y «gracias».", true], ["🔠", "ESCRIBO TODO EN MAYÚSCULAS PARA GRITAR.", false], ["😊", "Saludo al entrar.", true], ["🤬", "Insulto a un compañero.", false]] },
    detectives: { lectura: "En internet hay cosas de verdad y cosas de mentira. Si no lo sé, pregunto a un adulto.", video: "qMRm4UE1gOc",
      juego: [["🙋", "No sé si es verdad: pregunto a mi profe.", true], ["🦄", "Me creo todo lo que veo.", false], ["🔒", "Busco el candado en la web.", true], ["🎁", "Pulso «¡Has ganado un premio!».", false]] },
    bandeja: { lectura: "Algunos correos son trampas. Si no conozco a quien me escribe, no lo abro y aviso a un adulto.", video: "uhzV5-iFb5E",
      juego: [["🧑‍🏫", "Abro el correo de mi profe.", true], ["💰", "Abro «¡Gana dinero ya!».", false], ["📣", "Aviso a un adulto si algo es raro.", true], ["🔑", "Doy mi contraseña por correo.", false]] },
    escudo: { lectura: "Si algo de internet me hace sentir mal, se lo cuento a un adulto. No contesto.", video: "ZHQ03fSn9J0",
      juego: [["🗣️", "Me siento mal: se lo cuento a mi familia.", true], ["😡", "Contesto con insultos.", false], ["🛡️", "Ayudo a un compañero y aviso al profe.", true], ["📸", "Paso fotos de otros sin permiso.", false]] },
    redes: { lectura: "En internet no decimos nuestro nombre, ni dónde vivimos, ni el teléfono. Es privado.", video: "D45fI_rX8iM",
      juego: [["🦸", "Uso un apodo, no mi nombre.", true], ["🏠", "Digo dónde vivo.", false], ["🐱", "Pongo un dibujo en vez de mi foto.", true], ["📞", "Doy mi teléfono a un desconocido.", false]] },
    influencers: { lectura: "Algunos vídeos son anuncios para que compremos. No todo lo que vemos es verdad.", video: "yyQuyJObd_4",
      juego: [["🧐", "Pienso: ¿esto es un anuncio?", true], ["🛒", "Compro todo lo que sale en los vídeos.", false], ["🙋", "Pregunto a mi familia.", true], ["✨", "Todo lo de internet es verdad.", false]] },
    "uso-tic": { lectura: "Usamos la pantalla un rato y descansamos. Nos sentamos bien y cuidamos el material.", video: "tBObvkx_nOg",
      juego: [["🪑", "Me siento bien en la silla.", true], ["🌙", "Juego con la tablet toda la noche.", false], ["⏰", "Descanso de la pantalla.", true], ["💥", "Tiro el ratón al suelo.", false]] }
  };

  // Leer en voz alta (botones 🔊 con data-leer).
  window.LeerAC = function (t) {
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(t || "")); u.lang = "es-ES"; u.rate = 0.85; speechSynthesis.speak(u); } catch (e) {}
  };
  if (!ADAPTADO) return;
  document.documentElement.classList.add("adaptado");
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-leer]"); if (b) { e.preventDefault(); window.LeerAC(b.dataset.leer); } });
  // 🔊 al lado del objetivo de Programa y del reto de Robótica.
  document.addEventListener("DOMContentLoaded", () => {
    ["#texto-objetivo", "#rb-texto-reto"].forEach((sel) => {
      const el = document.querySelector(sel); if (!el) return;
      const b = document.createElement("button"); b.type = "button"; b.className = "leer mini"; b.textContent = "🔊"; b.setAttribute("aria-label", "Escuchar");
      b.onclick = (e) => { e.preventDefault(); window.LeerAC(el.textContent); };
      el.insertAdjacentElement("beforebegin", b);
    });
  });
  const AC = window.INDICADORES_AC["5º"];
  // Las pantallas leen INDICADORES: se cambian por los básicos (mismo número de indicador).
  if (window.INDICADORES) { window.INDICADORES["5º"] = Object.assign({}, window.INDICADORES["5º"], AC); }
  (window.PIENSA || []).forEach((p) => { p.i5 = p.i5.map(([cod]) => [cod, AC[cod] || ""]); });
  // Crea: se marca cada reto como adaptado (rincones.js pinta la versión fácil).
  ((window.CREA || {})["5º"] || []).forEach((a) => { const x = window.CREA_AC["5º"][a.sa + "-" + a.s]; if (x) a.ac = x; });
})();
