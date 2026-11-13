// Si el frontend se sirve desde Express (puerto 3000) se usa la misma URL;
// si se abre con Live Server u otro servidor, se apunta a la API local.
const API_URL = window.location.port === "3000" ? "" : "http://localhost:3000";

const CLAVE_SESION = "dracoprink_usuario";

function obtenerSesion() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_SESION));
    } catch (error) {
        return null;
    }
}
