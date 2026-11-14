const { pool } = require('../config/db');
const { ErrorHttp, texto, idParam } = require('../utils/validacion');

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function leerCliente(body = {}) {
    const correo = texto(body.correo, 'correo', 100, { requerido: false });
    if (correo && !CORREO.test(correo)) throw new ErrorHttp(400, 'El correo no es válido');
    return {
        nombre: texto(body.nombre, 'nombre', 100),
        apellido: texto(body.apellido, 'apellido', 100),
        telefono: texto(body.telefono, 'teléfono', 20),
        correo,
        direccion: texto(body.direccion, 'dirección', 150)
    };
}

function errorCorreoDuplicado(error) {
    if (error.code === 'ER_DUP_ENTRY') return new ErrorHttp(409, 'Ya existe un cliente con ese correo');
    return error;
}

async function listarClientes(req, res, next) {
    try {
        const [clientes] = await pool.query(
            'SELECT id_cliente, nombre, apellido, telefono, correo, direccion FROM clientes ORDER BY nombre, apellido'
        );
        res.json(clientes);
    } catch (error) {
        next(error);
    }
}

async function crearCliente(req, res, next) {
    try {
        const cliente = leerCliente(req.body);
        const [resultado] = await pool.query('INSERT INTO clientes SET ?', [cliente]);
        res.status(201).json({ id_cliente: resultado.insertId, ...cliente });
    } catch (error) {
        next(errorCorreoDuplicado(error));
    }
}

async function actualizarCliente(req, res, next) {
    try {
        const id = idParam(req);
        const cliente = leerCliente(req.body);
        const [resultado] = await pool.query('UPDATE clientes SET ? WHERE id_cliente = ?', [cliente, id]);
        if (resultado.affectedRows === 0) throw new ErrorHttp(404, 'Cliente no encontrado');
        res.json({ id_cliente: id, ...cliente });
    } catch (error) {
        next(errorCorreoDuplicado(error));
    }
}

async function eliminarCliente(req, res, next) {
    try {
        const id = idParam(req);
        const [resultado] = await pool.query('DELETE FROM clientes WHERE id_cliente = ?', [id]);
        if (resultado.affectedRows === 0) throw new ErrorHttp(404, 'Cliente no encontrado');
        res.status(204).end();
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return next(new ErrorHttp(409, 'No se puede eliminar: el cliente tiene pedidos registrados'));
        }
        next(error);
    }
}

module.exports = { listarClientes, crearCliente, actualizarCliente, eliminarCliente };
