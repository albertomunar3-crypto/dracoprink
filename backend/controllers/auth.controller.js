const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

async function login(req, res, next) {
    try {
        const { usuario, password } = req.body || {};

        if (typeof usuario !== 'string' || typeof password !== 'string' || !usuario.trim() || !password) {
            return res.status(400).json({ mensaje: 'Debe completar todos los campos' });
        }

        const [filas] = await pool.query(
            'SELECT id_usuario, nombre_usuario, contrasena, rol FROM usuarios WHERE nombre_usuario = ? LIMIT 1',
            [usuario.trim()]
        );
        const encontrado = filas[0];

        const valido = encontrado && await bcrypt.compare(password, encontrado.contrasena);
        if (!valido) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const usuarioSesion = {
            id_usuario: encontrado.id_usuario,
            nombre_usuario: encontrado.nombre_usuario,
            rol: encontrado.rol
        };
        const token = jwt.sign(usuarioSesion, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '8h'
        });

        res.json({ token, usuario: usuarioSesion });
    } catch (error) {
        next(error);
    }
}

module.exports = { login };
