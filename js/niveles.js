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
    ciudad: "Londres", pais: "Reino Unido", suelo: "#d6d3cb",
    bandera: { uk: true },
    dato: "El Big Ben es la gran campana de la torre del reloj del Parlamento, junto al río Támesis.",
    objetivo: "Baja la escalera cruzando los puentes del Támesis. Busca los cuatro bloques que se repiten.",
    mapa: ["PW.XXXXXX", "XXSW.XXXX", "XXXXSW.XX", "XXXXXXSWG"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "repetir"], reto: 5
  },
  {
    ciudad: "Zúrich", pais: "Suiza", suelo: "#dfe3d6",
    bandera: { suiza: true },
    dato: "Suiza tiene cuatro lenguas oficiales: alemán, francés, italiano y romanche.",
    objetivo: "Sube por los Alpes: avanza, gira, salta la maleta y vuelve a mirar hacia arriba. ¿Cuántas veces se repite?",
    mapa: ["XXXX.BG", "XXXXSXX", "XX.B.XX", "XXSXXXX", ".B.XXXX", "SXXXXXX", "PXXXXXX"], dir: 3,
    bloques: ["avanzar", "saltar", "izq", "der", "repetir"], reto: 6
  },
  {
    ciudad: "Luxemburgo", pais: "Luxemburgo", suelo: "#e2d8c8",
    bandera: { o: "h", c: ["#ed2939", "#ffffff", "#00a1de"], w: [1, 1, 1] },
    dato: "Luxemburgo es uno de los países más pequeños de Europa y uno de los que fundaron la Unión Europea.",
    objetivo: "Reto final de la ruta: rodea la fortaleza. Hay tres tramos distintos: usa un Repetir en cada uno.",
    mapa: ["P.W..WS", "XXXXXX.", "XXXXXX.", "XXGB.BS"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "repetir"], reto: 9
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
    ciudad: "Reikiavik", pais: "Islandia", suelo: "#d3dbe0",
    bandera: { nordica: true, fondo: "#02529c", cruz: "#ffffff", interior: "#dc1e35" },
    dato: "En Islandia hay géiseres: fuentes de agua caliente que lanzan chorros muy altos.",
    objetivo: "Rodea el campo de géiseres. Los lados son iguales: pon un Repetir dentro de otro Repetir.",
    mapa: ["S..W.S", ".XXXX.", "WXXXX.", ".XXXXW", ".XXXX.", "PGW..S"], dir: 3,
    bloques: ["avanzar", "saltar", "izq", "der", "repetir"], reto: 6
  },
  {
    ciudad: "Tallin", pais: "Estonia", suelo: "#e0d6c4",
    bandera: { o: "h", c: ["#0072ce", "#000000", "#ffffff"], w: [1, 1, 1] },
    dato: "El casco antiguo de Tallin conserva su muralla medieval, con muchas torres de tejado rojo.",
    objetivo: "Baja por la muralla: salta, gira, avanza dos veces y gira. Usa un Repetir dentro de otro.",
    mapa: ["PB.XXXX", "XX.XXXX", "XXSB.XX", "XXXX.XX", "XXXXSB.", "XXXXXX.", "XXXXXXG"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "repetir"], reto: 6
  },
  {
    ciudad: "Riga", pais: "Letonia", suelo: "#dcd4c9",
    bandera: { o: "h", c: ["#9e3039", "#ffffff", "#9e3039"], w: [2, 1, 2] },
    dato: "Riga es la ciudad más grande de los países bálticos y está junto al río Daugava.",
    objetivo: "Recorre la ciudad en zigzag, de un lado a otro, como cuando se corta el césped. ¡Hay cuatro sellos!",
    mapa: ["P...S", "S....", "....S", "S....", "GXXXX"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "repetir"], reto: 11
  },
  {
    ciudad: "Vilna", pais: "Lituania", suelo: "#e3d9c3",
    bandera: { o: "h", c: ["#fdb913", "#006a44", "#c1272d"], w: [1, 1, 1] },
    dato: "En Vilna, la torre del castillo de Gediminas vigila la ciudad desde lo alto de una colina.",
    objetivo: "Sube y baja por las almenas del castillo y salta las maletas. Encuentra el patrón con giros a los dos lados.",
    mapa: [".SX.SX.SXX", "P.B..B..BG"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "repetir"], reto: 9
  },
  {
    ciudad: "Edimburgo", pais: "Reino Unido (Escocia)", suelo: "#d5d9cf",
    bandera: { escocia: true },
    dato: "El castillo de Edimburgo está construido sobre un antiguo volcán apagado.",
    objetivo: "Reto final de la ruta: un camino en forma de S. Necesitas un Repetir dentro de otro… ¡y dentro de otro!",
    mapa: ["PX.S.X.SG", ".X.X.X.XX", ".S.X.S.XX"], dir: 1,
    bloques: ["avanzar", "saltar", "izq", "der", "repetir"], reto: 9
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
    ciudad: "Bratislava", pais: "Eslovaquia", suelo: "#e4d6bf",
    bandera: { o: "h", c: ["#ffffff", "#0b4ea2", "#ee1c25"], w: [1, 1, 1] },
    dato: "Bratislava está a orillas del Danubio, muy cerca de Austria y de Hungría.",
    objetivo: "Un camino largo con maletas, canales y curvas a los dos lados. Deja que el programa decida en cada paso.",
    mapa: ["P.B.X.S", "XXX.X.X", "SW....X", "XXXXX.X", "XG.B..X"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "si", "hasta"], reto: 8
  },
  {
    ciudad: "Liubliana", pais: "Eslovenia", suelo: "#dfd8c8",
    bandera: { o: "h", c: ["#ffffff", "#005da4", "#ed1c24"], w: [1, 1, 1] },
    dato: "El símbolo de Liubliana es un dragón: hay cuatro en el Puente de los Dragones.",
    objetivo: "Hay caminos sin salida con sellos. Truco: si hay camino a la derecha, gira a la derecha; si no, sigue recto.",
    mapa: ["P.W..XS", "XXXX.X.", "S.B....", "XXXXX.X", "G..W..X"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "si", "hasta"], reto: 8
  },
  {
    ciudad: "Zagreb", pais: "Croacia", suelo: "#e6d3be",
    bandera: { o: "h", c: ["#ff0000", "#ffffff", "#171796"], w: [1, 1, 1] },
    dato: "La iglesia de San Marcos de Zagreb tiene un tejado de colores con dos escudos.",
    objetivo: "Un laberinto con tres sellos escondidos. Sigue siempre la pared de la derecha y no te perderás.",
    mapa: ["P..X..S", "XX.X.XX", "S....XX", "XX.X.XX", "XXBXSXX", "XX.XXXX", "XX...WG"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "si", "hasta"], reto: 8
  },
  {
    ciudad: "Sofía", pais: "Bulgaria", suelo: "#e0d4c0",
    bandera: { o: "h", c: ["#ffffff", "#00966e", "#d62612"], w: [1, 1, 1] },
    dato: "Sofía está a los pies de la montaña Vitosha, donde se puede esquiar en invierno.",
    objetivo: "Laberinto más grande, con maletas y canales en los desvíos. Un solo programa tiene que servir para todo.",
    mapa: ["S.B..XG", "XXXX.X.", "..W....", ".XXXXXX", "..SX..S", "XX.X.XX", "P....XX"], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "si", "hasta"], reto: 8
  },
  {
    ciudad: "Belgrado", pais: "Serbia", suelo: "#ddd0bd",
    bandera: { o: "h", c: ["#c6363c", "#0c4076", "#ffffff"], w: [1, 1, 1] },
    dato: "En Belgrado se juntan dos ríos: el Sava y el Danubio.",
    objetivo: "Reto final: el gran laberinto. Recoge los cuatro sellos de los callejones y llega a la bandera.",
    mapa: ["P..B..XS", "XXXXX.X.", "S.W.....", "XXXXX.XX", "G..B..XS", "XXXXX.X.", "S..W...."], dir: 0,
    bloques: ["avanzar", "saltar", "izq", "der", "si", "hasta"], reto: 8
  }
    ]
  }
];
