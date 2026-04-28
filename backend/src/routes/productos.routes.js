const express = require('express');
const router = express.Router();
const { getProductos } = require('../controllers/productos.controller');
const db = require('../config/db');

// Health check para verificar conexión a BD
router.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT 1');
    res.json({ status: 'ok', message: 'Base de datos conectada' });
  } catch (error) {
    console.error('Health check error:', error.message);
    res.status(503).json({ status: 'error', message: error.message });
  }
});

router.get('/productos', getProductos);

module.exports = router;
