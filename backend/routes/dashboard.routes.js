const { Router } = require('express');
const { obtenerDashboard } = require('../controllers/dashboard.controller');

const router = Router();

router.get('/', obtenerDashboard);

module.exports = router;
