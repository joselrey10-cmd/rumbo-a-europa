/*
  INDICADORES DE LOGRO (Programaciones didácticas de TIAC 2026-27, CEIP Tierra de Pinares)
  ----------------------------------------------------------------------------------------
  Textos copiados de cada programación (los 56 indicadores de 5.º y los 41 de 6.º). El curso se saca de la clase
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
    "1.1.1": "CCL3 · CD1 · CP1: Busca con dos o más palabras clave los datos de su país (capital, población, idioma, bandera) en varias fuentes y cómo se dice «hola» en su lengua para el Word colaborativo, y copia solo la información que pide su ruta (4 datos o 3 curiosidades).",
    "1.1.2": "CD1: Encuentra un dato comprobado sobre el uso de la bicicleta y el reciclaje en su país y anota en la tabla la web de la que lo obtiene.",
    "1.1.3": "CCL3 · CCL1: Comprueba ese dato en una segunda web y explica cuál de las dos es más fiable (web institucional, autor, fecha).",
    "1.1.4": "CCL3 · CD1 · CP1: Distingue en una web el contenido, la publicidad y los anuncios trampa, no pulsa los enlaces engañosos y lee los iconos y las palabras en inglés del navegador y de OneDrive (candado, pestañas, actualizar, Download, Share) y explica qué hace cada uno.",
    "1.1.5": "CP1 · CD1: Busca cómo se dice «hola» y otras expresiones básicas en la lengua de su país y comprueba su pronunciación para el guion del pódcast.",
    "1.2.1": "CE3: Guarda el PDF del dossier con un nombre reconocible (país_nombre) en la carpeta de TIAC y lo vuelve a localizar cuando se le pide.",
    "1.2.2": "CE3: Durante la ITV crea, mueve y elimina carpetas y archivos en el ordenador sin perder información y vacía la papelera de reciclaje.",
    "1.2.3": "CE3: Sube la tabla de Excel y el cartel de Canva a la carpeta de TIAC del curso en OneDrive, en las subcarpetas «Excel» y «Canva», y los descarga cuando los necesita.",
    "2.1.1": "CCL5 · CP1: Redacta la carta al consulado en un correo de Educacyl con destinatario, asunto, saludo, cuerpo y despedida, desde la plantilla o con texto propio según su ruta, y lee los iconos y las palabras en inglés del correo (clip de adjuntar, Send, Reply, Forward) para usarlos correctamente.",
    "2.1.2": "CCL5 · CCEC3: Deja en el blog BiblioPini o en La Piña 3.0 un comentario respetuoso, pertinente y bien escrito sobre una entrada.",
    "2.1.3": "CPSAA4 · CC1: Reconoce una noticia falsa por sus pistas (titular exagerado, sin fuente, sin fecha) y decide no reenviarla.",
    "2.1.4": "CCL5 · CPSAA3: Participa en Teams (publicaciones, chat y tareas) con mensajes respetuosos y pertinentes y entrega las tareas con el archivo adjunto correcto.",
    "2.2.1": "CCL5 · CE3: Envía el PDF del dossier como adjunto del correo o, en la ruta avanzada, como enlace de OneDrive, y comprueba que se abre.",
    "2.2.2": "CE3: Incluye en el cartel un código QR que enlaza a información de una especie del patio o a consejos de ahorro de energía o agua, y comprueba que funciona.",
    "2.2.3": "CCL5 · CE3: Comparte el guion del pódcast desde OneDrive con su tripulación con permiso de edición y, en la ruta avanzada, envía el audio final por correo como adjunto.",
    "2.3.1": "CD3 · CPSAA5: Completa su apartado del Word colaborativo de países de su tripulación sin borrar ni sobrescribir el trabajo de los demás.",
    "2.3.2": "CCL5 · CP1: Escribe su sección del guion compartido (capital, habitantes, «hola» en su idioma, curiosidades) y revisa con un comentario la sección de un compañero.",
    "3.1.1": "CD2 · CCEC4: Da formato al dossier de su país en Word (título, viñetas, imagen y márgenes) y lo exporta a PDF comprobando que se ve completo y legible.",
    "3.1.2": "STEM4 · CD2: Organiza en una tabla de Excel los datos de bicicleta y reciclaje de los países de la tripulación y crea una gráfica que los compara.",
    "3.1.3": "CD2 · CCEC4: Diseña en Canva el cartel «Europa cuida, yo cuido» sobre energía, agua o plantas del patio con texto legible, iconos e imágenes según su ruta (sencillo, complejo o profesional).",
    "3.1.4": "CD2 · CE3: Graba con Audacity su parte del pódcast «Diario de a bordo» con voz clara, corta los errores y ajusta el volumen.",
    "3.2.1": "STEM3 · CD5: Programa a Marco en Run Marco con secuencias de direcciones y giros hasta la casilla de su ruta y dice los pasos en voz alta antes de ejecutar.",
    "3.2.2": "STEM3 · CD5: Usa bucles en lugar de repetir bloques (y condicionales en la ruta avanzada) en Run Marco y en Minecraft Adventure de Code.org hasta la pantalla de su ruta.",
    "3.2.3": "STEM3 · CD3: Programa el Robot Mouse con flechas o el SPIKE Essential para ir de norte a sur y de Madrid a su país en el tablero, midiendo antes avances y giros.",
    "3.2.4": "CD5 · CCEC4: Programa eventos en Diseñador de Minecraft (Code.org) para que los personajes reaccionen y llega a la pantalla de su ruta.",
    "3.2.5": "STEM3 · CD5: Resuelve en Minecraft Voyage Aquatic retos con bucles y condicionales hasta la pantalla de su ruta.",
    "3.2.6": "STEM3 · CD3: Planifica en el panel la ruta de España a su país (por cuadros con Cody, por tierra o por aire), la programa y la amplía a ida y vuelta reutilizando el programa.",
    "3.2.7": "CD2 · CD5: Inicia sesión en MakeCode, programa la micro:bit para mostrar su nombre (o un love meter, contador de pasos o medidor de ruido) y lo prueba en el simulador antes de descargarlo.",
    "3.2.8": "STEM3 · CD3: Programa el código secreto de su país en la micro:bit con un sensor (agitar, poca luz o inclinar) para el escape Europe de las tripulaciones.",
    "3.2.9": "STEM3 · CD3: Mide distancias y calcula avances y giros para programar con LEGO SPIKE Essential el regreso de su país a España, ida y vuelta o por todos los países del grupo.",
    "3.3.1": "CD2 · CCEC4: Inserta en el Word colaborativo una imagen de un banco Creative Commons y escribe debajo su autor y su fuente.",
    "3.3.2": "CPSAA4 · CCEC4: Usa en el cartel de Canva elementos e imágenes de uso libre, no copia carteles ajenos e indica la fuente de la información.",
    "3.3.3": "CD2 · CE3: Utiliza en el pódcast música y efectos de uso libre y nombra en los créditos a sus autores y fuentes.",
    "3.4.1": "CC3 · CCEC4: Reconoce los iconos de la licencia CC de la imagen elegida (BY, NC, ND, SA) y explica si puede usarla en el dossier.",
    "3.4.2": "CC3 · CCEC4: Elige una licencia Creative Commons para publicar el pódcast en La Piña 3.0 y explica qué permite hacer a otras personas.",
    "4.1.1": "CD4: Crea en la actividad de LUMIO una contraseña segura para «la maleta» (frase de paso con mayúsculas, números y símbolos, sin datos personales) y explica dónde guardarla y cómo cambiarla.",
    "4.1.2": "CD4: Inicia sesión en Code.org y MakeCode con su cuenta Microsoft de Educacyl y la cierra al terminar sin dejar sus credenciales a la vista.",
    "4.1.3": "CD4: Comprueba el candado y el «https» de una web antes de escribir datos y explica si es segura.",
    "4.1.4": "CD4: Clasifica en la «bandeja trampa» del Cartero digital los correos legítimos, el spam y el phishing, y señala las pistas (remitente, enlace, urgencia, adjunto).",
    "4.2.1": "CD4: Explica qué son las cookies, rechaza las no necesarias en un aviso y sabe borrarlas del navegador.",
    "4.2.2": "CD4 · CC2: Identifica qué datos personales no debe dar en un anuncio, juego o formulario y explica qué huella digital deja al hacerlo.",
    "4.2.3": "CD4 · CC2: Ante un caso de suplantación aplica el protocolo parar, comprobar y pedir ayuda, y pide permiso antes de publicar fotos o datos de otra persona.",
    "4.3.1": "CD4 · CD5: Completa la ITV de su ordenador: comprueba sonido, wifi y brillo, cambia el fondo y ordena iconos y escritorio sin alterar la configuración del centro.",
    "4.3.2": "CD4: Nombra en el Cartero digital las partes del ordenador y sus periféricos y explica para qué sirve cada una.",
    "4.3.3": "CD4 · CD5: Nombra amenazas que llegan en correos trampa (virus, troyano, spyware, adware) y una medida para proteger el equipo (no abrir adjuntos, antivirus, no instalar programas desconocidos).",
    "4.3.4": "CD4: Mantiene postura, distancia y pausas, cuida el material de robótica y apaga y guarda el equipo al terminar.",
    "5.1.1": "CD2 · CD3: En la revisión del viaje explica qué herramienta usó en cada rincón (Word, correo, Run Marco, Code.org, robot, LUMIO) y para qué la usó.",
    "5.1.2": "STEM3 · CD2: Elige Excel para comparar datos y Canva para comunicar el mensaje del cartel, y justifica la elección según el destinatario.",
    "5.1.3": "STEM3 · CCEC4: Elige el sensor de la micro:bit (agitar, luz o inclinación) adecuado a la pista de su escape Europe y explica por qué.",
    "5.2.1": "CC2: Cuando Marco o el robot no llegan al destino, localiza la instrucción equivocada, cambia un elemento cada vez y vuelve a probar hasta conseguirlo.",
    "5.2.2": "CC2: Ante un fallo en la ITV (sin sonido, sin wifi, aplicación bloqueada) sigue la pauta de solución (comprobar, reiniciar, pedir ayuda) y explica qué ha probado.",
    "5.2.3": "CC2: Lee el aviso de error de Code.org, corrige el bloque y vuelve a ejecutar sin empezar de cero.",
    "5.2.4": "CC2: Comprueba en el simulador por qué la micro:bit no muestra el número esperado y corrige el programa.",
    "5.3.1": "CD3 · CD5: Cuando no le toca programar, ayuda a su compañero de tripulación solo con pistas o preguntas, sin tocar el robot ni el programa del otro.",
    "5.3.2": "CD1 · CD5: Revisa en su pasaporte los indicadores conseguidos, elige qué tarea repetir o a qué ruta subir y lo anota.",
    "5.3.3": "CD2 · CD3: Explica a otra tripulación cómo resolvió un reto (micro:bit o robot) con una miniguía de pasos que les permite hacerlo."
  },
  "6º": {
    "1.1.1": "CD1, CCL3: Busca en Internet los datos pedidos de su país (capital, habitantes, monumento y curiosidades) con palabras clave y anota la web de cada dato.",
    "1.1.2": "CD1, CCL3: Comprueba un dato en una segunda web fiable antes de usarlo, también cuando el dato lo ha dado una IA.",
    "1.1.3": "CCL3, CP1: Distingue una noticia fiable de un bulo (autor, fecha, fuentes, titular que asusta o mete prisa) y sabe que debe comprobarla en otro medio antes de compartirla.",
    "1.1.4": "CD1, CCL3: Reconoce diferentes navegadores.",
    "1.2.1": "CE3: Guarda sus trabajos en la carpeta de OneDrive indicada (TIAC · curso · SA o subcarpeta) con un nombre claro.",
    "1.2.2": "CE3: Exporta su trabajo al formato pedido (Word a PDF, Audacity a MP3) y comprueba que se abre.",
    "1.2.3": "CE3: Organiza el escritorio y crea y nombra carpetas en su ordenador.",
    "2.1.1": "CCL5, CC1: Escribe un correo con todas sus partes (Para, CC, CCO, asunto, saludo, cuerpo, despedida, firma y adjunto) y sabe cuándo usar CC y CCO.",
    "2.1.2": "CP1, CCEC3: Presenta su país con respeto, sin estereotipos, e incluye palabras de su lengua bien escritas y pronunciadas.",
    "2.1.3": "CPSAA3, CC1: Aplica la netiqueta en chats, correos y videollamadas: saluda, pide por favor, no grita en mayúsculas, pide turno y pide permiso antes de compartir imágenes de otros.",
    "2.2.1": "CCL5, CE3: Comparte su trabajo por OneDrive o Teams con las personas adecuadas y comprueba que pueden abrirlo.",
    "2.2.2": "CCL5, CE3: Crea un código QR que enlaza a información útil (especie, ahorro de agua o energía) y comprueba que funciona.",
    "2.3.1": "CD3, CPSAA5: Escribe su parte en un documento colaborativo de Word o PowerPoint sin borrar ni cambiar la de los demás.",
    "2.3.2": "CCL5, CD3: Completa con su tripulación una tabla de Excel compartida aportando sus datos en el lugar acordado.",
    "3.1.1": "STEM3, CD2: Crea en Excel una tabla con los datos de los países y un gráfico con título.",
    "3.1.2": "CD2, CCEC4: Diseña en Canva un cartel legible con título, información e imagen, cuidando tipografía, colores y orden.",
    "3.1.3": "CD2, CD3: Graba y edita en Audacity su parte del pódcast con voz clara, quitando silencios y errores.",
    "3.1.4": "CD2, CCEC4: Crea en PowerPoint una presentación colaborativa con título, información e imágenes, cuidando tipografía, colores y orden, incluyendo diseño y transiciones.",
    "3.2.1": "CD2, CD5: Anima en Scratch las letras del nombre de su país con eventos y bloques de apariencia, movimiento y sonido.",
    "3.2.2": "CD2, CD5: Programa en Scratch personajes que se desplazan o conversan por turnos siguiendo una secuencia ordenada.",
    "3.2.3": "STEM3, CD5: Utiliza bucles (repetir) para crear una sintonía o melodía en Scratch.",
    "3.2.4": "STEM3, CD5: Programa la micro:bit en MakeCode con botones y sensores (agitar, luz, inclinación) para mostrar un nombre, un número o una medida.",
    "3.2.5": "STEM3, CD2: Programa el robot para recorrer una ruta por el tablero: mide, avanza y gira hasta llegar al país indicado.",
    "3.2.6": "CD3, CD5: Prueba su programa, localiza el error y lo corrige cambiando una cosa cada vez.",
    "3.3.1": "CD2, CE3: Usa imágenes con licencia Creative Commons y escribe su autor o la web de origen.",
    "3.3.2": "CD3, CCEC4: Indica los créditos de lo que usa en su producción (imágenes, música, datos o ayuda de la IA).",
    "3.4.1": "CC3, CCEC4: Reconoce las licencias Creative Commons (BY, NC, ND, SA, CC0) y el ©, y cita una imagen con título, autor, fuente y licencia.",
    "3.4.2": "CC3, CCEC4: Distingue una obra de dominio público (como el Himno de Europa) de otra protegida por derechos de autor.",
    "4.1.1": "CD4: Crea una contraseña segura con el método de la frase secreta, sabe que no se comparte y explica qué es la verificación en dos pasos.",
    "4.1.2": "CD4: Inicia y cierra sesión correctamente (Educacyl, Microsoft, MakeCode) y no deja la sesión abierta.",
    "4.1.3": "CD4: Reconoce webs y mensajes trampa (sin https, nombre raro, prisa, premios, piden datos o códigos) y no da sus datos: cierra y avisa a un adulto.",
    "4.2.1": "CD4, CC2: Configura un perfil seguro (cuenta privada, avatar, apodo, sin ubicación ni datos personales) y decide qué se puede publicar y qué no.",
    "4.2.2": "CD4, CC2: Sabe cómo actuar ante el ciberacoso y la suplantación: no contesta, guarda pruebas, bloquea, denuncia y pide ayuda a un adulto; si lo ve, no lo difunde.",
    "4.3.1": "CD4: Ajusta su equipo (brillo, volumen, fondo) y explica cómo cuidar la postura y el tiempo de pantalla.",
    "4.3.2": "CD4, CD5: Usa, recoge y guarda con cuidado robots, placas y piezas, y avisa de las averías.",
    "5.1.1": "STEM3, CD2: Elige la herramienta o el sensor adecuado para cada reto (Excel, Canva, Audacity, IA o sensor de la micro:bit) y explica por qué.",
    "5.1.2": "CD2, CD3: Escribe a una IA una instrucción (prompt) clara con todo lo que necesita y revisa y corrige lo que propone antes de usarlo.",
    "5.2.1": "CC2: Resuelve problemas habituales del ordenador (sonido, wifi, pantalla o aplicación) siguiendo una lista de pasos.",
    "5.2.2": "CC2: Cuando el robot o la placa no funcionan, busca la causa (batería, conexión o programa) antes de pedir ayuda.",
    "5.3.1": "CD3, CD5: Ayuda a otra persona o tripulación con pistas, sin hacerle el trabajo (rol de ingeniero visitante).",
    "5.3.2": "CD1, CD3: Prueba el reto creado por otra tripulación (escape room) y le da una sugerencia útil para mejorarlo."
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
