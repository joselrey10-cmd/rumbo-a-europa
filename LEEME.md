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

## Rincones TIC (portada)
La web se abre en **Rincones**: el alumno escribe su nombre, su **usuario de Educacyl** y elige su **curso**
(P5A, P5B, P6A o P6B). El curso decide qué indicadores ve: los de 5.º o los de 6.º. Hay cuatro rincones:
- **Crea**: los retos de las sesiones 1 y 2 de cada SA (Word, PDF y correo, Excel, Canva, pódcast), con ruta
  sencilla, intermedia o avanzada y ExtraTIC. Datos en `js/rincones-datos.js` (`CREA`). Van en orden: el alumno
  marca la ruta y pulsa «He terminado el reto», y así se abre el siguiente. No pone nota: la nota de los
  indicadores la pone el profe en el panel Profe, donde ve qué retos ha terminado cada alumno.
- **Programa**: los 17 destinos de Rumbo a Europa (pantalla de Programación).
- **Robótica**: los retos de Robot, SPIKE Essential y SPIKE Prime.
- **Piensa**: las 10 paradas del Pasaporte TIC, copiadas en la carpeta `piensa/`. Al terminar una actividad su
  llave se guarda sola y, al volver al rincón, pone las notas de cada indicador (también se puede pegar la llave).
  Cada actividad empieza con una lectura y dos preguntas de comprensión: hasta acertar las dos no se abren las misiones.

En cada actividad se elige una nota de 0 a 5 por indicador y se pulsa **Enviar notas**: se manda una fila por
indicador a la misma hoja de Google. En Programa y Robótica la nota se pone sola al jugar; en **Mis notas** se
puede revisar y volver a enviar. El Excel de la portada recoge los cuatro rincones.

## Panel del profesor (pestaña Profe)
1. En el script de la hoja (`registro-google-apps-script.gs`) cambia `CLAVE_PROFE = "cambia-esta-clave"` por una clave tuya.
2. Pega el script en Apps Script y crea una **nueva versión** (Gestionar implementaciones → Editar → Nueva versión).
3. En la web, pestaña **Profe**, escribe la clave. Verás cada grupo (P5A, P5B, P6A, P6B) con la media de cada
   rincón por alumno y la media de cada indicador. Pulsa un alumno para ver todas sus actividades, poner o corregir
   notas y enviarlas: llegan a la hoja como "Nota del profe" y sustituyen a la anterior.
La clave solo está en el script, así que el alumnado no puede leer las notas de los demás.

**Importar alumnado (CSV):** en el panel Profe → "Importar alumnado desde un CSV". Columnas `nombre;apellidos;usuario`
y, si quieres, `curso` y `correo` (de la familia). Hay una plantilla para descargar. Se guarda en la pestaña **Alumnado** de la hoja.
También puedes escribir o cambiar el correo de la familia en la ficha de cada alumno.

**Editar textos de las pantallas:** en el panel Profe pulsa **✏️ Editar textos**. Abajo aparece una barra con
**✏️ Editar / 👆 Navegar** y un menú «Ir a» (Portada, Crea, Programa, Robótica, Piensa, autoevaluaciones).
En «Navegar» los botones funcionan para entrar en un destino de Programa, un reto de Robótica o una actividad de Piensa
(se abre en otra pestaña y sigue en modo editar); vuelve a «Editar» para cambiar textos. Los textos se marcan al pasar el ratón. Pulsa uno, escríbelo de nuevo y **Guardar**. Se guarda en la pestaña
**Textos** de la hoja y el alumnado lo ve al abrir la página. «Volver al original» deshace el cambio (o borra la fila en la hoja).
Cada cambio vale para esa pantalla y ese texto exacto (los textos que llevan el curso, como «Retos de 5º…», se cambian
una vez para 5.º y otra para 6.º). Pulsa «Terminar de editar» para salir.

## Entrada del alumnado con contraseña elegida
Cada alumno elige una contraseña de 4 a 24 caracteres en su primer acceso, después de seleccionar grupo, nombre y usuario de Educacyl. En las siguientes visitas escribe esa misma contraseña. La sesión de ese dispositivo se mantiene durante 120 días. Puede cambiar la contraseña desde su sesión.

Las contraseñas se guardan en la pestaña **Accesos alumnado** de la hoja de Google, junto al nombre, usuario y clase, para que el profesor pueda recuperarlas si alguien las olvida. **Importante:** esta pestaña contiene contraseñas legibles; comparte la hoja únicamente con personas autorizadas del profesorado. No compartas el enlace de la hoja con el alumnado.

El alumnado con adaptación curricular mantiene la entrada directa mediante la selección de su nombre, como en la versión anterior. La hoja **Alumnado** debe contener el usuario Educacyl correcto.

