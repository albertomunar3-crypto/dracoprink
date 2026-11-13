const { Router } = require('express');
const { login } = require('../controllers/auth.controller');
const { limiteLogin } = require('../middlewares/rateLimit.middleware');

const router = Router();

router.post('/login', limiteLogin, login);

module.exports = router;
