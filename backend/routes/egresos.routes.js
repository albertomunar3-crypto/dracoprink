const { Router } = require('express');
const { listarEgresos, registrarEgreso } = require('../controllers/egresos.controller');

const router = Router();

router.get('/', listarEgresos);
router.post('/', registrarEgreso);

module.exports = router;
