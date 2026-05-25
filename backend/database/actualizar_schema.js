const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function run() {
  try {
    const client = await pool.connect();
    console.log('Modificando la tabla usuario...');
    
    await client.query(`
      ALTER TABLE usuario 
      ADD COLUMN IF NOT EXISTS codigo_restablecimiento VARCHAR(6),
      ADD COLUMN IF NOT EXISTS codigo_expiracion TIMESTAMP;
    `);
    
    console.log('Columnas agregadas exitosamente (o ya existian).');
    client.release();
  } catch (error) {
    console.error('Error al actualizar esquema:', error.message);
  } finally {
    await pool.end();
  }
}

run();
