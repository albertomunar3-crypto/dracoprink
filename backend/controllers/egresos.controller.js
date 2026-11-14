const { pool } = require('../config/db');
const { texto, dinero, opcion } = require('../utils/validacion');

const CATEGORIAS_GASTO = ['Insumos', 'Servicios', 'Nomina', 'Domicilios', 'Otros'];

async function listarEgresos(req, res, next) {
    try {
        const [egresos] = await pool.query(
            `SELECT e.id_egreso, e.fecha_egreso, e.concepto, e.categoria_gasto, e.monto, u.nombre_usuario AS usuario
             FROM egresos e
             LEFT JOIN usuarios u ON u.id_usuario = e.id_usuario
             ORDER BY e.fecha_egreso DESC, e.id_egreso DESC`
        );
        res.json(egresos);
    } catch (error) {
        next(error);
    }
}

async function registrarEgreso(req, res, next) {
    try {
        const body = req.body || {};
        const egreso = {
            concepto: texto(body.concepto, 'concepto', 150),
            categoria_gasto: opcion(body.categoria_gasto, 'categoría del gasto', CATEGORIAS_GASTO),
            monto: dinero(body.monto, 'monto', { min: 0.01 }),
            id_usuario: req.usuario.id_usuario
        };
        const [resultado] = await pool.query('INSERT INTO egresos SET ?', [egreso]);
        res.status(201).json({ id_egreso: resultado.insertId, ...egreso });
    } catch (error) {
        next(error);
    }
}

module.exports = { listarEgresos, registrarEgreso };
