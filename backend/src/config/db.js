const { Pool } = require('pg');
require('dotenv').config();

const configPool = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
};

const conexionBD = new Pool(configPool);

conexionBD.on('error', (err) => console.error('Fallo inesperado en PostgreSQL:', err));

conexionBD.connect()
  .then(cliente => {
    cliente.release();
    console.log('PostgreSQL conectado exitosamente');
  })
  .catch(err => console.error('Fallo al enlazar a la base de datos:', err.message));

module.exports = conexionBD;
