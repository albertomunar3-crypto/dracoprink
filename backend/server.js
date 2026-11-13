require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');
const cors = require('cors');

const { verificarConexion } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const origenes = (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim());

app.use(cors({ origin: origenes.includes('*') ? '*' : origenes }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', (req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ mensaje: 'JSON inválido' });
    }
    console.error(err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
});

async function iniciar() {
    try {
        await verificarConexion();
        console.log('Conexión a MySQL establecida');
    } catch (error) {
        console.error('No se pudo conectar a MySQL:', error.message);
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`DracoPrink disponible en http://localhost:${PORT}`);
    });
}

iniciar();
