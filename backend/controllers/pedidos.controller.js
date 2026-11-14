const { pool } = require('../config/db');
const { ErrorHttp, entero, opcion, idParam } = require('../utils/validacion');

const TIPOS_ENTREGA = ['Mesa', 'Domicilio', 'Para llevar'];
const ESTADOS = ['En cocina', 'En camino', 'Entregado', 'Cancelado'];

async function listarPedidos(req, res, next) {
    try {
        const filtros = [];
        const valores = [];
        if (req.query.estado && req.query.estado !== 'Todos') {
            filtros.push('p.estado = ?');
            valores.push(opcion(req.query.estado, 'estado', ESTADOS));
        }

        const [pedidos] = await pool.query(
            `SELECT p.id_pedido, p.fecha_pedido, p.tipo_entrega, p.total, p.estado, p.id_cliente,
                    CONCAT(c.nombre, ' ', c.apellido) AS cliente,
                    (SELECT GROUP_CONCAT(CONCAT(d.cantidad, 'x ', pr.nombre_producto) ORDER BY d.id_detalle SEPARATOR ', ')
                     FROM detalle_pedido d JOIN productos pr ON pr.id_producto = d.id_producto
                     WHERE d.id_pedido = p.id_pedido) AS productos,
                    (v.id_venta IS NOT NULL) AS pagado
             FROM pedidos p
             LEFT JOIN clientes c ON c.id_cliente = p.id_cliente
             LEFT JOIN ventas v ON v.id_pedido = p.id_pedido
             ${filtros.length ? `WHERE ${filtros.join(' AND ')}` : ''}
             ORDER BY p.fecha_pedido DESC, p.id_pedido DESC`,
            valores
        );
        res.json(pedidos.map((p) => ({ ...p, pagado: Boolean(p.pagado) })));
    } catch (error) {
        next(error);
    }
}

function leerItems(productos) {
    if (!Array.isArray(productos) || productos.length === 0) {
        throw new ErrorHttp(400, 'Agregue al menos un producto al pedido');
    }
    const cantidades = new Map();
    productos.forEach((item) => {
        const id = entero(item && item.id_producto, 'producto', { min: 1 });
        const cantidad = entero(item && item.cantidad, 'cantidad', { min: 1 });
        cantidades.set(id, (cantidades.get(id) || 0) + cantidad);
    });
    return cantidades;
}

async function crearPedido(req, res, next) {
    let conexion;
    try {
        const body = req.body || {};
        const id_cliente = entero(body.id_cliente, 'cliente', { min: 1 });
        const tipo_entrega = opcion(body.tipo_entrega, 'tipo de entrega', TIPOS_ENTREGA);
        const cantidades = leerItems(body.productos);

        conexion = await pool.getConnection();
        await conexion.beginTransaction();

        const [[cliente]] = await conexion.query('SELECT id_cliente FROM clientes WHERE id_cliente = ?', [id_cliente]);
        if (!cliente) throw new ErrorHttp(400, 'El cliente seleccionado no existe');

        const [productos] = await conexion.query(
            'SELECT id_producto, nombre_producto, precio, stock FROM productos WHERE id_producto IN (?) FOR UPDATE',
            [[...cantidades.keys()]]
        );
        const porId = new Map(productos.map((p) => [p.id_producto, p]));

        const items = [...cantidades].map(([id, cantidad]) => {
            const producto = porId.get(id);
            if (!producto) throw new ErrorHttp(400, `El producto ${id} no existe`);
            if (producto.stock < cantidad) {
                throw new ErrorHttp(409, `Stock insuficiente de ${producto.nombre_producto}: disponible ${producto.stock}, solicitado ${cantidad}`);
            }
            return { id_producto: id, cantidad, precio_unitario: producto.precio, subtotal: Math.round(producto.precio * cantidad * 100) / 100 };
        });
        const total = Math.round(items.reduce((suma, item) => suma + item.subtotal, 0) * 100) / 100;

        const [pedido] = await conexion.query(
            'INSERT INTO pedidos (tipo_entrega, total, estado, id_cliente, id_usuario) VALUES (?, ?, ?, ?, ?)',
            [tipo_entrega, total, 'En cocina', id_cliente, req.usuario.id_usuario]
        );
        await conexion.query(
            'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES ?',
            [items.map((i) => [pedido.insertId, i.id_producto, i.cantidad, i.precio_unitario, i.subtotal])]
        );
        for (const item of items) {
            await conexion.query('UPDATE productos SET stock = stock - ? WHERE id_producto = ?', [item.cantidad, item.id_producto]);
        }

        await conexion.commit();
        res.status(201).json({ id_pedido: pedido.insertId, total, estado: 'En cocina' });
    } catch (error) {
        if (conexion) await conexion.rollback();
        next(error);
    } finally {
        if (conexion) conexion.release();
    }
}

async function actualizarEstado(req, res, next) {
    let conexion;
    try {
        const id = idParam(req);
        const estado = opcion((req.body || {}).estado, 'estado', ESTADOS);

        conexion = await pool.getConnection();
        await conexion.beginTransaction();

        const [[pedido]] = await conexion.query(
            `SELECT p.estado, (v.id_venta IS NOT NULL) AS pagado
             FROM pedidos p LEFT JOIN ventas v ON v.id_pedido = p.id_pedido
             WHERE p.id_pedido = ? FOR UPDATE`,
            [id]
        );
        if (!pedido) throw new ErrorHttp(404, 'Pedido no encontrado');
        if (pedido.estado !== estado) {
            if (pedido.pagado) throw new ErrorHttp(409, 'El pedido ya fue cobrado y no puede cambiar de estado');
            if (pedido.estado === 'Cancelado') throw new ErrorHttp(409, 'Un pedido cancelado no puede reactivarse');

            // Al cancelar, los productos vuelven al inventario.
            if (estado === 'Cancelado') {
                await conexion.query(
                    `UPDATE productos pr
                     JOIN (SELECT id_producto, SUM(cantidad) AS cantidad FROM detalle_pedido
                           WHERE id_pedido = ? GROUP BY id_producto) d ON d.id_producto = pr.id_producto
                     SET pr.stock = pr.stock + d.cantidad`,
                    [id]
                );
            }
            await conexion.query('UPDATE pedidos SET estado = ? WHERE id_pedido = ?', [estado, id]);
        }

        await conexion.commit();
        res.json({ id_pedido: id, estado });
    } catch (error) {
        if (conexion) await conexion.rollback();
        next(error);
    } finally {
        if (conexion) conexion.release();
    }
}

module.exports = { listarPedidos, crearPedido, actualizarEstado };
