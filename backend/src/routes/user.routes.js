const express = require('express');
const UserController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

const router = express.Router();

// Todas las rutas en este archivo requieren autenticación JWT
router.use(authMiddleware);

// Rutas de perfil y acciones basadas en el token JWT (Seguras)
router.get('/user/profile', UserController.getProfile);
router.put('/user/profile', UserController.updateProfile);
router.get('/user/history', UserController.getOrderHistory);

// Rutas de compatibilidad (reciben ID por parámetro) pero ahora protegidas por JWT
router.get('/usuario/:id', UserController.obtenerUsuarioCompat);
router.get('/favoritos/:id', UserController.getFavoritos);
router.get('/vistos/:id', UserController.getVistos);

// Rutas de favoritos por producto (usa el ID del token JWT)
router.get('/favorito/:computadoraId/check', UserController.checkFavorito);
router.post('/favorito/:computadoraId', UserController.agregarFavorito);
router.delete('/favorito/:computadoraId', UserController.quitarFavorito);

// Registrar un producto como visto recientemente
router.post('/visto/:computadoraId', UserController.registrarVisto);

// Rutas de Administración de Usuarios (Requieren también adminMiddleware)
router.get('/admin/usuarios', adminMiddleware, UserController.obtenerTodos);
router.put('/admin/usuarios/:id/rol', adminMiddleware, UserController.actualizarRol);
router.delete('/admin/usuarios/:id', adminMiddleware, UserController.eliminarUsuario);

module.exports = router;
