const { pool } = require('../config/db');
const { texto } = require('../utils/validacion');

async function listarCategorias(req, res, next) {
    try {
        const [categorias] = await pool.query(
            `SELECT c.id_categoria, c.nombre_categoria, COUNT(p.id_producto) AS total_productos
             FROM categorias c
             LEFT JOIN productos p ON p.id_categoria = c.id_categoria
             GROUP BY c.id_categoria, c.nombre_categoria
             ORDER BY c.nombre_categoria`
        );
        res.json(categorias);
    } catch (error) {
        next(error);
    }
}

async function crearCategoria(req, res, next) {
    try {
        const nombre_categoria = texto((req.body || {}).nombre_categoria, 'nombre de la categoría', 100);
        const [resultado] = await pool.query('INSERT INTO categorias (nombre_categoria) VALUES (?)', [nombre_categoria]);
        res.status(201).json({ id_categoria: resultado.insertId, nombre_categoria, total_productos: 0 });
    } catch (error) {
        next(error);
    }
}

module.exports = { listarCategorias, crearCategoria };
