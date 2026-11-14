const { pool } = require('../config/db');
const { ErrorHttp, entero, dinero, opcion } = require('../utils/validacion');

const METODOS_PAGO = ['Efectivo', 'Nequi', 'Daviplata', 'Tarjeta'];
const PERIODOS = {
    mes: (columna) => `WHERE ${columna} >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                       AND ${columna} < DATE_FORMAT(CURDATE(), '%Y-%m-01') + INTERVAL 1 MONTH`,
    todo: () => ''
};

async function listarVentas(req, res, next) {
    try {
        const [ventas] = await pool.query(
            `SELECT v.id_venta, v.id_pedido, v.fecha_venta, v.metodo_pago, v.monto_pagado,
                    CONCAT(c.nombre, ' ', c.apellido) AS cliente, u.nombre_usuario AS usuario
             FROM ventas v
             JOIN pedidos p ON p.id_pedido = v.id_pedido
             LEFT JOIN clientes c ON c.id_cliente = p.id_cliente
             LEFT JOIN usuarios u ON u.id_usuario = v.id_usuario
             ORDER BY v.fecha_venta DESC, v.id_venta DESC`
        );
        res.json(ventas);
    } catch (error) {
        next(error);
    }
}

async function listarPendientes(req, res, next) {
    try {
        const [pedidos] = await pool.query(
            `SELECT p.id_pedido, p.fecha_pedido, p.tipo_entrega, p.total,
                    CONCAT(c.nombre, ' ', c.apellido) AS cliente
             FROM pedidos p
             LEFT JOIN clientes c ON c.id_cliente = p.id_cliente
             LEFT JOIN ventas v ON v.id_pedido = p.id_pedido
             WHERE p.estado = 'Entregado' AND v.id_venta IS NULL
             ORDER BY p.fecha_pedido, p.id_pedido`
        );
        res.json(pedidos);
    } catch (error) {
        next(error);
    }
}

async function obtenerResumen(req, res, next) {
    try {
        const periodo = req.query.periodo === 'todo' ? 'todo' : 'mes';
        const filtro = PERIODOS[periodo];
        const [[[ingresos]], [[egresos]]] = await Promise.all([
            pool.query(`SELECT COALESCE(SUM(monto_pagado), 0) AS total FROM ventas ${filtro('fecha_venta')}`),
            pool.query(`SELECT COALESCE(SUM(monto), 0) AS total FROM egresos ${filtro('fecha_egreso')}`)
        ]);
        res.json({
            periodo,
            ingresos: Number(ingresos.total),
            egresos: Number(egresos.total),
            utilidad: Number(ingresos.total) - Number(egresos.total)
        });
    } catch (error) {
        next(error);
    }
}

async function registrarVenta(req, res, next) {
    let conexion;
    try {
        const body = req.body || {};
        const id_pedido = entero(body.id_pedido, 'pedido', { min: 1 });
        const metodo_pago = opcion(body.metodo_pago, 'método de pago', METODOS_PAGO);
        const monto_pagado = dinero(body.monto_pagado, 'monto pagado', { min: 0.01 });

        conexion = await pool.getConnection();
        await conexion.beginTransaction();

        const [[pedido]] = await conexion.query(
            'SELECT estado, total FROM pedidos WHERE id_pedido = ? FOR UPDATE',
            [id_pedido]
        );
        if (!pedido) throw new ErrorHttp(404, 'Pedido no encontrado');
        if (pedido.estado !== 'Entregado') throw new ErrorHttp(409, 'Solo se pueden cobrar pedidos entregados');
        if (monto_pagado < pedido.total) {
            throw new ErrorHttp(400, 'El monto pagado no puede ser menor al total del pedido');
        }

        const [resultado] = await conexion.query(
            'INSERT INTO ventas (id_pedido, metodo_pago, monto_pagado, id_usuario) VALUES (?, ?, ?, ?)',
            [id_pedido, metodo_pago, monto_pagado, req.usuario.id_usuario]
        );
        await conexion.commit();
        res.status(201).json({ id_venta: resultado.insertId, id_pedido, metodo_pago, monto_pagado });
    } catch (error) {
        if (conexion) await conexion.rollback();
        if (error.code === 'ER_DUP_ENTRY') return next(new ErrorHttp(409, 'Este pedido ya fue cobrado'));
        next(error);
    } finally {
        if (conexion) conexion.release();
    }
}

module.exports = { listarVentas, listarPendientes, obtenerResumen, registrarVenta };