## Adaptación curricular
En el panel Profe, en la ficha del alumno, marca **Adaptación curricular**. Ese alumno entra solo con elegir su grupo y
su nombre (sin código) y ve los contenidos adaptados (`js/adaptacion.js`):
- **Indicadores:** los mismos números (mismo criterio) con un logro muy básico, tomado de la programación de 1.º. Las notas van a las mismas columnas.
- **Crea:** elige su país (Francia, Italia, Portugal o Alemania), lee o escucha 🔊 una ficha corta con la información ya buscada y responde con una o dos palabras. Las respuestas llegan a la hoja con el reto terminado.
- **Programa:** 6 niveles cortos con botones grandes de flechas (delante, atrás, girar y saltar).
- **Robótica:** solo el robot de flechas (con flecha atrás) y 10 retos graduados; mantiene la puntuación máxima de 2,5 puntos.
- **Piensa:** cada parada abre `piensa/facil.html`: lectura de 2-3 líneas, un vídeo y un juego de «bien o mal». La llave se guarda sola.
Puedes cambiar los textos en `js/adaptacion.js` o con «Editar textos».

## Autoevaluación (Programa y Robótica)
En la portada, los botones **Autoevaluación** de Programa y Robótica llevan a una página donde el alumno elige de 0 a 5
lo que sabe hacer en cada indicador de su curso. Va a una pestaña aparte de la hoja, **Autoevaluación** (no cuenta en
las medias de las notas), y el profe la ve en la ficha de cada alumno del panel Profe. Las notas automáticas de esos
rincones ya no las puede cambiar el alumno: solo las consulta.

## Familias (pestaña Familias)
La familia escribe su correo; si está en la pestaña Alumnado, recibe un código de 6 cifras (vale 15 minutos) y con él
ve solo los resultados de su hijo o hija (o de sus hijos, si tiene varios con el mismo correo). Si el correo no está
registrado no se envía nada. El correo lo manda tu cuenta de Google (límite de unos 100 correos al día con Gmail).
Al pegar el script nuevo hay que darle permiso para enviar correos: en Apps Script elige la función `doGet`, pulsa
**Ejecutar** y acepta los permisos; después crea la nueva versión.

## Pantalla de Robótica
En el menú de arriba hay dos pantallas: **Programación · Rumbo a Europa** (el juego con Pini) y **Robótica**.
En Robótica se programa un robot sobre un mapa de Europa con todos los países, dividido en 6 × 6 casillas de 15 × 15 cm.
Hay tres modalidades, con 10 retos cada una (ir de un país a otro):
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
  e `INDICADOR_ROBOTICA` (indicador de cada uno de los 10 retos de cada modalidad). Cambia ahí cualquier relación.
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
fecha, nombre, usuario de Educacyl, clase, destino, ciudad, estrellas, bloques usados, intentos (veces que pulsó Ejecutar),
personaje, el programa que hizo, el número de indicador y la valoración de 0 a 5. Se piden nombre, usuario de Educacyl y curso; no pidáis más datos personales.

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

## Orden por apellidos y dar de baja
- Las pestañas Alumnado, Valoraciones, Autoevaluación y Medias se ordenan solas por clase y apellidos cada vez que llega una nota (Resultados sigue por fecha). Para ordenarlas ya, elige `ordenarTodo` en el editor de Apps Script y pulsa Ejecutar.
- En el panel Profe, la papelera 🗑️ de cada fila (o el botón «Dar de baja» dentro del alumno) lo borra de todas las pestañas (pide confirmación; no se puede deshacer).
- Correos de las familias: hasta dos por alumno (tutor 1 y tutor 2), en el panel o en el CSV con las columnas «correo tutor 1» y «correo tutor 2». Se guardan juntos en «Correo familia», separados por coma, y cualquiera de los dos puede pedir el código.
- En Valoraciones, Autoevaluación, Medias y Resultados el alumno aparece en una sola columna como «Apellidos, Nombre» (sacado de la pestaña Alumnado por su usuario). Alumnado mantiene Nombre y Apellidos por separado porque es la lista importada.

## Desplegable de nombres y códigos para las familias
- El alumno elige primero su grupo y después su nombre en un desplegable (la lista importada en la pestaña Alumnado). El usuario de Educacyl lo escribe a mano y la web le avisa si no coincide; si se equivoca, la hoja usa el usuario de la lista, así no hay alumnos repetidos. Si un grupo aún no tiene lista, se puede escribir el nombre como antes.
- La lista solo muestra nombres (ni usuarios ni correos) y la ve cualquiera que abra la web y elija un grupo.
- Panel Profe → «✉️ Acceso de las familias»: envía a cada familia un correo con las instrucciones y su código (vale 7 días; cambia DIAS_CODIGO_PROFE en el script). Una familia con dos hijos recibe un solo código. También hay «✉️ Enviar código» en la ficha de cada alumno. La familia entra en la web → Familias → escribe su correo → «Ya tengo un código».
- probarCorreo (en el editor de Apps Script) envía un correo de prueba y dice cuántos alumnos tienen correo de familia.

