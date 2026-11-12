# Verificación de funcionamiento

Fecha: 12 de noviembre de 2026.

## Entorno y alcance

- Firefox 159 en Linux, ejecutado sin interfaz gráfica con un perfil temporal.
- Página servida por HTTP local con Python 3.12.
- Automatización mediante Marionette, incluido en Firefox, y Python estándar.
- Consultas reales a las cuatro APIs y descarga real de las dos fotografías.
- Revisión visual de capturas de escritorio y de la vista móvil.
- Comprobación estática de IDs únicos, archivos locales existentes y separación de HTML, CSS y JavaScript.
- No se instalaron dependencias ni se utilizaron contenedores de Docker.

## Resultados

| Prueba | Resultado |
| --- | --- |
| Carga inicial real de las cuatro APIs y ambas imágenes | Correcto |
| Consulta independiente, carga, bloqueo y nueva solicitud: cita | Correcto |
| Consulta independiente, carga, bloqueo y nueva solicitud: perro | Correcto |
| Consulta independiente, carga, bloqueo y nueva solicitud: gato | Correcto |
| Consulta independiente, carga, bloqueo y nueva solicitud: dato | Correcto |
| Error de red controlado | Correcto |
| Otra API continúa funcionando mientras una tarjeta está en error | Correcto |
| Reintento real tras error de red | Correcto |
| HTTP 503 detectado por response.ok | Correcto |
| JSON inválido controlado | Correcto |
| Respuesta con campos faltantes | Correcto |
| Error de descarga de imagen posterior al JSON | Correcto |
| CATAAS: imagen construida desde el id real cuando no viene url | Correcto |
| Cancelación a los 25 segundos y rehabilitación del botón | Correcto |
| Recuperación después del tiempo de espera agotado | Correcto |
| Diseño sin desbordamiento e imágenes uniformes a 768px | Correcto |
| Diseño sin desbordamiento e imágenes uniformes a 1024px | Correcto |
| Diseño sin desbordamiento e imágenes uniformes a 1440px | Correcto |
| Botón enfocable y regiones aria-live presentes | Correcto |
| Viewport real de 320px dentro de iframe | Correcto |
| Viewport real de 390px dentro de iframe | Correcto |

Los cinco anchos comprobados fueron 320, 390, 768, 1024 y 1440 píxeles.
Para 320 y 390 se utilizó un iframe del mismo origen con el tamaño indicado,
porque la ventana principal de Firefox en este entorno tiene un mínimo de 500
píxeles. Se verificó `contentWindow.innerWidth`, el ancho del documento, una sola
columna, marcos de imagen de igual altura y botones de 46 píxeles. Esto comprueba
el diseño adaptable en un viewport móvil; no equivale a una prueba en un teléfono físico.
La captura móvil incluye únicamente el contenido de ese iframe a 390 píxeles.

## Errores provocados durante las pruebas

Los fallos de red, HTTP 503, JSON inválido, campos faltantes y espera agotada se
provocaron sustituyendo temporalmente `window.fetch` dentro del navegador de
prueba. El fallo de imagen se provocó devolviendo una URL HTTPS inexistente y
esperando el evento `error` de la imagen. El código fuente de la aplicación no
contiene interruptores de prueba ni datos simulados.

También se retiró temporalmente el campo `url` de una respuesta real de CATAAS
para comprobar la construcción de la imagen a partir del `id` recibido.

Después de cada fallo se comprobó que el botón quedara habilitado y que una nueva
consulta real recuperara el funcionamiento. Se comparó el contenido de las otras
tres tarjetas para verificar que no cambiara. El límite de espera se observó
aproximadamente a los 25 segundos.

## Evidencias

- `capturas/01-cuatro-secciones.png`: carga real de las cuatro APIs.
- `capturas/02-error-controlado.png`: fallo de conexión simulado en citas, con
  mensaje comprensible, botón habilitado y las otras secciones disponibles.
- `capturas/03-vista-movil.png`: página completa a 390 píxeles de ancho.

Las capturas corresponden a la página ejecutada en el navegador. El contenido
aleatorio puede ser distinto en cada imagen y en futuras consultas.

## Revisión manual para repetir

1. Iniciar la página siguiendo el README y comprobar las cuatro secciones.
2. Pulsar cada botón: solo esa tarjeta debe mostrar `Cargando…`, bloquear su
   botón y después mostrar el resultado o un error recuperable.
3. Activar temporalmente el modo Offline del navegador, solicitar una cita y
   verificar el error; restaurar la conexión y reintentar.
4. Cambiar el ancho del navegador o usar su vista adaptable: no debe haber
   desplazamiento horizontal y las fotos deben conservar sus proporciones.
5. Navegar con Tab hasta los botones y activarlos con Enter o Espacio.

Las APIs son servicios externos; estas pruebas registran el funcionamiento en
la fecha indicada y no garantizan su disponibilidad futura.
