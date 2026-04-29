const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const rootEnvPath = path.resolve(__dirname, '../../.env');
const backendEnvPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: fs.existsSync(rootEnvPath) ? rootEnvPath : backendEnvPath });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Error no capturado en el pool de BD:', err);
});

pool.connect()
  .then(client => {
    client.release();
    console.log('✓ Conexión exitosa a PostgreSQL');
  })
  .catch(err => {
    console.error('✗ Error al conectar a PostgreSQL:', err.message);
    console.error('  Host:', process.env.DB_HOST);
    console.error('  Puerto:', process.env.DB_PORT);
    console.error('  Usuario:', process.env.DB_USER);
    console.error('  Base de datos:', process.env.DB_NAME);
  });

module.exports = pool;
