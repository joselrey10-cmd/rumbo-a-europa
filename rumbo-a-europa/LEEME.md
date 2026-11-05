# Rumbo a Europa · juego de programación por bloques

Web estática (HTML, CSS y JavaScript, sin instalar nada). Pini, la mascota del cole, viaja por Europa
y el alumnado le programa el camino con bloques. Hay tres aventuras, de más fácil a más difícil:
1. **Europa Occidental** (7 destinos): Avanzar, Girar, Saltar y Repetir.
2. **Europa del Norte** (5 destinos): bucles con giros y bucles dentro de bucles.
3. **Europa del Este** (5 destinos): bloques "Si…" y "Repetir hasta llegar".
Las tres aventuras están abiertas desde el principio; dentro de cada una, los destinos se desbloquean en orden.

El programa se monta arrastrando y encajando bloques, como en un puzle, debajo del bloque "Al empezar".
Pini camina de frente, de lado o de espaldas según hacia dónde vaya. El editor de bloques es Blockly
(Google, licencia Apache 2.0) y viene incluido en `js/vendor/`, así que no depende de ninguna web externa. Con menos bloques se consiguen más estrellas, y las versiones de Pini
(con gafas, futbolista y granjero) se desbloquean al completar destinos. El progreso se guarda en el navegador.

## Pantalla de Robótica
En el menú de arriba hay dos pantallas: **Programación · Rumbo a Europa** (el juego con Pini) y **Robótica**.
En Robótica se programa un robot sobre un mapa de Europa con todos los países, dividido en 6 × 6 casillas de 15 × 15 cm.
Hay tres niveles, con los mismos 6 retos (ir de un país a otro):
- **Robot:** Avanzar (una casilla), Girar a la derecha y Girar a la izquierda.
- **SPIKE Essential:** bloques de iconos (avanzar y retroceder en cm, girar en grados, repetir, esperar, luz y sonido).
- **SPIKE Prime:** todos los bloques de palabras de Movimiento: mover ↑/↓ durante (rotaciones, grados, segundos, cm o pulgadas),
  empezar a mover, mover y empezar a mover con volante (derecha: 30…), parar movimiento, fijar velocidad, fijar A+B como motores
  en movimiento y fijar 1 rotación del motor en 17,5 cm. Además: esperar, repetir, por siempre, escribir, luz y pitido.
  El coche tiene 4 ruedas: A y B detrás, C y D delante (E y F no tienen ruedas). Se simula con dos ruedas motrices,
  así que `mover derecha: 100 durante 180 grados` gira 90° sin avanzar, igual que la base motriz de verdad.
La casilla y los países por donde pasa el robot se ven arriba a la derecha.

**Tapete para imprimir:** `tapete-europa-90x90cm.svg` es el mismo mapa a tamaño real (90 × 90 cm, casillas de 15 cm).
Llévalo a una copistería o imprímelo en mosaico, y así el robot de verdad hace el mismo recorrido que en la web.
El mapa se ha hecho con datos de Natural Earth (dominio público).

LEGO® y SPIKE™ son marcas de LEGO Group. Esta web no está relacionada con LEGO: los bloques están dibujados de nuevo para practicar su forma de programar.

## Probarlo en el ordenador
Abre `index.html` con doble clic en el navegador.

## Publicarlo en Vercel
**Opción A, sin programar (arrastrar):**
1. Entra en https://vercel.com e inicia sesión (vale con una cuenta gratuita).
2. Pulsa **Add New… → Project** y elige subir la carpeta, o usa https://vercel.com/new y arrastra la carpeta `rumbo-a-europa`.
3. En "Framework Preset" deja **Other**. No hace falta comando de build. Pulsa **Deploy**.

**Opción B, con GitHub:** sube esta carpeta a un repositorio y en Vercel pulsa **Add New → Project → Import** ese repositorio. Cada cambio que subas se publica solo.

**Opción C, terminal:** dentro de la carpeta ejecuta `npx vercel` y luego `npx vercel --prod`.

## Personalizar
- **Nombre y logo del colegio:** `js/personajes.js` → `COLEGIO` (pon el logo en `img/` y escribe `logo: "img/logo.png"`).
- **Personajes:** `js/personajes.js` → `PERSONAJES`. Imagen PNG con fondo transparente en `img/`.
  `desbloquea` es el número de destinos completados que hacen falta.
