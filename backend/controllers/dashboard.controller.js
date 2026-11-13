const { pool } = require('../config/db');

const HOY = 'CURDATE()';
const INICIO_MES = "DATE_FORMAT(CURDATE(), '%Y-%m-01')";

async function obtenerDashboard(req, res, next) {
    try {
        const [
            [[ventasHoy]],
            [[pedidosActivos]],
            [productosBajoStock],
            [[ventasMes]],
            [[egresosMes]],
            [pedidosRecientes]
        ] = await Promise.all([
            pool.query(
                `SELECT COALESCE(SUM(monto_pagado), 0) AS total
                 FROM ventas
                 WHERE fecha_venta >= ${HOY} AND fecha_venta < ${HOY} + INTERVAL 1 DAY`
            ),
            pool.query(
                `SELECT COUNT(*) AS total,
                        COALESCE(SUM(estado = 'En cocina'), 0) AS en_cocina,
                        COALESCE(SUM(estado = 'En camino'), 0) AS en_camino
                 FROM pedidos
                 WHERE estado IN ('En cocina', 'En camino')`
            ),
            pool.query(
                `SELECT id_producto, nombre_producto, stock, stock_minimo
                 FROM productos
                 WHERE stock <= stock_minimo
                 ORDER BY stock ASC`
            ),
            pool.query(
                `SELECT COALESCE(SUM(monto_pagado), 0) AS total
                 FROM ventas
                 WHERE fecha_venta >= ${INICIO_MES} AND fecha_venta < ${INICIO_MES} + INTERVAL 1 MONTH`
            ),
            pool.query(
                `SELECT COALESCE(SUM(monto), 0) AS total
                 FROM egresos
                 WHERE fecha_egreso >= ${INICIO_MES} AND fecha_egreso < ${INICIO_MES} + INTERVAL 1 MONTH`
            ),
            pool.query(
                `SELECT p.id_pedido, p.fecha_pedido, p.tipo_entrega, p.total, p.estado,
                        CONCAT(c.nombre, ' ', c.apellido) AS cliente
                 FROM pedidos p
                 LEFT JOIN clientes c ON c.id_cliente = p.id_cliente
                 ORDER BY p.fecha_pedido DESC, p.id_pedido DESC
                 LIMIT 10`
            )
        ]);

        res.json({
            kpis: {
                ventasHoy: Number(ventasHoy.total),
                pedidosActivos: {
                    total: Number(pedidosActivos.total),
                    enCocina: Number(pedidosActivos.en_cocina),
                    enCamino: Number(pedidosActivos.en_camino)
                },
                productosBajoStock: productosBajoStock.length,
                utilidadNeta: {
                    ventas: Number(ventasMes.total),
                    egresos: Number(egresosMes.total),
                    total: Number(ventasMes.total) - Number(egresosMes.total)
                }
            },
            productosBajoStock,
            pedidosRecientes
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { obtenerDashboard };
