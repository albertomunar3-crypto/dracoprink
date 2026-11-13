const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const [esquema, token] = (req.headers.authorization || '').split(' ');

    if (esquema !== 'Bearer' || !token) {
        return res.status(401).json({ mensaje: 'Debe iniciar sesión' });
    }

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        next();
    } catch (error) {
        res.status(401).json({ mensaje: 'Sesión inválida o expirada' });
    }
}

module.exports = { verificarToken };
