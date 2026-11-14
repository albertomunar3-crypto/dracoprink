const { Router } = require('express');
const { listarCategorias, crearCategoria } = require('../controllers/categorias.controller');

const router = Router();

router.get('/', listarCategorias);
router.post('/', crearCategoria);

module.exports = router;
