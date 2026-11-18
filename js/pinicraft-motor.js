/*
  PINICRAFT · MOTOR DEL JUEGO (sin dibujos)
  Ejecuta un programa sobre una pantalla de js/pinicraft-niveles.js y devuelve todos los pasos
  para que js/pinicraft.js los anime. Así la lógica se puede probar sin navegador.

  Programa: { main: [bloques], eventos: { placa: [...], estrella: [...], agua: [...], lava: [...], arbol: [...] } }
  Bloque: { t: "avanzar" | "girar" | "romper" | "colocar" | "repetir" | "si" | "sisino" | "hasta", id, d: "izq"|"der",
            n (veces), c (condición), cuerpo: [...], sino: [...] }
*/
(function (raiz) {
  "use strict";
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const PISABLE = ".PGC=KNEQF";
  const MAX_PASOS = 400;

  function estadoInicial(nivel) {
    const mapa = nivel.mapa.map((f) => f.split(""));
    let x = 0, y = 0;
    mapa.forEach((f, j) => { const i = f.indexOf("P"); if (i >= 0) { x = i; y = j; } });
    const cuenta = (ch) => nivel.mapa.join("").split(ch).length - 1;
    return {
      mapa, x, y, dir: nivel.dir || 0, madera: 0, piedra: 0,
      pinas: 0, totalPinas: cuenta("N"), estrellas: 0, totalEstrellas: cuenta("E"),
      cimientos: cuenta("C"), meta: nivel.mapa.join("").indexOf("G") >= 0, maderaPedida: nivel.madera || 0
    };
  }
  const celda = (s, x, y) => (y < 0 || y >= s.mapa.length || x < 0 || x >= s.mapa[0].length ? null : s.mapa[y][x]);
  const delante = (s) => { const [dx, dy] = DIRS[s.dir]; return { x: s.x + dx, y: s.y + dy, c: celda(s, s.x + dx, s.y + dy) }; };
  function cumple(s, cond) {
    const d = delante(s);
    if (cond === "camino") return d.c !== null && PISABLE.indexOf(d.c) >= 0;
    if (cond === "agua") return d.c === "A";
    if (cond === "lava") return d.c === "L";
    if (cond === "arbol") return d.c === "T";
    if (cond === "roca") return d.c === "R";
    return false;
  }
  function objetivosCumplidos(s) {
    return s.pinas >= s.totalPinas && s.estrellas >= s.totalEstrellas && s.cimientos === 0 && s.madera >= s.maderaPedida &&
      (!s.meta || s.mapa[s.y][s.x] === "G");
  }
  // Lo que falta, para explicarlo al alumno si el programa termina sin conseguirlo.
  function falta(s) {
    const L = [];
    if (s.pinas < s.totalPinas) L.push(`te faltan ${s.totalPinas - s.pinas} piña${s.totalPinas - s.pinas === 1 ? "" : "s"}`);
    if (s.estrellas < s.totalEstrellas) L.push(`te falta${s.totalEstrellas - s.estrellas === 1 ? "" : "n"} ${s.totalEstrellas - s.estrellas} estrella${s.totalEstrellas - s.estrellas === 1 ? "" : "s"}`);
    if (s.cimientos > 0) L.push(`quedan ${s.cimientos} cimiento${s.cimientos === 1 ? "" : "s"} sin muro`);
    if (s.madera < s.maderaPedida) L.push(`tienes ${s.madera} de ${s.maderaPedida} troncos`);
    if (s.meta && s.mapa[s.y][s.x] !== "G") L.push("no has llegado al portal");
    return L;
  }

  class Fin { constructor(ok, motivo) { this.ok = ok; this.motivo = motivo; } }

  function simular(nivel, prog) {
    const s = estadoInicial(nivel), pasos = [];
    const ev = (prog && prog.eventos) || {};
    let n = 0;
    const foto = (accion, id, extra) => pasos.push(Object.assign({ accion, id, x: s.x, y: s.y, dir: s.dir, madera: s.madera, piedra: s.piedra, pinas: s.pinas, estrellas: s.estrellas }, extra || {}));
    const contar = () => { if (++n > MAX_PASOS) throw new Fin(false, "Pini se ha cansado: el programa no termina nunca. Revisa los bucles."); };
    const comprobar = () => { if (objetivosCumplidos(s)) throw new Fin(true, ""); };

    // Eventos: se miran al empezar y después de cada paso del programa principal (no dentro de otro evento).
    function lanzarEventos(llegada) {
      if (llegada && llegada.placa && ev.placa && ev.placa.length) { foto("evento", null, { evento: "placa" }); correr(ev.placa, true); }
      if (llegada && llegada.estrella && ev.estrella && ev.estrella.length) { foto("evento", null, { evento: "estrella" }); correr(ev.estrella, true); }
      const d = delante(s);
      const tipo = d.c === "A" ? "agua" : d.c === "L" ? "lava" : d.c === "T" ? "arbol" : null;
      if (tipo && ev[tipo] && ev[tipo].length) { foto("evento", null, { evento: tipo }); correr(ev[tipo], true); }
    }

    function accion(b, enEvento) {
      contar();
      if (b.t === "avanzar") {
        const d = delante(s);
        if (d.c === null) { foto("choque", b.id); throw new Fin(false, "¡Pini se sale del mapa!"); }
        if (d.c === "A") { s.x = d.x; s.y = d.y; foto("agua", b.id); throw new Fin(false, "¡Plaf! Pini se ha caído al agua. Usa Colocar para hacer un puente."); }
        if (d.c === "L") { s.x = d.x; s.y = d.y; foto("lava", b.id); throw new Fin(false, "¡Cuidado! Eso es lava. Usa Colocar para enfriarla antes de pasar."); }
        if (PISABLE.indexOf(d.c) < 0) { foto("choque", b.id); throw new Fin(false, d.c === "T" ? "Hay un árbol delante. Usa Romper o busca otro camino." : d.c === "R" ? "Hay una roca delante. Usa Romper o busca otro camino." : "Pini se ha chocado: por ahí no se puede pasar."); }
        s.x = d.x; s.y = d.y;
        const llegada = {};
        if (d.c === "N") { s.pinas++; s.mapa[d.y][d.x] = "."; llegada.recoge = "N"; }
        if (d.c === "E") { s.estrellas++; s.mapa[d.y][d.x] = "."; llegada.recoge = "E"; llegada.estrella = true; }
        if (d.c === "Q") llegada.placa = true;
        foto("avanzar", b.id, { recoge: llegada.recoge || null, xy: [d.x, d.y] });
        comprobar();
        if (!enEvento) { lanzarEventos(llegada); comprobar(); }
      } else if (b.t === "girar") {
        s.dir = (s.dir + (b.d === "izq" ? 3 : 1)) % 4;
        foto("girar", b.id);
      } else if (b.t === "romper") {
        const d = delante(s);
        if (d.c === "T" || d.c === "R") {
          if (d.c === "T") s.madera++; else s.piedra++;
          s.mapa[d.y][d.x] = ".";
          foto("romper", b.id, { cambio: [d.x, d.y, d.c, "."] });
          comprobar();
        } else foto("nada", b.id, { aviso: "No hay nada que romper delante." });
      } else if (b.t === "colocar") {
        const d = delante(s);
        if (d.c === "A" || d.c === "L") { const nuevo = d.c === "A" ? "=" : "K"; s.mapa[d.y][d.x] = nuevo; foto("colocar", b.id, { cambio: [d.x, d.y, d.c, nuevo] }); }
        else if (d.c === "C") { s.mapa[d.y][d.x] = "M"; s.cimientos--; foto("colocar", b.id, { cambio: [d.x, d.y, "C", "M"] }); comprobar(); }
        else foto("nada", b.id, { aviso: "Aquí no hace falta colocar nada." });
      }
    }

    function correr(lista, enEvento) {
      for (const b of lista || []) {
        if (b.t === "repetir") {
          for (let i = 0; i < (b.n || 0); i++) { contar(); foto("bucle", b.id); correr(b.cuerpo, enEvento); }
        } else if (b.t === "hasta") {
          while (!(s.meta ? s.mapa[s.y][s.x] === "G" : objetivosCumplidos(s))) { contar(); foto("bucle", b.id); correr(b.cuerpo, enEvento); }
        } else if (b.t === "si" || b.t === "sisino") {
          contar();
          const ok = cumple(s, b.c);
          foto("si", b.id, { cumple: ok });
          if (ok) correr(b.cuerpo, enEvento); else if (b.t === "sisino") correr(b.sino, enEvento);
        } else accion(b, enEvento);
      }
    }

    let ok = false, motivo = "";
    try {
      foto("inicio", null);
      lanzarEventos(null);
      comprobar();
      correr(prog.main || [], false);
      comprobar();
      const f = falta(s);
      motivo = f.length ? "El programa ha terminado, pero " + f.join(", ") + "." : "";
    } catch (e) {
      if (!(e instanceof Fin)) throw e;
      ok = e.ok; motivo = e.motivo;
    }
    return { ok, motivo, pasos, final: s, parcial: s.pinas + s.estrellas + s.madera > 0 || s.x !== estadoInicial(nivel).x || s.y !== estadoInicial(nivel).y };
  }

  // Bloques que cuentan para el reto (los fijos no cuentan; cada evento usado cuenta 1).
  function contarBloques(prog) {
    const c = (l) => (l || []).reduce((t, b) => t + (b.fijo ? 0 : 1) + c(b.cuerpo) + c(b.sino), 0);
    return c(prog.main) + Object.keys(prog.eventos || {}).reduce((t, k) => t + (prog.eventos[k] && prog.eventos[k].length ? 1 + c(prog.eventos[k]) : 0), 0);
  }

  raiz.PiniCraftMotor = { simular, contarBloques, estadoInicial, PISABLE };
  if (typeof module !== "undefined") module.exports = raiz.PiniCraftMotor;
})(typeof window !== "undefined" ? window : globalThis);
