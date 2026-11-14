const cuerpoClientes = document.getElementById("tabla-clientes");
const modalCliente = document.getElementById("modal-cliente");
const formCliente = document.getElementById("form-cliente");
const buscadorClientes = document.getElementById("buscar-cliente");

let clientes = [];
let clienteEditando = null;

function normalizar(texto) {
    return (texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function pintarClientes() {
    const termino = normalizar(buscadorClientes.value.trim());
    const filtrados = clientes.filter((c) =>
        normalizar(`${c.nombre} ${c.apellido}`).includes(termino) || c.telefono.includes(termino)
    );
    document.getElementById("total-clientes").textContent = clientes.length;

    if (filtrados.length === 0) {
        mensajeTabla(cuerpoClientes, termino ? "Ningún cliente coincide con la búsqueda" : "No hay clientes registrados", 6);
        return;
    }

    cuerpoClientes.replaceChildren(...filtrados.map((cliente) => {
        const acciones = document.createElement("div");
        acciones.className = "acciones";
        acciones.append(
            boton("Editar", "secundario pequeno", () => abrirModalCliente(cliente)),
            boton("Eliminar", "peligro pequeno", () => eliminarCliente(cliente))
        );

        const fila = document.createElement("tr");
        fila.append(
            celda(cliente.id_cliente),
            celda(`${cliente.nombre} ${cliente.apellido}`),
            celda(cliente.telefono),
            celda(cliente.correo || "—"),
            celda(cliente.direccion),
            celda(acciones)
        );
        return fila;
    }));
}

async function cargarClientes() {
    try {
        clientes = await api("/api/clientes");
        pintarClientes();
    } catch (error) {
        mensajeTabla(cuerpoClientes, "No se pudieron cargar los clientes", 6);
        mostrarError(error);
    }
}

function abrirModalCliente(cliente = null) {
    clienteEditando = cliente;
    formCliente.reset();
    document.getElementById("titulo-modal-cliente").textContent = cliente ? "Editar Cliente" : "Nuevo Cliente";
    if (cliente) {
        ["nombre", "apellido", "telefono", "correo", "direccion"].forEach((campo) => {
            formCliente.elements[campo].value = cliente[campo] || "";
        });
    }
    modalCliente.showModal();
}

async function eliminarCliente(cliente) {
    if (!confirm(`¿Eliminar a ${cliente.nombre} ${cliente.apellido}?`)) return;
    try {
        await api(`/api/clientes/${cliente.id_cliente}`, "DELETE");
        mostrarAviso("Cliente eliminado");
        cargarClientes();
    } catch (error) {
        mostrarError(error);
    }
}

formCliente.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    try {
        const datos = datosFormulario(formCliente);
        if (clienteEditando) {
            await api(`/api/clientes/${clienteEditando.id_cliente}`, "PUT", datos);
            mostrarAviso("Cliente actualizado");
        } else {
            await api("/api/clientes", "POST", datos);
            mostrarAviso("Cliente registrado");
        }
        modalCliente.close();
        cargarClientes();
    } catch (error) {
        mostrarError(error);
    }
});

if (sesion) {
    buscadorClientes.addEventListener("input", pintarClientes);
    document.getElementById("btn-nuevo-cliente").addEventListener("click", () => abrirModalCliente());
    cargarClientes();
}
