/*
  CONSULTA DE LAS FAMILIAS (#familias)
  La familia escribe su correo (el que el profe tiene en la pestaña Alumnado), recibe un código de 6 cifras
  por correo y, con él, ve solo los resultados de su hijo o hija. Todo lo comprueba el script de la hoja.
*/
window.Familias = (function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let raiz = null, correo = "", hijos = null, cab = [];

  async function llamar(cuerpo) {
    const R = window.REGISTRO || {};
    if (!R.url) return { ok: false, error: "La web no está conectada a la hoja del colegio." };
    try {
      const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(cuerpo) });
      const t = await r.text();
      try { return JSON.parse(t); } catch (e) { return { ok: false, error: "El servicio del colegio no está disponible ahora mismo." }; }
    } catch (e) { return { ok: false, error: "No se ha podido conectar. Revisa tu conexión a internet." }; }
  }

  function cabecera(sub) {
    return `<header class="rincon-cab" style="--rc:#2f6f8f"><div class="envoltura">
      <a class="volver-r" href="#">← Rincones</a>
      <div class="rincon-tit"><span class="rincon-ico" aria-hidden="true">👨‍👩‍👧</span><div><h1>Familias</h1><p>${sub}</p></div></div>
    </div></header>`;
  }

  function pintarAcceso(paso, aviso, tipo) {
    raiz.innerHTML = cabecera("Consulta los resultados de tu hijo o hija en Rumbo a Europa.") +
      `<div class="envoltura seccion">
        <form class="alumno" id="f-correo" autocomplete="on">
          <label for="f-email">Correo electrónico de la familia<input id="f-email" type="email" maxlength="120" value="${esc(correo)}" placeholder="El que diste en el colegio" autocomplete="email"></label>
          <button class="btn${paso === 2 ? " sec" : ""}" type="submit">${paso === 2 ? "Enviar otro código" : "Enviarme el código"}</button>
        </form>
        ${paso === 2 ? `<form class="alumno" id="f-cod" autocomplete="off" style="margin-top:16px">
          <label for="f-codigo">Código de 6 cifras<input id="f-codigo" inputmode="numeric" maxlength="6" placeholder="123456" autocomplete="one-time-code"></label>
          <button class="btn" type="submit">Ver resultados</button>
        </form>` : ""}
        <p class="estado" id="f-estado" data-tipo="${tipo || ""}" style="margin-top:12px">${esc(aviso || "")}</p>
        <p class="intro" style="margin-top:16px">Te mandaremos un código a tu correo. Solo verás los resultados del alumnado que el colegio tiene asociado a ese correo. El código caduca a los 15 minutos.</p>
      </div>`;
    $("#f-correo").addEventListener("submit", async (e) => {
      e.preventDefault();
      correo = $("#f-email").value.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) { pintarAcceso(paso, "Escribe un correo válido.", "error"); return; }
      const est = $("#f-estado"); est.textContent = "Enviando…"; est.dataset.tipo = "";
      const j = await llamar({ accion: "familiaCodigo", correo });
      if (!j.ok) { pintarAcceso(paso, j.error, "error"); return; }
      pintarAcceso(2, j.mensaje + " Mira también la carpeta de correo no deseado.", "ok");
      const c = $("#f-codigo"); if (c) c.focus();
    });
    const fc = $("#f-cod");
    if (fc) fc.addEventListener("submit", async (e) => {
      e.preventDefault();
      const codigo = $("#f-codigo").value.trim(), est = $("#f-estado");
      if (!/^\d{6}$/.test(codigo)) { est.textContent = "El código tiene 6 cifras."; est.dataset.tipo = "error"; return; }
      est.textContent = "Comprobando…"; est.dataset.tipo = "";
      const j = await llamar({ accion: "familiaDatos", correo, codigo });
      if (!j.ok) { est.textContent = j.error; est.dataset.tipo = "error"; return; }
      hijos = j.hijos || []; cab = j.cab || [];
      pintarResultados();
    });
  }

  function pintarResultados() {
    const P = window.Profe;
    if (!hijos.length) { raiz.innerHTML = cabecera("No hay alumnado asociado a este correo.") + `<div class="envoltura seccion"><p class="intro">Habla con el tutor o la tutora para que registre tu correo.</p></div>`; return; }
    raiz.innerHTML = cabecera("Resultados de Rumbo a Europa. Notas de 0 a 5 en cada indicador de logro.") +
      `<div class="envoltura seccion">
        <p class="p-barra"><button type="button" class="btn sec" id="f-salir">Salir</button></p>
        ${hijos.map((h) => {
          const c = /6/.test(h.clase || "") ? "6º" : "5º";
          const a = { notas: P.notasDe(cab, h.fila), terminados: {} };
          (h.hechos || []).forEach(([destino, programa, fecha]) => { a.terminados[String(destino)] = { ruta: String(programa || "").replace(/^Terminado ·\s*/, ""), fecha }; });
          const res = P.resumen(a, c), cat = P.catalogo(c);
          const medias = P.mediasInd([a], c);
          return `<section class="f-hijo">
            <h2 class="sa-tit">${esc(`${h.nombre || ""} ${h.apellidos || ""}`.trim())} · ${esc(window.normGrupo ? window.normGrupo(h.clase) : h.clase)}</h2>
            <div class="p-resumen">${P.RINC.map((r) => `<div style="--rc:${r.color}"><b>${r.nombre}</b><span>${res[r.id].media === null ? "–" : res[r.id].media}</span><small>${res[r.id].hechas} de ${res[r.id].total} indicadores con nota${r.id === "crea" ? ` · ✓ ${res.crea.retos}/${res.crea.nRetos} retos terminados` : ""}</small></div>`).join("")}</div>
            ${P.RINC.map((r) => {
              const acts = cat.filter((x) => x.rincon === r.id && x.inds.length);
              return `<details class="p-rincon"><summary style="color:${r.color}">${r.nombre}</summary>
                <div class="tabla-scroll"><table class="p-tabla"><thead><tr><th>Actividad</th><th>Indicadores (nota 0-5)</th></tr></thead><tbody>
                ${acts.map((x) => {
                  const t = r.id === "crea" ? a.terminados[x.destino.slice(0, 60)] : null;
                  return `<tr><td><b>${esc(x.titulo)}</b>${r.id === "crea" ? `<small>${t ? "✓ Terminado" : "Sin terminar"}</small>` : ""}</td>
                    <td>${x.inds.map((cod) => { const v = a.notas[P.columna(x.destino, cod)]; return `<span class="f-ind" title="${esc(P.textoInd(c, cod))}"><span class="cod-p">${cod}</span> <b>${v === undefined ? "–" : v}</b></span>`; }).join(" ")}</td></tr>`;
                }).join("")}</tbody></table></div></details>`;
            }).join("")}
            <h3 class="sa-tit" style="font-size:22px">Media de cada indicador de logro</h3>
            ${medias.length ? `<div class="tabla-scroll"><table class="p-tabla p-medias"><thead><tr><th>Ind.</th><th>Indicador de logro</th><th>Media</th></tr></thead><tbody>
              ${medias.map((m) => `<tr><td><span class="cod-p">${m.cod}</span></td><td>${esc(P.textoInd(c, m.cod))}</td><td><b>${m.media}</b></td></tr>`).join("")}</tbody></table></div>` : `<p class="intro">Todavía no hay notas.</p>`}
          </section>`;
        }).join("")}
        <p class="intro">Escala: 0 no hecho · 1 lo ha intentado · 2 ha conseguido una parte · 3 conseguido con ayuda · 4 casi del todo · 5 perfectamente.</p>
      </div>`;
    $("#f-salir").onclick = () => { hijos = null; cab = []; pintarAcceso(1); };
  }

  function pintar(r) {
    raiz = r;
    if (hijos) pintarResultados(); else pintarAcceso(1);
  }
  return { pintar };
})();
