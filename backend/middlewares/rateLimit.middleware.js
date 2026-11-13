const { rateLimit } = require('express-rate-limit');

const limiteLogin = rateLimit({
    windowMs: (Number(process.env.LOGIN_VENTANA_MINUTOS) || 15) * 60 * 1000,
    limit: Number(process.env.LOGIN_MAX_INTENTOS) || 5,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { mensaje: 'Demasiados intentos fallidos. Intente de nuevo más tarde.' }
});

module.exports = { limiteLogin };
