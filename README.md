# Explorador de contenido aleatorio

**Asignatura:** Programación Web III

**Integrante:** Dario Haziel Tambo Parra

Página web con cuatro secciones independientes: citas y autores, imágenes de perros,
imágenes de gatos y datos curiosos. Utiliza HTML, CSS y JavaScript, sin frameworks,
base de datos, inicio de sesión ni proceso de compilación.

## Ejecución

Se necesita un navegador moderno y conexión a Internet para las APIs.

1. Descomprimir el ZIP o clonar el repositorio.
2. Abrir una terminal dentro de `ExploradorContenidoAleatorio`.
3. Iniciar un servidor estático con Python 3:

   ```bash
   python3 -m http.server 8080 --bind 127.0.0.1
   ```

   En Windows, si el comando es `py`, utilizar:

   ```powershell
   py -m http.server 8080 --bind 127.0.0.1
   ```

4. Visitar <http://127.0.0.1:8080>.
5. Detener el servidor con `Ctrl+C` al terminar.

También puede servirse con Live Server de Visual Studio Code si ya está instalado.
Se recomienda HTTP local en lugar de abrir el HTML mediante `file://`.
No se necesita instalar paquetes, usar Docker ni descargar imágenes de contenedores.
Las fotografías se cargan directamente de las APIs en el navegador.

## Organización

```text
ExploradorContenidoAleatorio/
├── index.html                  # Estructura y cuatro secciones
├── favicon.svg                 # Icono local del proyecto
├── css/estilos.css             # Diseño, móvil y estados
├── js/explorador.js            # Consultas y actualización del DOM
├── capturas/                   # Evidencias tomadas en el navegador
├── pruebas/                    # Verificación y resultados
├── .gitignore
└── README.md
```

## Funcionamiento

- Las cuatro solicitudes comienzan al ingresar a la página.
- Cada botón ejecuta una nueva consulta `GET` con `fetch` y `async/await`.
- `obtenerCita()`, `mostrarPerro()`, `mostrarGato()` y `mostrarDato()` son
  funciones independientes. Cada una actualiza únicamente su sección.
- `consultarJson()` comprueba `response.ok` antes de procesar el JSON.
- `actualizarSeccion()` comparte el manejo de carga, errores y botones. Cada
  llamada tiene su propio `AbortController` y un límite de 25 segundos.
- Durante la solicitud se muestra **Cargando…** y se deshabilita solo el botón
  correspondiente. `finally` vuelve a habilitarlo incluso si ocurre un error.
- La descarga de la imagen también se espera y se manejan sus eventos `load`
  y `error`. Una respuesta JSON correcta no garantiza que la imagen exista.
- Ante un error se muestra un mensaje y el mismo botón permite reintentar.
  Si había contenido previo, se conserva mientras se informa del fallo.
- Los marcos de las dos fotografías tienen las mismas dimensiones dentro de
  cada tamaño de pantalla. `object-fit: contain` conserva su proporción y muestra
  la imagen completa sin deformarla.
- La cuadrícula usa dos columnas en computadora y una en teléfono. Hay texto
  alternativo, foco visible, mensajes con `aria-live` y soporte para movimiento reducido.
- Los textos externos se insertan mediante `textContent`, sin interpretarlos como HTML.
- `cache: "no-store"` evita reutilizar el caché de las consultas del navegador.
  La API puede devolver contenido repetido por azar; eso no se considera un error.

## Inspección previa de CATAAS

Antes de implementar la sección se consultó `GET https://cataas.com/cat?json=true`.
La respuesta real inspeccionada contenía estos campos:

| Campo | Tipo observado | Uso |
| --- | --- | --- |
| `id` | Cadena | Identificador de la imagen |
| `url` | Cadena | URL absoluta de la fotografía |
| `tags` | Arreglo de cadenas | Etiquetas |
| `created_at` | Cadena | Fecha de creación |
| `mimetype` | Cadena | Tipo de imagen |

La implementación usa `url`. Si no viene, construye
`https://cataas.com/cat/{id}` a partir del identificador recibido; también admite
el nombre de campo `_id` como alternativa. Una URL relativa se resuelve contra
`https://cataas.com`. La dirección final se asigna a una imagen y **no** se procesa
con `response.json()`. No hay identificadores ni fotografías fijas en el código.

## Preguntas de reflexión

### 1. ¿Qué es un endpoint y cuál utilizaste para cada API?

Un endpoint es una dirección de un servicio a la que se envía una solicitud HTTP
para consultar o modificar un recurso. En este proyecto todas las consultas son `GET`:

