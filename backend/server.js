require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');
const cors = require('cors');

const { verificarConexion } = require('./config/db');
const { verificarToken } = require('./middlewares/auth.middleware');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const origenes = (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim());

app.use(cors({ origin: origenes.includes('*') ? '*' : origenes }));
app.use(express.json());

app.use('/api/auth', authRoutes);

// Toda ruta de /api registrada después de esta línea exige un token válido.
app.use('/api', verificarToken);
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
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'cambiar_por_una_clave_larga_y_aleatoria') {
        console.error('Configure una JWT_SECRET propia en el archivo .env');
        process.exit(1);
    }

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
