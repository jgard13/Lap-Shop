const express = require('express');
const db = require('../config/db');
const { getProductos } = require('../controllers/productos.controller');

const rutas = express.Router();

rutas.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', message: 'Base de datos conectada' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

rutas.get('/productos', getProductos);

module.exports = rutas;