| API | Endpoint | Datos utilizados |
| --- | --- | --- |
| DummyJSON | `https://dummyjson.com/quotes/random` | `quote` y `author` |
| Dog CEO | `https://dog.ceo/api/breeds/image/random` | `message`, que contiene la URL de la imagen |
| CATAAS | `https://cataas.com/cat?json=true` | `url` o `id` para cargar la imagen |
| Useless Facts | `https://uselessfacts.jsph.pl/api/v2/facts/random?language=en` | `text` |

En CATAAS, cuando se usa el identificador, la imagen se consulta mediante
`https://cataas.com/cat/{id}`.

### 2. ¿Qué diferencia existe entre recibir JSON y recibir directamente una imagen?

JSON es texto estructurado que representa objetos, arreglos y valores. Permite
leer propiedades como `quote`, `author`, `text` o una URL. En cambio, una respuesta
de imagen contiene los bytes del archivo, por ejemplo JPEG o PNG, que el navegador
decodifica para mostrarla. Una imagen no es JSON: intentar interpretarla con
`response.json()` produce un error. En este proyecto el JSON proporciona la
dirección y el elemento `<img>` realiza la descarga de la fotografía.

### 3. ¿Qué función cumplen await y response.json()?

`await` espera a que una promesa se resuelva o se rechace y permite escribir el
flujo asíncrono de forma secuencial dentro de una función `async`. Suspende esa
función, sin bloquear toda la página ni las demás solicitudes.

`response.json()` lee el cuerpo de la respuesta y lo interpreta como JSON para
obtener un valor de JavaScript. También devuelve una promesa, por eso se utiliza
`const datos = await response.json()`. No convierte una imagen en JSON ni comprueba
por sí mismo si el estado HTTP indica éxito.

### 4. ¿Por qué se debe verificar response.ok además de utilizar try/catch?

`fetch` puede resolver su promesa aunque el servidor responda con un error HTTP,
como 404 o 500. Esos estados no entran automáticamente en `catch`.
`response.ok` es verdadero para estados entre 200 y 299. Al comprobarlo y lanzar
un error cuando es falso, el mismo `catch` puede manejar errores HTTP, fallos de
red, cancelaciones, JSON inválido y errores al cargar las imágenes.

### 5. ¿Cómo lograste actualizar una sección sin recargar toda la página?

Se registraron eventos `click` en botones de tipo `button`. Cada evento llama a
la función correspondiente, consulta su API mediante `fetch` y modifica solamente
los nodos de esa tarjeta con `textContent`, `hidden` o `replaceChildren()`.
No se envía un formulario ni se usa `location.reload()`. El navegador mantiene
el documento actual y las otras tarjetas conservan su contenido y funcionamiento.

## Capturas y reproducción del error

- `capturas/01-cuatro-secciones.png`: las cuatro APIs con contenido real.
- `capturas/02-error-controlado.png`: error de conexión en una tarjeta, con las
  otras tres conservando el contenido.
- `capturas/03-vista-movil.png`: evidencia adicional del diseño en teléfono.

Para reproducir manualmente un fallo:

1. Iniciar la página con conexión y esperar a que carguen las cuatro secciones.
2. Abrir las herramientas de desarrollo del navegador y activar el modo **Offline**
   de la pestaña **Red / Network**, si está disponible, o desconectar temporalmente Internet.
3. Pulsar **Obtener otra cita**, sin recargar la página.
4. Comprobar el mensaje de error, el botón habilitado y las otras tarjetas intactas.
5. Restaurar la conexión y pulsar el mismo botón para reintentar.

Las dos capturas principales se tomaron manualmente en Firefox y muestran
`http://localhost:8080` en la barra de direcciones.
Las pruebas y sus resultados se describen en `pruebas/RESULTADOS.md`.

## Documentación consultada

- [DummyJSON: citas](https://dummyjson.com/docs/quotes)
- [Dog CEO: imagen aleatoria](https://dog.ceo/dog-api/documentation/random)
- [CATAAS: imágenes y respuesta JSON](https://cataas.com/)
- [Useless Facts: API v2](https://uselessfacts.jsph.pl/)

## Entrega

El ZIP contiene el código fuente, este README y las capturas. No se utiliza
ASP.NET Core; no hay carpetas `bin`, `obj` ni `.vs` que incluir.
Para la plataforma se entrega el ZIP y el enlace al repositorio de GitHub.

Repositorio: [SuperGenio56/explorador-contenido-aleatorio](https://github.com/SuperGenio56/explorador-contenido-aleatorio).
