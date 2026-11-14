const { Router } = require('express');
const { listarClientes, crearCliente, actualizarCliente, eliminarCliente } = require('../controllers/clientes.controller');

const router = Router();

router.get('/', listarClientes);
router.post('/', crearCliente);
router.put('/:id', actualizarCliente);
router.delete('/:id', eliminarCliente);

module.exports = router;
