// Express sirve el frontend y la API en el mismo origen, sea cual sea su PORT.
// Si la página se abre como archivo o con Live Server, se usa la API local.
const ORIGEN_EXTERNO = window.location.protocol === "file:" || ["5500", "5501"].includes(window.location.port);
const API_URL = ORIGEN_EXTERNO ? "http://localhost:3000" : "";

const CLAVE_SESION = "dracoprink_usuario";

function obtenerSesion() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_SESION));
    } catch (error) {
        return null;
    }
}
