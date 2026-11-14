const cuerpoProductos = document.getElementById("tabla-productos");
const cuerpoCategorias = document.getElementById("tabla-categorias");
const modalProducto = document.getElementById("modal-producto");
const formProducto = document.getElementById("form-producto");
const formCategoria = document.getElementById("form-categoria");
const buscadorProductos = document.getElementById("buscar-producto");

let productos = [];
let categorias = [];
let productoEditando = null;

function pintarProductos() {
    const termino = buscadorProductos.value.trim().toLowerCase();
    const filtrados = productos.filter((p) =>
        `${p.nombre_producto} ${p.nombre_categoria || ""}`.toLowerCase().includes(termino)
    );

    document.getElementById("kpi-total-productos").textContent = productos.length;
    document.getElementById("kpi-bajo-stock").textContent = productos.filter((p) => p.bajo_stock).length;

    if (filtrados.length === 0) {
        mensajeTabla(cuerpoProductos, termino ? "Ningún producto coincide con la búsqueda" : "No hay productos registrados", 8);
        return;
    }

    cuerpoProductos.replaceChildren(...filtrados.map((producto) => {
        const acciones = document.createElement("div");
        acciones.className = "acciones";
        acciones.append(
            boton("Editar", "secundario pequeno", () => abrirModalProducto(producto)),
            boton("Eliminar", "peligro pequeno", () => eliminarProducto(producto))
        );

        const fila = document.createElement("tr");
        fila.classList.toggle("fila-alerta", producto.bajo_stock);
        fila.append(
            celda(producto.id_producto),
            celda(producto.nombre_producto),
            celda(producto.nombre_categoria || "Sin categoría"),
            celda(pesos(producto.precio)),
            celda(producto.stock),
            celda(producto.stock_minimo),
            celda(producto.bajo_stock ? badge("Bajo stock", "stock-bajo") : badge("OK", "stock-ok")),
            celda(acciones)
        );
        return fila;
    }));
}

function pintarCategorias() {
    document.getElementById("kpi-categorias").textContent = categorias.length;
    llenarSelect(
        document.getElementById("producto-categoria"),
        categorias.map((c) => [c.id_categoria, c.nombre_categoria]),
        "Sin categoría"
    );

    if (categorias.length === 0) {
        mensajeTabla(cuerpoCategorias, "No hay categorías registradas", 3);
        return;
    }
    cuerpoCategorias.replaceChildren(...categorias.map((categoria) => {
        const fila = document.createElement("tr");
        fila.append(celda(categoria.id_categoria), celda(categoria.nombre_categoria), celda(categoria.total_productos));
        return fila;
    }));
}

async function cargarInventario() {
    try {
        [productos, categorias] = await Promise.all([api("/api/productos"), api("/api/categorias")]);
        pintarProductos();
        pintarCategorias();
    } catch (error) {
        mensajeTabla(cuerpoProductos, "No se pudo cargar el inventario", 8);
        mostrarError(error);
    }
}

function abrirModalProducto(producto = null) {
    productoEditando = producto;
    formProducto.reset();
    document.getElementById("titulo-modal-producto").textContent = producto ? "Editar Producto" : "Nuevo Producto";
    if (producto) {
        ["nombre_producto", "precio", "stock", "stock_minimo", "descripcion"].forEach((campo) => {
            formProducto.elements[campo].value = producto[campo] ?? "";
        });
        formProducto.elements.id_categoria.value = producto.id_categoria ?? "";
    }
    modalProducto.showModal();
}

async function eliminarProducto(producto) {
    if (!confirm(`¿Eliminar el producto "${producto.nombre_producto}"?`)) return;
    try {
        await api(`/api/productos/${producto.id_producto}`, "DELETE");
        mostrarAviso("Producto eliminado");
        cargarInventario();
    } catch (error) {
        mostrarError(error);
    }
}

formProducto.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    try {
        const datos = datosFormulario(formProducto);
        if (productoEditando) {
            await api(`/api/productos/${productoEditando.id_producto}`, "PUT", datos);
            mostrarAviso("Producto actualizado");
        } else {
            await api("/api/productos", "POST", datos);
            mostrarAviso("Producto creado");
        }
        modalProducto.close();
        cargarInventario();
    } catch (error) {
        mostrarError(error);
    }
});

formCategoria.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    try {
        await api("/api/categorias", "POST", datosFormulario(formCategoria));
        formCategoria.reset();
        mostrarAviso("Categoría creada");
        cargarInventario();
    } catch (error) {
        mostrarError(error);
    }
});

if (sesion) {
    buscadorProductos.addEventListener("input", pintarProductos);
    document.getElementById("btn-nuevo-producto").addEventListener("click", () => abrirModalProducto());
    cargarInventario();
}