## Retos encadenados con códigos individuales

Programa, Piensa y cada modalidad de Robótica (Robot, SPIKE Essential y SPIKE Prime) tienen ahora una secuencia independiente. Al terminar un reto, el servidor genera un código individual de 8 caracteres para el siguiente. Para continuar, el alumno debe introducir ese código. Los códigos y el progreso se guardan en las propiedades del proyecto de Apps Script, vinculados al usuario Educacyl y a su sesión; no dependen del almacenamiento local del navegador. El rincón Crea no se modifica.

**Importante para activar esta mejora:** sustituye el contenido del proyecto de Apps Script por el archivo actualizado `registro-google-apps-script.gs` y publica una **nueva versión** de la aplicación web (Gestionar implementaciones → Editar → Nueva versión). No cambies la URL de la implementación en la configuración de la web. Después, publica los archivos web actualizados en Vercel. Si no actualizas Apps Script, los retos no podrán validar ni emitir códigos.

## Retos encadenados y valoración proporcional (actualización)
Programa, Piensa y cada modalidad de Robótica (Robot, SPIKE Essential y SPIKE Prime) tienen secuencias independientes. Al superar una pantalla, el servidor genera un código individual de 8 caracteres para desbloquear la siguiente; el código no sirve para otro alumno ni para otra secuencia. Crea conserva su funcionamiento y su valoración por rúbrica; Piensa mantiene su valoración actual.

La nota automática de **Programa** se calcula sobre sus 17 pantallas: `5 × pantallas superadas / 17`.
En **Robótica**, la nota se calcula dentro de cada modalidad: Robot (máximo 2,5), SPIKE Essential (máximo 3,5) y SPIKE Prime (máximo 5), multiplicando el máximo por la proporción de pantallas superadas. En adaptación curricular, Robot tiene 10 pantallas adaptadas y mantiene el máximo de 2,5.

La hoja de Google crea/actualiza la pestaña **Progreso por rutas**, con el número de pantallas superadas, el total y la nota proporcional de cada ruta para cada alumno. La pestaña **Resultados** sigue registrando cada pantalla superada y **Valoraciones** recibe la nota de progreso correspondiente. Crea y Piensa no cambian sus criterios de valoración.

**Para activar el conjunto de mejoras:** sustituye el contenido del proyecto de Apps Script por el archivo actualizado `registro-google-apps-script.gs` y publica una **nueva versión** (Gestionar implementaciones → Editar → Nueva versión), conservando la URL actual. Después publica en Vercel todos los archivos de esta versión del proyecto. Los códigos y las notas proporcionales no funcionarán correctamente si se actualiza solo la web o solo Apps Script.


**Acceso del alumnado (versión actualizada):** cada alumno elige su contraseña en el primer acceso. El profesor puede recuperarla en la pestaña «Accesos alumnado» de la hoja de cálculo. Esta pestaña contiene contraseñas en texto legible: limita el acceso a la hoja exclusivamente al profesorado.

**Robótica:** 10 pantallas por modalidad; las pantallas 5 a 10 incorporan seis nuevos retos de dificultad progresiva. Se mantienen los máximos de 2,5 (Robot), 3,5 (SPIKE Essential) y 5 (SPIKE Prime), con nota proporcional a las pantallas completadas.

## Actualización de Robótica
Cada modalidad (Robot, SPIKE Essential y SPIKE Prime) tiene 10 pantallas. Se conservan los cuatro primeros retos de la versión anterior y se incorporan seis nuevos (pantallas 5–10), con más paradas y secuencias progresivamente más complejas. SPIKE Essential incorpora un sensor virtual del tapete y condiciones; SPIKE Prime añade condiciones, variables y bucles. El sensor virtual identifica el país de la casilla en la que se encuentra el robot; no controla un sensor físico conectado al robot.

La puntuación se calcula proporcionalmente al número de pantallas superadas: Robot, máximo 2,5; SPIKE Essential, máximo 3,5; SPIKE Prime, máximo 5. La adaptación curricular conserva el máximo de 2,5 puntos en sus 10 retos adaptados. El servidor conserva el progreso y migra los historiales de las versiones anteriores de 4 o 6 pantallas. Crea y Piensa no se modifican.
