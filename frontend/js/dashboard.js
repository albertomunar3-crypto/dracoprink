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

function pintarPedidos(pedidos) {
    const cuerpo = document.getElementById("tabla-pedidos-cuerpo");

    if (pedidos.length === 0) {
        mensajeTabla(cuerpo, "No hay pedidos registrados", 5);
        return;
    }

    cuerpo.replaceChildren(...pedidos.map((pedido) => {
        const fila = document.createElement("tr");
        fila.append(
            celda(codigoPedido(pedido.id_pedido)),
            celda(pedido.cliente || "Sin cliente"),
            celda(pedido.tipo_entrega),
            celda(pesos(pedido.total)),
            celda(badgeEstado(pedido.estado))
        );
        return fila;
    }));
}

async function cargarDashboard() {
    try {
        const datos = await api("/api/dashboard");
        pintarKpis(datos.kpis);
        pintarPedidos(datos.pedidosRecientes);
    } catch (error) {
        console.error("Error al cargar el dashboard:", error);
        mensajeTabla(document.getElementById("tabla-pedidos-cuerpo"),
            "No se pudieron cargar los datos. Verifique que el servidor esté activo.", 5);
    }
}

if (sesion) {
    cargarDashboard();
}
