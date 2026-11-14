const { pool } = require('../config/db');
const { ErrorHttp, texto, entero, dinero, idParam } = require('../utils/validacion');

function leerProducto(body = {}) {
    return {
        nombre_producto: texto(body.nombre_producto, 'nombre del producto', 100),
        precio: dinero(body.precio, 'precio'),
        stock: entero(body.stock, 'stock'),
        stock_minimo: entero(body.stock_minimo, 'stock mínimo'),
        descripcion: texto(body.descripcion, 'descripción', 1000, { requerido: false }),
        id_categoria: entero(body.id_categoria, 'categoría', { min: 1, requerido: false })
    };
}

function errorCategoria(error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return new ErrorHttp(400, 'La categoría seleccionada no existe');
    return error;
}

async function listarProductos(req, res, next) {
    try {
        const [productos] = await pool.query(
            `SELECT p.id_producto, p.nombre_producto, p.precio, p.stock, p.stock_minimo, p.descripcion,
                    p.id_categoria, c.nombre_categoria, (p.stock <= p.stock_minimo) AS bajo_stock
             FROM productos p
             LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
             ORDER BY p.nombre_producto`
        );
        res.json(productos.map((p) => ({ ...p, bajo_stock: Boolean(p.bajo_stock) })));
    } catch (error) {
        next(error);
    }
}

async function crearProducto(req, res, next) {
    try {
        const producto = leerProducto(req.body);
        const [resultado] = await pool.query('INSERT INTO productos SET ?', [producto]);
        res.status(201).json({ id_producto: resultado.insertId, ...producto });
    } catch (error) {
        next(errorCategoria(error));
    }
}

async function actualizarProducto(req, res, next) {
    try {
        const id = idParam(req);
        const producto = leerProducto(req.body);
        const [resultado] = await pool.query('UPDATE productos SET ? WHERE id_producto = ?', [producto, id]);
        if (resultado.affectedRows === 0) throw new ErrorHttp(404, 'Producto no encontrado');
        res.json({ id_producto: id, ...producto });
    } catch (error) {
        next(errorCategoria(error));
    }
}

async function eliminarProducto(req, res, next) {
    try {
        const id = idParam(req);
        const [resultado] = await pool.query('DELETE FROM productos WHERE id_producto = ?', [id]);
        if (resultado.affectedRows === 0) throw new ErrorHttp(404, 'Producto no encontrado');
        res.status(204).end();
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return next(new ErrorHttp(409, 'No se puede eliminar: el producto aparece en pedidos registrados'));
        }
        next(error);
    }
}

module.exports = { listarProductos, crearProducto, actualizarProducto, eliminarProducto };
