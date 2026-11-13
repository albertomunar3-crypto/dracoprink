// Express sirve el frontend y la API en el mismo origen, sea cual sea su PORT.
// Si la página se abre como archivo o con Live Server, se usa la API local.
const ORIGEN_EXTERNO = window.location.protocol === "file:" || ["5500", "5501"].includes(window.location.port);
const API_URL = ORIGEN_EXTERNO ? "http://localhost:3000" : "";

const CLAVE_SESION = "dracoprink_usuario";

function obtenerSesion() {
    try {
        const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION));
        return sesion && sesion.token && sesion.usuario ? sesion : null;
    } catch (error) {
        return null;
    }
}

function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
}

async function fetchAutenticado(ruta, opciones = {}) {
    const sesion = obtenerSesion();
    const respuesta = await fetch(`${API_URL}${ruta}`, {
        ...opciones,
        headers: { ...opciones.headers, Authorization: `Bearer ${sesion ? sesion.token : ""}` }
    });

    if (respuesta.status === 401) {
        cerrarSesion();
        window.location.replace("index.html");
        throw new Error("Sesión inválida o expirada");
    }

    return respuesta;
}
