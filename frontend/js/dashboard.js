const sesion = obtenerSesion();

if (!sesion) {
    window.location.replace("index.html");
}

const formatoPesos = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
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

function pintarKpis(kpis) {
    document.getElementById("kpi-ventas-hoy").textContent = `${pesos(kpis.ventasHoy)} COP`;

    const activos = kpis.pedidosActivos;
    document.getElementById("kpi-pedidos-activos").textContent =
        `${activos.total} ${activos.total === 1 ? "Activo" : "Activos"}`;
    document.getElementById("kpi-pedidos-detalle").textContent =
        `${activos.enCocina} en cocina · ${activos.enCamino} en camino`;

    const bajoStock = kpis.productosBajoStock;
    document.getElementById("kpi-bajo-stock").textContent =
        `${bajoStock} ${bajoStock === 1 ? "Alerta" : "Alertas"}`;

    const utilidad = kpis.utilidadNeta;
    const elementoUtilidad = document.getElementById("kpi-utilidad");
    elementoUtilidad.textContent = pesos(utilidad.total);
    elementoUtilidad.classList.toggle("negativo", utilidad.total < 0);
    document.getElementById("kpi-utilidad-detalle").textContent =
        `Ventas ${pesos(utilidad.ventas)} − Egresos ${pesos(utilidad.egresos)}`;
}

function celda(texto) {
    const td = document.createElement("td");
    td.textContent = texto;
    return td;
}

function pintarPedidos(pedidos) {
    const cuerpo = document.getElementById("tabla-pedidos-cuerpo");
    cuerpo.replaceChildren();

    if (pedidos.length === 0) {
        mostrarMensajeTabla("No hay pedidos registrados");
        return;
    }

    pedidos.forEach((pedido) => {
        const fila = document.createElement("tr");

        const badge = document.createElement("span");
        badge.className = `badge ${CLASES_ESTADO[pedido.estado] || ""}`;
        badge.textContent = pedido.estado;
        const celdaEstado = document.createElement("td");
        celdaEstado.appendChild(badge);

        fila.append(
            celda(`#ORD-${String(pedido.id_pedido).padStart(3, "0")}`),
            celda(pedido.cliente || "Sin cliente"),
            celda(pedido.tipo_entrega),
            celda(pesos(pedido.total)),
            celdaEstado
        );
        cuerpo.appendChild(fila);
    });
}

function mostrarMensajeTabla(mensaje) {
    const cuerpo = document.getElementById("tabla-pedidos-cuerpo");
    const fila = document.createElement("tr");
    const td = celda(mensaje);
    td.colSpan = 5;
    td.className = "mensaje-tabla";
    fila.appendChild(td);
    cuerpo.replaceChildren(fila);
}

async function cargarDashboard() {
    try {
        const respuesta = await fetch(`${API_URL}/api/dashboard`);
        if (!respuesta.ok) {
            throw new Error(`HTTP ${respuesta.status}`);
        }
        const datos = await respuesta.json();
        pintarKpis(datos.kpis);
        pintarPedidos(datos.pedidosRecientes);
    } catch (error) {
        console.error("Error al cargar el dashboard:", error);
        mostrarMensajeTabla("No se pudieron cargar los datos. Verifique que el servidor esté activo.");
    }
}

if (sesion) {
    document.getElementById("usuario-actual").textContent = sesion.nombre_usuario;
    document.getElementById("usuario-rol").textContent = sesion.rol;

    document.getElementById("btn-cerrar-sesion").addEventListener("click", () => {
        localStorage.removeItem(CLAVE_SESION);
    });

    cargarDashboard();
}
