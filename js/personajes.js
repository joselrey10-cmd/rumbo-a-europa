/*
  PERSONAJES DEL COLEGIO
  ----------------------
  Edita esta lista para añadir o cambiar personajes.
  - nombre / rol: lo que se ve en la tarjeta.
  - foto: imagen del personaje (mejor PNG con fondo transparente) dentro de la carpeta img/.
  - desbloquea: número de destinos completados que hacen falta para poder elegirlo (0 = desde el principio).
  - espalda: cómo se dibuja de espaldas (cuando camina hacia arriba).
             gorro: "rayas" o "paja"; ropa: "rayas" o "peto". Sin espalda, se dibuja la ardilla sin ropa.
*/
window.COLEGIO = {
  nombre: "CEIP Tierra de Pinares",
  lema: "Rumbo a Europa",
  logo: "img/escudo.png"
};

window.PERSONAJES = [
  { id: "pini", nombre: "Pini", rol: "La mascota del cole", foto: "img/pini.png", desbloquea: 0 },
  { id: "pini-rayas", nombre: "Pini con gafas", rol: "Listo para buscar sellos", foto: "img/pini-rayas.png", desbloquea: 2, espalda: { gorro: "rayas", ropa: "rayas" } },
  { id: "pini-balon", nombre: "Pini futbolista", rol: "No se separa del balón", foto: "img/pini-balon.png", desbloquea: 4 },
  { id: "pini-granjero", nombre: "Pini granjero", rol: "Trae el sombrero de paja", foto: "img/pini-granjero.png", desbloquea: 6, espalda: { gorro: "paja", ropa: "peto" } }
];

/*
  REGISTRO DE RESULTADOS (opcional)
  ---------------------------------
  Pega aquí la dirección de la aplicación web de Google Apps Script
  (mira el archivo LEEME.md, apartado "Registrar los resultados").
  Si la dejas vacía, el juego funciona igual pero no envía nada.
*/
window.REGISTRO = {
  url: "https://script.google.com/macros/s/AKfycbxCAmFy7vJKB5v-OCuqzMPWxjuqmBF8_hySZNj92eVwVmAFtKz5OmoIgrBeQpYmpl-lzg/exec"
};
