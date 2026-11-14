const { Router } = require('express');
const { listarPedidos, crearPedido, actualizarEstado } = require('../controllers/pedidos.controller');

const router = Router();

router.get('/', listarPedidos);
router.post('/', crearPedido);
router.patch('/:id/estado', actualizarEstado);

module.exports = router;
