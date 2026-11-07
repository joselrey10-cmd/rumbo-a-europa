/*
  FICHA EN WORD (.docx) para el Crea adaptado
  Crea en el navegador un documento de Word con la ficha del país y las preguntas, con letra grande y una
  línea para escribir cada respuesta. No necesita ninguna librería: el .docx es un zip con tres archivos XML.
  Uso: window.FichaDocx({ titulo, nombre, clase, pasos: [..], ficha, preguntas: [..], archivo })
*/
window.FichaDocx = (function () {
  "use strict";
  const x = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Párrafo: tamaño en medios puntos (40 = 20 pt).
  function p(texto, o) {
    o = o || {};
    const rpr = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${o.b ? "<w:b/>" : ""}${o.color ? `<w:color w:val="${o.color}"/>` : ""}<w:sz w:val="${o.sz || 36}"/><w:szCs w:val="${o.sz || 36}"/></w:rPr>`;
    const ppr = `<w:pPr><w:spacing w:before="${o.antes || 0}" w:after="${o.despues == null ? 160 : o.despues}" w:line="360" w:lineRule="auto"/>${o.centro ? '<w:jc w:val="center"/>' : ""}${o.caja ? '<w:pBdr><w:top w:val="single" w:sz="12" w:space="8" w:color="14225A"/><w:left w:val="single" w:sz="12" w:space="8" w:color="14225A"/><w:bottom w:val="single" w:sz="12" w:space="8" w:color="14225A"/><w:right w:val="single" w:sz="12" w:space="8" w:color="14225A"/></w:pBdr><w:shd w:val="clear" w:color="auto" w:fill="EEF2F0"/>' : ""}${o.linea ? '<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="555555"/></w:pBdr>' : ""}</w:pPr>`;
    return `<w:p>${ppr}<w:r>${rpr}<w:t xml:space="preserve">${x(texto)}</w:t></w:r></w:p>`;
  }
  function documento(d) {
    const cuerpo = [
      p(d.titulo, { sz: 56, b: true, color: "14225A", centro: true, despues: 240 }),
      p(`Nombre: ${d.nombre || "______________________"}     ${d.clase || ""}`, { sz: 32, despues: 320 }),
      ...(d.pasos || []).map((t, i) => p(`${i + 1}. ${t}`, { sz: 32, despues: 80 })),
      p("Lee la ficha:", { sz: 36, b: true, antes: 240 }),
      p(d.ficha, { sz: 44, caja: true, despues: 360 }),
      p("Responde con una o dos palabras:", { sz: 36, b: true, antes: 240 }),
      ...[].concat(...(d.preguntas || []).map((q, i) => [p(`${i + 1}. ${q}`, { sz: 40, b: true, antes: 240, despues: 120 }), p(" ", { sz: 44, linea: true, despues: 240 })]))
    ].join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${cuerpo}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  }
  const TIPOS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
  const RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';

  /* Zip sin comprimir (método 0) */
  const TABLA = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = TABLA[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zip(archivos) {
    const enc = new TextEncoder(), partes = [], central = [];
    let pos = 0;
    archivos.forEach(([nombre, texto]) => {
      const n = enc.encode(nombre), d = enc.encode(texto), crc = crc32(d);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true);
      h.setUint16(26, n.length, true); h.setUint16(28, 0, true);
      partes.push(new Uint8Array(h.buffer), n, d);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, d.length, true); c.setUint32(24, d.length, true);
      c.setUint16(28, n.length, true); c.setUint32(42, pos, true);
      central.push(new Uint8Array(c.buffer), n);
      pos += 30 + n.length + d.length;
    });
    const tam = central.reduce((s, b) => s + b.length, 0), f = new DataView(new ArrayBuffer(22));
    f.setUint32(0, 0x06054b50, true); f.setUint16(8, archivos.length, true); f.setUint16(10, archivos.length, true); f.setUint32(12, tam, true); f.setUint32(16, pos, true);
    return new Blob([...partes, ...central, new Uint8Array(f.buffer)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }
  return function (d) {
    const blob = zip([["[Content_Types].xml", TIPOS], ["_rels/.rels", RELS], ["word/document.xml", documento(d)]]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = (d.archivo || "ficha") + ".docx";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return blob;
  };
})();
