const { Router } = require('express');
const { listarVentas, listarPendientes, obtenerResumen, registrarVenta } = require('../controllers/ventas.controller');

const router = Router();

router.get('/', listarVentas);
router.get('/pendientes', listarPendientes);
router.get('/resumen', obtenerResumen);
router.post('/', registrarVenta);

module.exports = router;
