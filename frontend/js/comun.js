// Lógica compartida por las páginas internas (requiere api.js).
const sesion = obtenerSesion();

if (!sesion) {
    window.location.replace("index.html");
}

const formatoPesos = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
});

const CLASES_ESTADO = {
    "En cocina": "cocina",
    "En camino": "camino",
    "Entregado": "entregado",
    "Cancelado": "cancelado"
};

function pesos(valor) {
    return formatoPesos.format(valor);
}

// Las fechas llegan como "AAAA-MM-DD HH:MM:SS" en la zona horaria del negocio.
function fechaHora(texto) {
    const [fecha, hora = "00:00:00"] = texto.split(" ");
    const [a, m, d] = fecha.split("-").map(Number);
    const [h, min] = hora.split(":").map(Number);
    return formatoFecha.format(new Date(a, m - 1, d, h, min));
}

function codigoPedido(id) {
    return `#ORD-${String(id).padStart(3, "0")}`;
}

function celda(contenido) {
    const td = document.createElement("td");
    if (contenido instanceof Node) {
        td.appendChild(contenido);
    } else {
        td.textContent = contenido;
    }
    return td;
}

function badge(texto, clase) {
    const span = document.createElement("span");
    span.className = `badge ${clase || ""}`;
    span.textContent = texto;
    return span;
}

function badgeEstado(estado) {
    return badge(estado, CLASES_ESTADO[estado]);
}

function boton(texto, clase, alHacerClic) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `btn ${clase}`;
    btn.textContent = texto;
    btn.addEventListener("click", alHacerClic);
    return btn;
}

function mensajeTabla(cuerpo, mensaje, columnas) {
    const fila = document.createElement("tr");
    const td = celda(mensaje);
    td.colSpan = columnas;
    td.className = "mensaje-tabla";
    fila.appendChild(td);
    cuerpo.replaceChildren(fila);
}

function llenarSelect(select, opciones, textoVacio) {
    select.replaceChildren();
    if (textoVacio !== undefined) {
        select.appendChild(new Option(textoVacio, ""));
    }
    opciones.forEach(([valor, texto]) => select.appendChild(new Option(texto, valor)));
}

// Hace la petición autenticada y devuelve el JSON; lanza un Error con el mensaje del servidor si falla.
async function api(ruta, metodo = "GET", cuerpo) {
    const opciones = { method: metodo };
    if (cuerpo !== undefined) {
        opciones.headers = { "Content-Type": "application/json" };
        opciones.body = JSON.stringify(cuerpo);
    }

    const respuesta = await fetchAutenticado(ruta, opciones);
    const datos = respuesta.status === 204 ? null : await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
        throw new Error((datos && datos.mensaje) || `Error HTTP ${respuesta.status}`);
    }
    return datos;
}

let temporizadorAviso;

function mostrarAviso(mensaje, tipo = "exito") {
    let aviso = document.getElementById("aviso");
    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "aviso";
        aviso.setAttribute("role", "status");
        document.body.appendChild(aviso);
    }
    aviso.textContent = mensaje;
    aviso.className = `aviso ${tipo} visible`;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => aviso.classList.remove("visible"), 3500);
}

function mostrarError(error) {
    mostrarAviso(error.message || "Ocurrió un error inesperado", "error");
}

function datosFormulario(formulario) {
    return Object.fromEntries(new FormData(formulario).entries());
}

if (sesion) {
    document.getElementById("usuario-actual").textContent = sesion.usuario.nombre_usuario;
    document.getElementById("usuario-rol").textContent = sesion.usuario.rol;
    document.getElementById("btn-cerrar-sesion").addEventListener("click", cerrarSesion);

    document.querySelectorAll("dialog [data-cerrar]").forEach((btn) => {
        btn.addEventListener("click", () => btn.closest("dialog").close());
    });
}
