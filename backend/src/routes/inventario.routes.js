const express = require('express');
const router = express.Router();
const InventarioController = require('../controllers/inventario.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Todas las rutas de inventario requieren estar autenticado y tener rol admin
router.use(authMiddleware, adminMiddleware);

router.get('/', InventarioController.obtenerProductos);
router.post('/', InventarioController.crearProducto);
router.put('/:id', InventarioController.actualizarProducto);
router.delete('/:id', InventarioController.borradoVirtualProducto);

module.exports = router;
