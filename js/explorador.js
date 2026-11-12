"use strict";

const ENDPOINTS = {
  cita: "https://dummyjson.com/quotes/random",
  perro: "https://dog.ceo/api/breeds/image/random",
  gato: "https://cataas.com/cat?json=true",
  dato: "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en",
};
const TIEMPO_LIMITE_MS = 25000;

// Las cuatro funciones consultan y actualizan únicamente su propia sección.
async function obtenerCita() {
  await actualizarSeccion("cita", async (signal) => {
    const datos = await consultarJson(ENDPOINTS.cita, signal);
    const cita = validarTexto(datos.quote);
    const autor = validarTexto(datos.author);
    document.querySelector("#texto-cita").textContent = cita;
    document.querySelector("#autor-cita").textContent = autor;
    document.querySelector("#contenido-cita").hidden = false;
    document.querySelector("#cita .placeholder").hidden = true;
  });
}

async function mostrarPerro() {
  await actualizarSeccion("perro", async (signal) => {
    const datos = await consultarJson(ENDPOINTS.perro, signal);
    if (datos.status !== "success") {
      throw new Error("La API de perros no pudo entregar una imagen. Vuelve a intentarlo.");
    }
    const imagen = await cargarImagen(datos.message, "Perro seleccionado al azar por Dog CEO", signal);
    document.querySelector("#imagen-perro").replaceChildren(imagen);
  });
}

async function mostrarGato() {
  await actualizarSeccion("gato", async (signal) => {
    // ?json=true entrega metadatos; /cat/{id} entrega la imagen, no JSON.
    const datos = await consultarJson(ENDPOINTS.gato, signal);
    const identificador = datos.id || datos._id;
    const direccion = datos.url || (identificador
      ? `https://cataas.com/cat/${encodeURIComponent(identificador)}`
      : null);
    if (!direccion) {
      throw new Error("La API de gatos no devolvió una imagen válida. Vuelve a intentarlo.");
    }
    const url = new URL(direccion, "https://cataas.com").href;
    const imagen = await cargarImagen(url, "Gato seleccionado al azar por CATAAS", signal);
    document.querySelector("#imagen-gato").replaceChildren(imagen);
  });
}

async function mostrarDato() {
  await actualizarSeccion("dato", async (signal) => {
    const datos = await consultarJson(ENDPOINTS.dato, signal);
    const texto = document.querySelector("#texto-dato");
    texto.textContent = validarTexto(datos.text);
    texto.hidden = false;
    document.querySelector("#dato .placeholder").hidden = true;
  });
}

async function consultarJson(endpoint, signal) {
  // no-store evita reutilizar una respuesta del caché del navegador.
  const response = await fetch(endpoint, { method: "GET", cache: "no-store", signal });
  if (!response.ok) {
    throw new Error(`El servicio respondió con un error (HTTP ${response.status}). Vuelve a intentarlo.`);
  }
  const datos = await response.json();
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    throw new Error("El servicio devolvió datos inesperados. Vuelve a intentarlo.");
  }
  return datos;
}

function validarTexto(valor) {
  if (typeof valor !== "string" || !valor.trim()) {
    throw new Error("El servicio devolvió datos incompletos. Vuelve a intentarlo.");
  }
  return valor.trim();
}

// Espera la descarga real de la imagen antes de dar la consulta por terminada.
// Así se detectan también imágenes rotas aunque el JSON haya llegado bien.
function cargarImagen(direccion, textoAlternativo, signal) {
  const url = new URL(validarTexto(direccion));
  if (url.protocol !== "https:") {
    throw new Error("El servicio devolvió una dirección de imagen inválida. Vuelve a intentarlo.");
  }

  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.alt = textoAlternativo;
    imagen.decoding = "async";

    function limpiarEventos() {
      imagen.onload = null;
      imagen.onerror = null;
      signal.removeEventListener("abort", cancelar);
    }

    function cancelar() {
      limpiarEventos();
      imagen.removeAttribute("src");
      reject(new DOMException("Tiempo de espera agotado", "AbortError"));
    }

    imagen.onload = () => {
      limpiarEventos();
      resolve(imagen);
    };
    imagen.onerror = () => {
      limpiarEventos();
      reject(new Error("No se pudo cargar la imagen. Pulsa el botón para buscar otra."));
    };
    signal.addEventListener("abort", cancelar, { once: true });
    if (signal.aborted) {
      cancelar();
      return;
    }
    imagen.src = url.href;
  });
}

// Cada tarjeta tiene su propio botón, estado y temporizador: ningún error
// interrumpe las consultas de las otras tarjetas.
async function actualizarSeccion(id, consultarYMostrar) {
  const seccion = document.getElementById(id);
  const boton = seccion.querySelector("button");
  const estado = seccion.querySelector(".status");
  const contenido = seccion.querySelector(".card-content");
  if (boton.disabled) return;

  boton.disabled = true;
  seccion.dataset.state = "loading";
  contenido.setAttribute("aria-busy", "true");
  estado.textContent = "Cargando…";
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS);

  try {
    await consultarYMostrar(controlador.signal);
    seccion.dataset.state = "success";
    estado.textContent = "Listo. Puedes descubrir algo más.";
  } catch (error) {
    seccion.dataset.state = "error";
    if (error.name === "AbortError") {
      estado.textContent = "La consulta tardó demasiado. Pulsa el botón para reintentar.";
    } else if (error.name === "TypeError") {
      estado.textContent = "No se pudo conectar con el servicio. Revisa tu conexión y vuelve a intentarlo.";
    } else if (error.name === "SyntaxError") {
      estado.textContent = "El servicio no devolvió JSON válido. Vuelve a intentarlo.";
    } else {
      estado.textContent = error.message || "No se pudo obtener contenido. Vuelve a intentarlo.";
    }
  } finally {
    clearTimeout(temporizador);
    contenido.setAttribute("aria-busy", "false");
    boton.disabled = false;
  }
}

document.querySelector("#boton-cita").addEventListener("click", obtenerCita);
document.querySelector("#boton-perro").addEventListener("click", mostrarPerro);
document.querySelector("#boton-gato").addEventListener("click", mostrarGato);
document.querySelector("#boton-dato").addEventListener("click", mostrarDato);

// El script tiene defer: el DOM ya existe. Las cuatro solicitudes arrancan
// independientemente, sin esperar que termine la anterior.
obtenerCita();
mostrarPerro();
mostrarGato();
mostrarDato();
