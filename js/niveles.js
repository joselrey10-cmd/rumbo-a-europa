/*
  AVENTURAS Y NIVELES (destinos de Europa)
  ----------------------------------------
  Hay tres aventuras. Cada una tiene su lista de destinos (niveles).
  Leyenda del mapa:
    P = salida del personaje      G = bandera de meta
    . = camino                    S = sello del pasaporte (hay que recogerlo)
    X = obstáculo (árbol)         B = maleta (se puede saltar)
    W = canal de agua (se puede saltar)   (espacio) = vacío
  dir: hacia dónde mira al empezar: 0 derecha, 1 abajo, 2 izquierda, 3 arriba.
  bloques: bloques disponibles en la paleta
           (avanzar, izq, der, saltar, repetir, si, hasta).
  reto: número de bloques de la solución corta (para las 3 estrellas).
*/
window.AVENTURAS = [
  {
    nombre: "Europa Occidental",
    resumen: "Ruta sencilla · Primeros pasos: avanzar, girar, saltar y repetir.",
    niveles: [
  {
    ciudad: "Madrid", pais: "España", suelo: "#e3c99a",
    bandera: { o: "h", c: ["#c60b1e", "#ffc400", "#c60b1e"], w: [1, 2, 1] },
    dato: "Madrid es la capital de España. Desde aquí empieza nuestro viaje.",
    objetivo: "Llega a la bandera usando el bloque Avanzar.",
    mapa: ["XXXXX", "P...G", "XXXXX"], dir: 0,
    bloques: ["avanzar"], reto: 4
  },
  {
    ciudad: "Lisboa", pais: "Portugal", suelo: "#e8dcc2",
    bandera: { o: "v", c: ["#046a38", "#da291c"], w: [2, 3] },
    dato: "Lisboa tiene tranvías amarillos que suben por sus cuestas.",
    objetivo: "Hay que girar para llegar. Prueba Girar a la derecha.",
    mapa: ["P..X", "XX.X", "XX.G"], dir: 0,
    bloques: ["avanzar", "izq", "der"], reto: 7
  },
  {
    ciudad: "París", pais: "Francia", suelo: "#d8d2c4",
    bandera: { o: "v", c: ["#0055a4", "#ffffff", "#ef4135"], w: [1, 1, 1] },
    dato: "En París está la Torre Eiffel, de 330 metros de altura.",
    objetivo: "Recoge el sello del pasaporte antes de llegar a la bandera.",
    mapa: ["P.S.", "XXX.", "G..."], dir: 0,
    bloques: ["avanzar", "izq", "der"], reto: 10
  },
  {
    ciudad: "Roma", pais: "Italia", suelo: "#e6c7a1",
    bandera: { o: "v", c: ["#009246", "#ffffff", "#ce2b37"], w: [1, 1, 1] },
    dato: "El Coliseo de Roma tiene casi 2.000 años.",
    objetivo: "¡Maletas en el camino! Usa Saltar para pasar por encima.",
    mapa: ["XXXXXXXX", "P.B..B.G", "XXXXXXXX"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der"], reto: 5
  },
  {
    ciudad: "Berlín", pais: "Alemania", suelo: "#d4d4cc",
    bandera: { o: "h", c: ["#000000", "#dd0000", "#ffce00"], w: [1, 1, 1] },
    dato: "La Puerta de Brandeburgo es el símbolo de Berlín.",
    objetivo: "Un camino muy largo. Usa Repetir para no poner tantos bloques.",
    mapa: ["XXXXXXXXXX", "P...S....G", "XXXXXXXXXX"], dir: 0,
    bloques: ["avanzar", "izq", "der", "repetir"], reto: 2
  },
  {
    ciudad: "Ámsterdam", pais: "Países Bajos", suelo: "#d9c3a5",
    bandera: { o: "h", c: ["#ae1c28", "#ffffff", "#21468b"], w: [1, 1, 1] },
    dato: "Ámsterdam tiene más de 100 kilómetros de canales.",
    objetivo: "Salta los canales. ¿Puedes hacerlo con Repetir?",
    mapa: ["XXXXXXXXX", "P.W.WSW.G", "XXXXXXXXX"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "repetir"], reto: 4
  },
  {
    ciudad: "Bruselas", pais: "Unión Europea", suelo: "#cfd6e3",
    bandera: { eu: true },
    dato: "En Bruselas se reúnen las instituciones de la Unión Europea.",
    objetivo: "Sube la escalera y recoge los dos sellos. Busca el patrón que se repite.",
    mapa: ["P.XX", "XS.X", "XX.S", "XXXG"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "repetir"], reto: 5
  },
  {
    ciudad: "Londres", pais: "Reino Unido", suelo: "#d9d9d0",
    bandera: { o: "v", c: ["#003399", "#ffffff", "#cc0000"], w: [1, 1, 1] },
    dato: "Londres es una ciudad europea que forma parte de nuestro viaje.",
    objetivo: "Cruza la ciudad y llega hasta la bandera.",
    mapa: ["P..X", "XX.X", "XX.G"], dir: 0,
    bloques: ['avanzar', 'izq', 'der'], reto: 3
  },
  {
    ciudad: "Zúrich", pais: "Suiza", suelo: "#d9d9d0",
    bandera: { o: "v", c: ["#003399", "#ffffff", "#cc0000"], w: [1, 1, 1] },
    dato: "Zúrich es una ciudad europea que forma parte de nuestro viaje.",
    objetivo: "Salta la maleta que bloquea el camino.",
    mapa: ["XXXXXXXX", "P.B..B.G", "XXXXXXXX"], dir: 0,
    bloques: ['avanzar', 'saltar', 'izq', 'der'], reto: 3
  },
  {
    ciudad: "Luxemburgo", pais: "Luxemburgo", suelo: "#d9d9d0",
    bandera: { o: "v", c: ["#003399", "#ffffff", "#cc0000"], w: [1, 1, 1] },
    dato: "Luxemburgo es una ciudad europea que forma parte de nuestro viaje.",
    objetivo: "Salta el canal y continúa hasta la meta.",
    mapa: ["XXXXXXXXX", "P.W.WSW.G", "XXXXXXXXX"], dir: 0,
    bloques: ['avanzar', 'saltar', 'izq', 'der', 'repetir'], reto: 3
  }
    ]
  },
  {
    nombre: "Europa del Norte",
    resumen: "Ruta intermedia · Caminos largos: bucles con giros y bucles dentro de bucles.",
    niveles: [
  {
    ciudad: "Dublín", pais: "Irlanda", suelo: "#cfe0c3",
    bandera: { o: "v", c: ["#169b62", "#ffffff", "#ff883e"], w: [1, 1, 1] },
    dato: "En Irlanda llueve tanto que la llaman la Isla Esmeralda por lo verde que es.",
    objetivo: "Rodea el parque. Usa un Repetir para cada tramo recto.",
    mapa: [".....", ".XXX.", "PXXXG"], dir: 3,
    bloques: ["avanzar", "izq", "der", "repetir"], reto: 8
  },
  {
    ciudad: "Copenhague", pais: "Dinamarca", suelo: "#e2d6c6",
    bandera: { nordica: true, fondo: "#c8102e", cruz: "#ffffff" },
    dato: "La bandera de Dinamarca es una de las más antiguas del mundo.",
    objetivo: "Baja la escalera. ¿Qué cuatro bloques se repiten?",
    mapa: ["P.XXX", "XS.XX", "XX.SX", "XXX..", "XXXXG"], dir: 0,
    bloques: ["avanzar", "izq", "der", "saltar", "repetir"], reto: 5
  },
  {
    ciudad: "Estocolmo", pais: "Suecia", suelo: "#d6d9cf",
    bandera: { nordica: true, fondo: "#006aa7", cruz: "#fecc00" },
    dato: "Estocolmo está construida sobre 14 islas unidas por puentes.",
    objetivo: "Da la vuelta a la isla saltando los canales.",
    mapa: ["P.W.S", "GXXX.", "WXXXW", ".XXX.", "..W.S"], dir: 0,
    bloques: ["avanzar", "izq", "der", "saltar", "repetir"], reto: 5
  },
  {
    ciudad: "Oslo", pais: "Noruega", suelo: "#dcd3c8",
    bandera: { nordica: true, fondo: "#ba0c2f", cruz: "#ffffff", interior: "#00205b" },
    dato: "En el norte de Noruega, en verano, el sol no se pone en todo el día.",
    objetivo: "Pon un Repetir dentro de otro Repetir.",
    mapa: ["P...", "XXXS", "XXX.", "G..."], dir: 0,
    bloques: ["avanzar", "izq", "der", "saltar", "repetir"], reto: 4
  },
  {
    ciudad: "Helsinki", pais: "Finlandia", suelo: "#d9dee3",
    bandera: { nordica: true, fondo: "#ffffff", cruz: "#002f6c" },
    dato: "Finlandia tiene unos 188.000 lagos.",
    objetivo: "Ida y vuelta saltando maletas. Busca el patrón.",
    mapa: ["PB.BS.", "G.BSB."], dir: 0,
    bloques: ["avanzar", "izq", "der", "saltar", "repetir"], reto: 7
  },
  {
    ciudad: "Reikiavik", pais: "Islandia", suelo: "#d9d9d0",
    bandera: { o: "v", c: ["#003399", "#ffffff", "#cc0000"], w: [1, 1, 1] },
    dato: "Reikiavik es una ciudad europea que forma parte de nuestro viaje.",
    objetivo: "Sigue el camino entre los paisajes volcánicos.",
    mapa: [".....", ".XXX.", "PXXXG"], dir: 0,
    bloques: ['avanzar', 'izq', 'der', 'repetir'], reto: 3
  },
  {
    ciudad: "Tallin", pais: "Estonia", suelo: "#d9d9d0",
    bandera: { o: "v", c: ["#003399", "#ffffff", "#cc0000"], w: [1, 1, 1] },
    dato: "Tallin es una ciudad europea que forma parte de nuestro viaje.",
    objetivo: "Usa un bucle para recorrer el camino y saltar la maleta.",
    mapa: ["P.XXX", "XS.XX", "XX.SX", "XXX..", "XXXXG"], dir: 0,
    bloques: ['avanzar', 'saltar', 'izq', 'der', 'repetir'], reto: 4
  },
  {
    ciudad: "Riga", pais: "Letonia", suelo: "#d9d9d0",
    bandera: { o: "v", c: ["#003399", "#ffffff", "#cc0000"], w: [1, 1, 1] },
    dato: "Riga es una ciudad europea que forma parte de nuestro viaje.",
    objetivo: "Cruza el canal usando el salto.",
    mapa: ["P.W.S", "GXXX.", "WXXXW", ".XXX.", "..W.S"], dir: 0,
    bloques: ['avanzar', 'saltar', 'izq', 'der', 'repetir'], reto: 4
  },
  {
    ciudad: "Vilna", pais: "Lituania", suelo: "#d9d9d0",
    bandera: { o: "v", c: ["#003399", "#ffffff", "#cc0000"], w: [1, 1, 1] },
    dato: "Vilna es una ciudad europea que forma parte de nuestro viaje.",
    objetivo: "Combina avances y saltos para superar los obstáculos.",
    mapa: ["P...", "XXXS", "XXX.", "G..."], dir: 0,
    bloques: ['avanzar', 'saltar', 'izq', 'der', 'repetir'], reto: 5
  },
  {
    ciudad: "Edimburgo", pais: "Reino Unido", suelo: "#d9d9d0",
    bandera: { o: "v", c: ["#003399", "#ffffff", "#cc0000"], w: [1, 1, 1] },
    dato: "Edimburgo es una ciudad europea que forma parte de nuestro viaje.",
    objetivo: "Recoge el sello antes de llegar a la bandera.",
    mapa: ["PB.BS.", "G.BSB."], dir: 0,
    bloques: ['avanzar', 'saltar', 'izq', 'der', 'repetir'], reto: 3
  }
    ]
  },
  {
    nombre: "Europa del Este",
    resumen: "Ruta avanzada · Programas que deciden solos: bloques Si y Repetir hasta llegar.",
    niveles: [
  {
    ciudad: "Praga", pais: "Chequia", suelo: "#e3cfb4",
    bandera: { checa: true },
    dato: "El reloj astronómico de Praga funciona desde hace más de 600 años.",
    objetivo: "Usa Repetir hasta llegar y dos bloques Si: si hay algo que saltar, salta; si hay camino, avanza.",
    mapa: ["XXXXXXXXXXX", "P.B..B.B..G", "XXXXXXXXXXX"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "si", "hasta"], reto: 5
  },
  {
    ciudad: "Viena", pais: "Austria", suelo: "#e6d9c6",
    bandera: { o: "h", c: ["#ed2939", "#ffffff", "#ed2939"], w: [1, 1, 1] },
    dato: "Viena es la ciudad de la música: allí vivieron Mozart y Beethoven.",
    objetivo: "Un camino en espiral. Avanza si hay camino y gira a la derecha cuando se pueda.",
    mapa: ["P....", "XXXX.", "..GX.", ".XXX.", "S...S"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "si", "hasta"], reto: 5
  },
  {
    ciudad: "Varsovia", pais: "Polonia", suelo: "#ddd2c2",
    bandera: { o: "h", c: ["#ffffff", "#dc143c"], w: [1, 1] },
    dato: "El casco antiguo de Varsovia se reconstruyó entero después de la guerra.",
    objetivo: "Zigzag: ahora hay que girar a los dos lados. Deja que el programa decida.",
    mapa: ["P.XS..", "X.X.X.", "X.S.XG"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "si", "hasta"], reto: 7
  },
  {
    ciudad: "Budapest", pais: "Hungría", suelo: "#e4d3b8",
    bandera: { o: "h", c: ["#ce2939", "#ffffff", "#477050"], w: [1, 1, 1] },
    dato: "El río Danubio divide Budapest en dos: Buda y Pest.",
    objetivo: "Maletas, un río y curvas. Combina tres bloques Si.",
    mapa: ["P.BS.", "XXXX.", "XXXXW", "GSB.."], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "si", "hasta"], reto: 7
  },
  {
    ciudad: "Bucarest", pais: "Rumanía", suelo: "#e0d0bd",
    bandera: { o: "v", c: ["#002b7f", "#fcd116", "#ce1126"], w: [1, 1, 1] },
    dato: "El Palacio del Parlamento de Bucarest es uno de los edificios más grandes del mundo.",
    objetivo: "El reto final: salta, avanza y gira a los dos lados con un solo programa.",
    mapa: ["P..XXX", "XXSXXX", "XXWXXX", "XX..S.", "XXXXX.", "XXXXXW", "XXXXXG"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "repetir", "si", "hasta"], reto: 9
  },
  {
    ciudad: "Bratislava", pais: "Eslovaquia", suelo: "#d9d9d0",
    bandera: { o: "v", c: ["#003399", "#ffffff", "#cc0000"], w: [1, 1, 1] },
    dato: "Bratislava es una ciudad europea que forma parte de nuestro viaje.",
    objetivo: "Programa una ruta que supere el obstáculo.",
    mapa: ["XXXXXXXXXXX", "P.B..B.B..G", "XXXXXXXXXXX"], dir: 0,
    bloques: ['avanzar', 'saltar', 'izq', 'der', 'si', 'hasta'], reto: 4
  },
  {
    ciudad: "Liubliana", pais: "Eslovenia", suelo: "#d9d9d0",
    bandera: { o: "v", c: ["#003399", "#ffffff", "#cc0000"], w: [1, 1, 1] },
    dato: "Liubliana es una ciudad europea que forma parte de nuestro viaje.",
    objetivo: "Usa decisiones para cruzar el canal.",
    mapa: ["P....", "XXXX.", "..GX.", ".XXX.", "S...S"], dir: 0,
    bloques: ['avanzar', 'saltar', 'izq', 'der', 'si', 'hasta'], reto: 4
  },
  {
    ciudad: "Zagreb", pais: "Croacia", suelo: "#d9d9d0",
    bandera: { o: "v", c: ["#003399", "#ffffff", "#cc0000"], w: [1, 1, 1] },
    dato: "Zagreb es una ciudad europea que forma parte de nuestro viaje.",
    objetivo: "Combina condiciones y saltos.",
    mapa: ["P.XS..", "X.X.X.", "X.S.XG"], dir: 0,
    bloques: ['avanzar', 'saltar', 'izq', 'der', 'si', 'hasta'], reto: 5
  },
  {
    ciudad: "Sofía", pais: "Bulgaria", suelo: "#d9d9d0",
    bandera: { o: "v", c: ["#003399", "#ffffff", "#cc0000"], w: [1, 1, 1] },
    dato: "Sofía es una ciudad europea que forma parte de nuestro viaje.",
    objetivo: "Llega a la bandera con un programa que se repite.",
    mapa: ["P.BS.", "XXXX.", "XXXXW", "GSB.."], dir: 0,
    bloques: ['avanzar', 'saltar', 'izq', 'der', 'si', 'hasta'], reto: 5
  },
  {
    ciudad: "Belgrado", pais: "Serbia", suelo: "#d9d9d0",
    bandera: { o: "v", c: ["#003399", "#ffffff", "#cc0000"], w: [1, 1, 1] },
    dato: "Belgrado es una ciudad europea que forma parte de nuestro viaje.",
    objetivo: "Reto final: decide cuándo avanzar y cuándo saltar.",
    mapa: ["P..XXX", "XXSXXX", "XXWXXX", "XX..S.", "XXXXX.", "XXXXXW", "XXXXXG"], dir: 0,
    bloques: ['avanzar', 'saltar', 'izq', 'der', 'repetir', 'si', 'hasta'], reto: 6
  }
    ]
  }
];
