/*
  PINICRAFT · AVENTURAS DE PROGRAMA DEL 2.º TRIMESTRE (5.º)
  ---------------------------------------------------------
  Dos aventuras de 10 pantallas cada una, con niveles, dibujos e historia propios del cole
  (no son copia de ningún juego comercial). Pini recorre paisajes y monumentos de Europa.

  Leyenda del mapa (vista desde arriba):
    P = salida de Pini          G = meta (portal de llegada)
    . = suelo (hierba, nieve, arena o adoquín según el fondo)
    T = árbol (se puede ROMPER: da 1 tronco de madera)
    R = roca  (se puede ROMPER: da 1 bloque de piedra)
    A = agua  (si Pini entra, se cae; con COLOCAR se hace un puente)
    L = lava  (si Pini entra, pierde; con COLOCAR se enfría y se puede pisar)
    C = cimiento (con COLOCAR delante se levanta un muro)
    X = seto, casa o valla (no se puede romper)
    N = piña (se recoge al pisarla)     E = estrella de la bandera europea (se recoge al pisarla)
    Q = placa de presión (activa el evento «Cuando pise una placa»)
    F = flores (decoración, se puede pisar)
  dir: hacia dónde mira Pini al empezar: 0 derecha, 1 abajo, 2 izquierda, 3 arriba.
  bloques: bloques de la caja (avanzar, girar, romper, colocar, repetir, si, sisino, hasta).
  eventos: eventos que se pueden usar (placa, estrella, agua, lava, arbol).
  conds: condiciones de los bloques Si (camino, agua, lava, arbol, roca).
  madera: troncos que hay que conseguir (si se pide).
  fijo: programa principal que ya viene puesto y no se puede tocar (pantallas de eventos).
  reto: número de bloques de la solución corta (para las 3 estrellas). Los bloques fijos no cuentan;
        cada evento («Cuando…») cuenta como un bloque.
  fondo: paisaje o monumento que se dibuja detrás (js/pinicraft.js, FONDOS).
*/
window.PINICRAFT = [
  {
    id: "pc1",
    nombre: "PiniCraft Aventurero",
    resumen: "Pini explora bosques, canales, montañas y volcanes de Europa: rompe, coloca y usa bucles y condicionales.",
    indicador: "3.2.5",
    niveles: [
      {
        lugar: "Selva de Irati", pais: "España", fondo: "irati", suelo: "hierba",
        dato: "La Selva de Irati, en Navarra, es uno de los hayedos y abetales más grandes de Europa.",
        objetivo: "Recoge las 3 piñas y llega al portal. Usa Avanzar y Girar.",
        mapa: ["TTTTT", "PNN.T", "TTTNT", "TTTGT"], dir: 0,
        bloques: ["avanzar", "girar"], reto: 6
      },
      {
        lugar: "Selva Negra", pais: "Alemania", fondo: "selvanegra", suelo: "hierba",
        dato: "La Selva Negra es famosa por sus bosques oscuros de abetos y por sus relojes de cuco.",
        objetivo: "Consigue 3 troncos de madera: ponte delante de un árbol y usa Romper.",
        mapa: ["TTTTTTT", "P.T.T.T", "TTTTTTT"], dir: 0, madera: 3,
        bloques: ["avanzar", "girar", "romper"], reto: 8
      },
      {
        lugar: "Kinderdijk", pais: "Países Bajos", fondo: "kinderdijk", suelo: "prado",
        dato: "En Kinderdijk hay 19 molinos de viento que durante siglos sacaron el agua de los campos.",
        objetivo: "Cruza los canales: ponte delante del agua y usa Colocar para hacer un puente.",
        mapa: ["FXFXFXF", "P.A.A.G", "FXFXFXF"], dir: 0,
        bloques: ["avanzar", "girar", "romper", "colocar"], reto: 8
      },
      {
        lugar: "Cervino", pais: "Suiza", fondo: "alpes", suelo: "nieve",
        dato: "El Cervino (Matterhorn) mide 4.478 metros y tiene forma de pirámide.",
        objetivo: "Sube por la escalera de roca recogiendo las piñas. Busca los 4 bloques que se repiten y usa Repetir.",
        mapa: ["RRRRRG", "RRRR.N", "RRR.NR", "RR.NRR", "R.NRRR", "P.RRRR"], dir: 0,
        bloques: ["avanzar", "girar", "romper", "colocar", "repetir"], reto: 5
      },
      {
        lugar: "Geirangerfjord", pais: "Noruega", fondo: "fiordo", suelo: "hierba",
        dato: "Los fiordos son valles excavados por glaciares que después se llenaron de agua del mar.",
        objetivo: "Cruza el fiordo con un puente largo. ¿Qué dos bloques se repiten?",
        mapa: ["RRRRRRRR", "P.AAAAAG", "AAAAAAAA"], dir: 0,
        bloques: ["avanzar", "girar", "romper", "colocar", "repetir"], reto: 5
      },
      {
        lugar: "Toscana", pais: "Italia", fondo: "toscana", suelo: "hierba",
        dato: "En la Toscana están los cipreses, los viñedos y la famosa torre inclinada de Pisa.",
        objetivo: "Levanta la muralla de la villa: coloca un bloque en cada cimiento de tu izquierda y llega al portal.",
        mapa: ["TTTTTT", "TCCCCT", "P....G", "TTTTTT"], dir: 0,
        bloques: ["avanzar", "girar", "romper", "colocar", "repetir"], reto: 6
      },
      {
        lugar: "Lago Ness", pais: "Reino Unido (Escocia)", fondo: "highlands", suelo: "hierba",
        dato: "El lago Ness, en las Tierras Altas de Escocia, es profundo y alargado. ¡Dicen que vive un monstruo!",
        objetivo: "Da la vuelta al lago recogiendo todas las piñas. Prueba un Repetir dentro de otro Repetir.",
        mapa: ["P.N.N", "NAAA.", ".AAAN", "NAAA.", ".N.N."], dir: 0,
        bloques: ["avanzar", "girar", "romper", "colocar", "repetir"], reto: 4
      },
      {
        lugar: "Volcán Hekla", pais: "Islandia", fondo: "islandia", suelo: "roca",
        dato: "Islandia tiene más de 30 volcanes activos. El Hekla es uno de los que más veces ha entrado en erupción.",
        objetivo: "¡Ríos de lava! Usa Si hay lava delante → Colocar, dentro de un Repetir.",
        mapa: ["RRRRRRRRR", "P.L.LL.LG", "LLLLLLLLL"], dir: 0,
        bloques: ["avanzar", "girar", "romper", "colocar", "repetir", "si"], conds: ["lava", "camino", "agua", "arbol"], reto: 4
      },
      {
        lugar: "Laponia", pais: "Finlandia", fondo: "laponia", suelo: "nieve",
        dato: "En Laponia, en invierno, se ven auroras boreales: luces de colores que bailan en el cielo.",
        objetivo: "Camino en espiral: si hay camino delante, avanza; si no, gira a la derecha. Repite hasta llegar.",
        mapa: ["P....", "TTTT.", ".NGT.", ".TTT.", "....."], dir: 0,
        bloques: ["avanzar", "girar", "romper", "colocar", "sisino", "hasta"], conds: ["camino", "arbol", "agua", "lava"], reto: 4
      },
      {
        lugar: "Acueducto de Segovia", pais: "España", fondo: "segovia", suelo: "arena",
        dato: "El acueducto de Segovia lo construyeron los romanos hace casi 2.000 años sin usar cemento.",
        objetivo: "Reto final: vuelve a Castilla. Rompe los árboles, haz puentes, recoge las piñas y repite hasta llegar.",
        mapa: ["XXXXXXXXXXX", "P.TNA.TANAG", "XXXXXXXXXXX"], dir: 0,
        bloques: ["avanzar", "girar", "romper", "colocar", "repetir", "si", "sisino", "hasta"], conds: ["arbol", "agua", "camino", "lava"], reto: 6
      }
    ]
  },
  {
    id: "pc2",
    nombre: "PiniCraft: El viaje del héroe",
    resumen: "Las 12 estrellas de la bandera europea se han perdido. Pini las recupera programando eventos: «Cuando pise una placa», «Cuando haya agua delante»…",
    indicador: "3.2.4",
    niveles: [
      {
        lugar: "Atomium", pais: "Bélgica", fondo: "bruselas", suelo: "adoquin",
        dato: "El Atomium de Bruselas representa un cristal de hierro aumentado 165.000 millones de veces.",
        objetivo: "Empieza el viaje: recoge la primera estrella de la bandera europea.",
        mapa: ["XXXXX", "P..XX", "XX.XX", "XX..E"], dir: 0,
        bloques: ["avanzar", "girar"], reto: 8
      },
      {
        lugar: "Luxemburgo", pais: "Luxemburgo", fondo: "luxemburgo", suelo: "adoquin",
        dato: "Luxemburgo fue uno de los seis países que fundaron lo que hoy es la Unión Europea.",
        objetivo: "Dos estrellas en la muralla. Hazlo con un Repetir.",
        mapa: ["XXXXXX", "P.E..E", "XXXXXX"], dir: 0,
        bloques: ["avanzar", "girar", "repetir"], reto: 2
      },
      {
        lugar: "Torre Eiffel", pais: "Francia", fondo: "paris", suelo: "adoquin",
        dato: "La Torre Eiffel se construyó en 1889 y tiene más de 18.000 piezas de hierro.",
        objetivo: "Nuevo: los EVENTOS. El programa principal ya está puesto. Añade «Cuando pise una placa» y dile a Pini que gire.",
        mapa: ["P...Q", "XXXX.", "XXXX.", "G.E.Q"], dir: 0,
        bloques: ["girar"], eventos: ["placa"], fijo: "hasta-avanzar", reto: 2
      },
      {
        lugar: "Venecia", pais: "Italia", fondo: "venecia", suelo: "adoquin",
        dato: "Venecia está construida sobre 118 islas unidas por más de 400 puentes.",
        objetivo: "Cada vez que haya agua delante, Pini tiene que hacer un puente. Programa el evento.",
        mapa: ["AAAAAAAA", "P.A.EA.G", "AAAAAAAA"], dir: 0,
        bloques: ["girar", "romper", "colocar"], eventos: ["agua", "placa"], fijo: "hasta-avanzar", reto: 2
      },
      {
        lugar: "Bosque de Viena", pais: "Austria", fondo: "viena", suelo: "hierba",
        dato: "En Viena vivieron Mozart y Beethoven. Su noria gigante del Prater tiene más de 100 años.",
        objetivo: "Dos eventos a la vez: gira en las placas y rompe los árboles que te cortan el paso.",
        mapa: ["TTGEQT", "TTTTTT", "TTTT.T", "P.T.QT", "TTTTTT"], dir: 0,
        bloques: ["girar", "romper", "colocar"], eventos: ["placa", "arbol", "agua"], fijo: "hasta-avanzar", reto: 4
      },
      {
        lugar: "Partenón", pais: "Grecia", fondo: "atenas", suelo: "arena",
        dato: "El Partenón de Atenas es un templo de hace 2.400 años dedicado a la diosa Atenea.",
        objetivo: "Ahora escribes tú el programa principal: Repetir hasta llegar → Avanzar, y el evento de las placas.",
        mapa: ["P...Q", "GXXX.", ".XXX.", "Q.E.Q"], dir: 0,
        bloques: ["avanzar", "girar", "repetir", "hasta"], eventos: ["placa", "estrella"], reto: 4
      },
      {
        lugar: "Puente de Carlos", pais: "Chequia", fondo: "praga", suelo: "adoquin",
        dato: "El Puente de Carlos de Praga cruza el río Moldava y tiene 30 estatuas.",
        objetivo: "Placas y agua: dos eventos y un programa principal muy corto.",
        mapa: ["P.A.Q", "XXXX.", "XXXXA", "XXXX.", "GEA.Q"], dir: 0,
        bloques: ["avanzar", "girar", "colocar", "romper", "repetir", "hasta"], eventos: ["placa", "agua", "arbol"], reto: 6
      },
      {
        lugar: "Etna", pais: "Italia (Sicilia)", fondo: "etna", suelo: "roca",
        dato: "El Etna, en Sicilia, es el volcán activo más alto de Europa: mide unos 3.300 metros.",
        objetivo: "Cuando recojas la estrella, gira; cuando haya lava delante, enfríala con Colocar.",
        mapa: ["RRRRG", "RRRR.", "RRRRL", "P.L.E"], dir: 0,
        bloques: ["avanzar", "girar", "colocar", "romper", "repetir", "hasta"], eventos: ["estrella", "lava", "placa"], reto: 6
      },
      {
        lugar: "Nyhavn", pais: "Dinamarca", fondo: "copenhague", suelo: "adoquin",
        dato: "Nyhavn es el puerto de Copenhague con casas de colores. Allí vivió Hans Christian Andersen.",
        objetivo: "Al coger una estrella, si no hay camino delante, Pini da media vuelta. Usa un Si dentro del evento.",
        mapa: ["XXXXXX", "GEP..E", "XXXXXX"], dir: 0,
        bloques: ["avanzar", "girar", "repetir", "sisino", "hasta"], eventos: ["estrella", "placa"], conds: ["camino", "agua", "arbol"], reto: 6
      },
      {
        lugar: "Parlamento Europeo", pais: "Francia (Estrasburgo)", fondo: "estrasburgo", suelo: "adoquin",
        dato: "En Estrasburgo se reúne el Parlamento Europeo, donde se sientan representantes de todos los países de la UE.",
        objetivo: "¡La última estrella! Usa todos los eventos que necesites: placas, agua y árboles.",
        mapa: ["P.T.A.Q", "XXXXXX.", "XXXXXXA", "GE.T..Q"], dir: 0,
        bloques: ["avanzar", "girar", "colocar", "romper", "repetir", "si", "hasta"], eventos: ["placa", "agua", "arbol", "lava", "estrella"], conds: ["camino", "agua", "arbol"], reto: 8
      }
    ]
  }
];
