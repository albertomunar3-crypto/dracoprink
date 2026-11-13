const mysql = require('mysql2/promise');

const timezone = process.env.DB_TIMEZONE || '-05:00';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dracoprink_bd',
    waitForConnections: true,
    connectionLimit: 10,
    timezone,
    dateStrings: true,
    decimalNumbers: true
});

pool.pool.on('connection', (conexion) => {
    conexion.query('SET time_zone = ?', [timezone]);
});

async function verificarConexion() {
    const conexion = await pool.getConnection();
    try {
        await conexion.ping();
    } finally {
        conexion.release();
    }
}

module.exports = { pool, verificarConexion };
