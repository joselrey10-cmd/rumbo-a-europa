/*
  DESPLEGABLE DE NOMBRES DEL ALUMNADO
  Al elegir el grupo, el campo del nombre pasa a ser un desplegable con la lista que el profe importó
  (pestaña Alumnado de la hoja). Así no hay alumnos repetidos ni nombres mal escritos.
  El usuario de Educacyl lo escribe el alumno a mano; la hoja comprueba que coincide con el de la lista.
  Si el grupo aún no tiene lista (o no hay conexión), se puede escribir el nombre como antes.
*/
window.ListaAlumnos = (function () {
  "use strict";
  const cache = {};
  const G = (t) => (window.normGrupo ? window.normGrupo(t) : String(t || "").trim());
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  async function llamar(cuerpo) {
    const R = window.REGISTRO || {};
    if (!R.url) return null;
    try {
      const r = await fetch(R.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(cuerpo) });
      return JSON.parse(await r.text());
    } catch (e) { return null; }
  }
  function nombres(clase) {
    clase = G(clase);
    if (!/^P[56][AB]$/.test(clase)) return Promise.resolve([]);
    if (!cache[clase]) {
      let guardado = null;
      try { guardado = JSON.parse(sessionStorage.getItem("rumbo-lista-" + clase) || "null"); } catch (e) {}
      cache[clase] = guardado ? Promise.resolve(guardado) : llamar({ accion: "nombresGrupo", clase }).then((j) => {
        const l = j && j.ok ? j.nombres || [] : null;
        if (l === null) { delete cache[clase]; return []; }
        try { sessionStorage.setItem("rumbo-lista-" + clase, JSON.stringify(l)); } catch (e) {}
        return l;
      });
    }
    return cache[clase];
  }

  /* input: el campo de texto del nombre (se queda escondido y sigue siendo el que leen las pantallas).
     clase: el <select> del grupo. usuario: el campo del usuario (para comprobarlo). */
  function montar(input, clase, usuario) {
    if (!input || !clase || input.dataset.lista) return;
    input.dataset.lista = "1";
    const sel = document.createElement("select");
    sel.className = "lista-nombres"; sel.hidden = true;
    sel.setAttribute("aria-label", "Tu nombre");
    input.insertAdjacentElement("afterend", sel);
    const aviso = document.createElement("small");
    aviso.className = "lista-aviso";
    (usuario || input).closest("label").appendChild(aviso);
    let lista = [];

    function sincronizar() {
      if (sel.hidden) return;
      const v = input.value.trim();
      sel.value = lista.indexOf(v) >= 0 ? v : "";
    }
    async function cargar() {
      if (!input.isConnected) return;
      const c = G(clase.value);
      if (!c) { sel.hidden = true; input.hidden = false; return; }
      lista = await nombres(c);
      if (G(clase.value) !== c) return;
      if (!lista.length) { sel.hidden = true; input.hidden = false; aviso.textContent = ""; return; }
      sel.innerHTML = `<option value="">Elige tu nombre</option>` + lista.map((n) => `<option>${esc(n)}</option>`).join("");
      sel.hidden = false; input.hidden = true;
      sincronizar();
      if (input.value.trim() && !sel.value) { input.value = ""; input.dispatchEvent(new Event("input", { bubbles: true })); }
      comprobar();
    }
    let t = null;
    function comprobar() {
      clearTimeout(t); aviso.textContent = ""; aviso.dataset.tipo = "";
      if (sel.hidden || !sel.value || !usuario || !usuario.value.trim()) return;
      t = setTimeout(async () => {
        const j = await llamar({ accion: "comprobarAlumno", clase: G(clase.value), nombre: sel.value, usuario: usuario.value.trim() });
        if (!j || !j.ok || !j.enLista) return;
        aviso.textContent = j.coincide ? "✓ Usuario correcto" : "Ese usuario no es el tuyo: revísalo (es el de Educacyl, por ejemplo nombre.apellido).";
        aviso.dataset.tipo = j.coincide ? "ok" : "error";
      }, 700);
    }
    sel.addEventListener("change", () => {
      input.value = sel.value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      comprobar();
    });
    clase.addEventListener("change", cargar);
    clase.addEventListener("input", cargar);
    if (usuario) usuario.addEventListener("input", comprobar);
    // Otras pantallas cambian el nombre por código: se vuelve a leer.
    ["alumno-cambiado", "alumno-cambiado-prog", "hashchange"].forEach((ev) => window.addEventListener(ev, () => setTimeout(cargar, 0)));
    cargar();
  }
  return { montar, nombres };
})();
