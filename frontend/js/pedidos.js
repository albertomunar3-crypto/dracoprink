const ESTADOS = ["En cocina", "En camino", "Entregado", "Cancelado"];

const cuerpoPedidos = document.getElementById("tabla-pedidos");
const filtroEstado = document.getElementById("filtro-estado");
const modalPedido = document.getElementById("modal-pedido");
const formPedido = document.getElementById("form-pedido");
const selectProducto = document.getElementById("pedido-producto");
const inputCantidad = document.getElementById("pedido-cantidad");
const cuerpoItems = document.getElementById("tabla-items");

let productosDisponibles = [];
let items = [];

function selectorEstado(pedido) {
    const select = document.createElement("select");
    select.setAttribute("aria-label", `Estado del pedido ${pedido.id_pedido}`);
    llenarSelect(select, ESTADOS.map((e) => [e, e]));
    select.value = pedido.estado;

    if (pedido.pagado || pedido.estado === "Cancelado") {
        select.disabled = true;
        select.title = pedido.pagado ? "Pedido ya cobrado" : "Pedido cancelado";
    }

    select.addEventListener("change", async () => {
        const nuevo = select.value;
        if (nuevo === "Cancelado" && !confirm(`¿Cancelar el pedido ${codigoPedido(pedido.id_pedido)}? Los productos volverán al inventario.`)) {
            select.value = pedido.estado;
            return;
        }
        try {
            await api(`/api/pedidos/${pedido.id_pedido}/estado`, "PATCH", { estado: nuevo });
            mostrarAviso(`${codigoPedido(pedido.id_pedido)} ahora está "${nuevo}"`);
            cargarPedidos();
        } catch (error) {
            select.value = pedido.estado;
            mostrarError(error);
        }
    });
    return select;
}

function pintarPedidos(pedidos) {
    if (pedidos.length === 0) {
        mensajeTabla(cuerpoPedidos, "No hay pedidos con este estado", 8);
        return;
    }

    cuerpoPedidos.replaceChildren(...pedidos.map((pedido) => {
        const estado = document.createElement("div");
        estado.className = "acciones";
        estado.appendChild(badgeEstado(pedido.estado));
        if (pedido.pagado) estado.appendChild(badge("Cobrado", "pagado"));

        const fila = document.createElement("tr");
        fila.append(
            celda(codigoPedido(pedido.id_pedido)),
            celda(fechaHora(pedido.fecha_pedido)),
            celda(pedido.cliente || "Sin cliente"),
            celda(pedido.tipo_entrega),
            celda(pedido.productos || "—"),
            celda(pesos(pedido.total)),
            celda(estado),
            celda(selectorEstado(pedido))
        );
        return fila;
    }));
}

async function cargarPedidos() {
    try {
        const estado = encodeURIComponent(filtroEstado.value);
        pintarPedidos(await api(`/api/pedidos?estado=${estado}`));
    } catch (error) {
        mensajeTabla(cuerpoPedidos, "No se pudieron cargar los pedidos", 8);
        mostrarError(error);
    }
}

function pintarItems() {
    const total = items.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
    document.getElementById("pedido-total").textContent = pesos(total);

    if (items.length === 0) {
        mensajeTabla(cuerpoItems, "Agregue productos al pedido", 5);
        return;
    }

    cuerpoItems.replaceChildren(...items.map((item, indice) => {
        const cantidad = document.createElement("input");
        cantidad.type = "number";
        cantidad.min = "1";
        cantidad.max = String(item.stock);
        cantidad.step = "1";
        cantidad.value = item.cantidad;
        cantidad.setAttribute("aria-label", `Cantidad de ${item.nombre}`);
        cantidad.addEventListener("input", () => {
            const valor = Number(cantidad.value);
            if (Number.isInteger(valor) && valor >= 1) {
                item.cantidad = Math.min(valor, item.stock);
                subtotal.textContent = pesos(item.precio * item.cantidad);
                document.getElementById("pedido-total").textContent =
                    pesos(items.reduce((suma, i) => suma + i.precio * i.cantidad, 0));
            }
        });
        cantidad.addEventListener("change", pintarItems);

        const subtotal = celda(pesos(item.precio * item.cantidad));
        const fila = document.createElement("tr");
        fila.append(
            celda(item.nombre),
            celda(pesos(item.precio)),
            celda(cantidad),
            subtotal,
            celda(boton("Quitar", "peligro pequeno", () => {
                items.splice(indice, 1);
                pintarItems();
            }))
        );
        return fila;
    }));
}

function agregarItem() {
    const producto = productosDisponibles.find((p) => String(p.id_producto) === selectProducto.value);
    const cantidad = Number(inputCantidad.value);
    if (!producto) return mostrarAviso("Seleccione un producto", "error");
    if (!Number.isInteger(cantidad) || cantidad < 1) return mostrarAviso("La cantidad debe ser un entero mayor a 0", "error");

    const existente = items.find((i) => i.id_producto === producto.id_producto);
    const total = cantidad + (existente ? existente.cantidad : 0);
    if (total > producto.stock) {
        return mostrarAviso(`Stock insuficiente de ${producto.nombre_producto}: disponible ${producto.stock}`, "error");
    }

    if (existente) {
        existente.cantidad = total;
    } else {
        items.push({
            id_producto: producto.id_producto,
            nombre: producto.nombre_producto,
            precio: producto.precio,
            stock: producto.stock,
            cantidad
        });
    }
    inputCantidad.value = 1;
    pintarItems();
}

async function abrirModalPedido() {
    try {
        const [clientes, productos] = await Promise.all([api("/api/clientes"), api("/api/productos")]);
        productosDisponibles = productos.filter((p) => p.stock > 0);

        llenarSelect(
            document.getElementById("pedido-cliente"),
            clientes.map((c) => [c.id_cliente, `${c.nombre} ${c.apellido} · ${c.telefono}`]),
            "Seleccione un cliente"
        );
        llenarSelect(
            selectProducto,
            productosDisponibles.map((p) => [p.id_producto, `${p.nombre_producto} · ${pesos(p.precio)} (stock ${p.stock})`]),
            "Seleccione un producto"
        );

        formPedido.reset();
        items = [];
        pintarItems();
        modalPedido.showModal();
    } catch (error) {
        mostrarError(error);
    }
}

formPedido.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (items.length === 0) return mostrarAviso("Agregue al menos un producto al pedido", "error");

    const datos = datosFormulario(formPedido);
    try {
        const pedido = await api("/api/pedidos", "POST", {
            id_cliente: Number(datos.id_cliente),
            tipo_entrega: datos.tipo_entrega,
            productos: items.map((i) => ({ id_producto: i.id_producto, cantidad: i.cantidad }))
        });
        modalPedido.close();
        mostrarAviso(`Pedido ${codigoPedido(pedido.id_pedido)} creado por ${pesos(pedido.total)}`);
        cargarPedidos();
    } catch (error) {
        mostrarError(error);
    }
});

if (sesion) {
    filtroEstado.addEventListener("change", cargarPedidos);
    document.getElementById("btn-nuevo-pedido").addEventListener("click", abrirModalPedido);
    document.getElementById("btn-agregar-item").addEventListener("click", agregarItem);
    cargarPedidos();
}
