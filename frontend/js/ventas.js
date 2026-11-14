const METODOS_PAGO = ["Efectivo", "Nequi", "Daviplata", "Tarjeta"];

const cuerpoPendientes = document.getElementById("tabla-pendientes");
const cuerpoEgresos = document.getElementById("tabla-egresos");
const cuerpoVentas = document.getElementById("tabla-ventas");
const formEgreso = document.getElementById("form-egreso");
const selectPeriodo = document.getElementById("periodo-resumen");

async function cargarResumen() {
    try {
        const resumen = await api(`/api/ventas/resumen?periodo=${selectPeriodo.value}`);
        document.getElementById("kpi-ingresos").textContent = pesos(resumen.ingresos);
        document.getElementById("kpi-egresos").textContent = pesos(resumen.egresos);
        const utilidad = document.getElementById("kpi-utilidad");
        utilidad.textContent = pesos(resumen.utilidad);
        utilidad.classList.toggle("negativo", resumen.utilidad < 0);
    } catch (error) {
        mostrarError(error);
    }
}

function filaPendiente(pedido) {
    const metodo = document.createElement("select");
    metodo.setAttribute("aria-label", `Método de pago del pedido ${pedido.id_pedido}`);
    llenarSelect(metodo, METODOS_PAGO.map((m) => [m, m]));

    const monto = document.createElement("input");
    monto.type = "number";
    monto.min = String(pedido.total);
    monto.step = "0.01";
    monto.value = pedido.total;
    monto.className = "campo-control";
    monto.style.width = "130px";
    monto.setAttribute("aria-label", `Monto pagado del pedido ${pedido.id_pedido}`);

    const registrar = boton("Registrar pago", "primario pequeno", async () => {
        registrar.disabled = true;
        try {
            await api("/api/ventas", "POST", {
                id_pedido: pedido.id_pedido,
                metodo_pago: metodo.value,
                monto_pagado: Number(monto.value)
            });
            mostrarAviso(`Pago de ${codigoPedido(pedido.id_pedido)} registrado`);
            cargarTodo();
        } catch (error) {
            registrar.disabled = false;
            mostrarError(error);
        }
    });

    const fila = document.createElement("tr");
    fila.append(
        celda(codigoPedido(pedido.id_pedido)),
        celda(fechaHora(pedido.fecha_pedido)),
        celda(pedido.cliente || "Sin cliente"),
        celda(pedido.tipo_entrega),
        celda(pesos(pedido.total)),
        celda(metodo),
        celda(monto),
        celda(registrar)
    );
    return fila;
}

async function cargarPendientes() {
    try {
        const pendientes = await api("/api/ventas/pendientes");
        if (pendientes.length === 0) {
            mensajeTabla(cuerpoPendientes, "No hay pedidos entregados pendientes de cobro", 8);
            return;
        }
        cuerpoPendientes.replaceChildren(...pendientes.map(filaPendiente));
    } catch (error) {
        mensajeTabla(cuerpoPendientes, "No se pudieron cargar los pedidos pendientes", 8);
        mostrarError(error);
    }
}

async function cargarEgresos() {
    try {
        const egresos = await api("/api/egresos");
        if (egresos.length === 0) {
            mensajeTabla(cuerpoEgresos, "No hay egresos registrados", 6);
            return;
        }
        cuerpoEgresos.replaceChildren(...egresos.map((egreso) => {
            const fila = document.createElement("tr");
            fila.append(
                celda(egreso.id_egreso),
                celda(fechaHora(egreso.fecha_egreso)),
                celda(egreso.concepto),
                celda(egreso.categoria_gasto),
                celda(pesos(egreso.monto)),
                celda(egreso.usuario || "—")
            );
            return fila;
        }));
    } catch (error) {
        mensajeTabla(cuerpoEgresos, "No se pudieron cargar los egresos", 6);
        mostrarError(error);
    }
}

async function cargarVentas() {
    try {
        const ventas = await api("/api/ventas");
        if (ventas.length === 0) {
            mensajeTabla(cuerpoVentas, "No hay ventas registradas", 7);
            return;
        }
        cuerpoVentas.replaceChildren(...ventas.map((venta) => {
            const fila = document.createElement("tr");
            fila.append(
                celda(venta.id_venta),
                celda(fechaHora(venta.fecha_venta)),
                celda(codigoPedido(venta.id_pedido)),
                celda(venta.cliente || "Sin cliente"),
                celda(venta.metodo_pago),
                celda(pesos(venta.monto_pagado)),
                celda(venta.usuario || "—")
            );
            return fila;
        }));
    } catch (error) {
        mensajeTabla(cuerpoVentas, "No se pudieron cargar las ventas", 7);
        mostrarError(error);
    }
}

function cargarTodo() {
    cargarResumen();
    cargarPendientes();
    cargarEgresos();
    cargarVentas();
}

formEgreso.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    try {
        await api("/api/egresos", "POST", datosFormulario(formEgreso));
        formEgreso.reset();
        mostrarAviso("Egreso registrado");
        cargarResumen();
        cargarEgresos();
    } catch (error) {
        mostrarError(error);
    }
});

if (sesion) {
    selectPeriodo.addEventListener("change", cargarResumen);
    cargarTodo();
}