- **Aventuras y destinos:** `js/niveles.js`. Cada mapa se dibuja con letras (la leyenda está al principio del archivo).
- **Colores y tipografía:** `css/estilo.css`.

## Indicadores de logro y valoración (0 a 5)
Cada destino de Programación y cada reto de Robótica está relacionado con un indicador de logro
de las programaciones de 5.º y 6.º (TIAC 2026-27). El número del indicador sale en la tarjeta del pasaporte,
en la pantalla de la actividad y en la ventana final.

- El curso se saca de la **clase** que escribe el alumno: si empieza por 6 (6ºA, 6B…) se usan los indicadores de 6.º; si no, los de 5.º.
- Textos y relaciones en `js/indicadores.js`: `INDICADORES` (número → texto), `INDICADOR_PROGRAMACION` (ciudad → indicador)
  e `INDICADOR_ROBOTICA` (indicador de cada uno de los 6 retos de cada nivel). Cambia ahí cualquier relación.
- Valoración automática: 0 no hecho · 1 intentado sin conseguir nada · 2 conseguida una parte ·
  3 conseguido con más de 4 intentos o un programa mucho más largo · 4 con 3 o 4 intentos o algo más largo ·
  5 realizado perfectamente (1 o 2 intentos y sin pasarse del reto de bloques). Se guarda siempre la mejor nota.
- **Excel:** botón "Descargar mi valoración (Excel)" en el pasaporte, en el menú de Robótica y en la ventana final.
  Genera `Valoracion_<clase>_<nombre>.xlsx` con tres hojas: Valoración (una fila por actividad), Por indicador (media y máxima) y Escala.
  Las notas se guardan en el navegador de cada alumno: descargad el Excel en el mismo ordenador en el que ha jugado.
- Si usáis la Hoja de Google, además se crea la pestaña **Valoraciones**: una fila por alumno y una columna por actividad e indicador,
  con toda la clase junta.

## Registrar los resultados del alumnado (Hoja de Google)
Cada vez que un alumno supera un destino (o un reto de Robótica), el juego puede apuntar en una hoja de cálculo:
fecha, nombre, clase, destino, ciudad, estrellas, bloques usados, intentos (veces que pulsó Ejecutar),
personaje, el programa que hizo, el número de indicador y la valoración de 0 a 5. Solo se piden nombre de pila y clase; no pidáis más datos personales.

1. Crea una hoja nueva en https://sheets.new (por ejemplo "Rumbo a Europa · Resultados").
2. Menú **Extensiones → Apps Script**. Borra lo que haya y pega el contenido de `registro-google-apps-script.gs`. Guarda.
3. Pulsa **Implementar → Nueva implementación**. En el engranaje elige **Aplicación web**.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier usuario**.
   Pulsa **Implementar**, acepta los permisos y copia la **URL de la aplicación web** (termina en `/exec`).
4. Abre `js/personajes.js` y pega esa URL al final, en `REGISTRO.url`:
   `url: "https://script.google.com/macros/s/XXXX/exec"`
5. Vuelve a subir la web a Vercel. Los resultados aparecerán en la pestaña **Resultados** de la hoja las notas por alumno en **Valoraciones** y la media de cada indicador en **Medias por indicador**.
   Si ya tenías el script publicado, pega el código nuevo y haz **Implementar → Gestionar implementaciones → Editar → Nueva versión**.

Consejo: con un filtro o una tabla dinámica por Clase y Nombre verás de un vistazo quién va por qué destino.

### Si no aparecen datos en la hoja
1. **Prueba la conexión:** abre la URL `/exec` en el navegador. Debe salir "Funciona" y una fila PRUEBA en Resultados.
   - Si pide iniciar sesión o sale "no tienes permiso": en Implementar → Gestionar implementaciones → Editar, pon
     Quién tiene acceso = **Cualquier usuario** (con cuentas educativas a veces solo deja "cualquiera de tu organización";
     en ese caso crea la hoja con una cuenta de Gmail personal).
   - Si sale un error de `getSheetByName` de null: el script no está creado desde la hoja. Hazlo desde Extensiones → Apps Script de la propia hoja.
2. **URL pegada en `js/personajes.js`** (`REGISTRO.url`), con comillas, y la web **subida de nuevo a Vercel**.
3. Cada vez que cambies el script: **Gestionar implementaciones → Editar → Versión: nueva versión → Implementar** (si no, sigue el código viejo).
4. Prueba en la web de Vercel, no en la vista previa de Claude: la vista previa no deja enviar datos a Google.
