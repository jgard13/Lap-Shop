const express = require('express');
const UsuarioController = require('../controllers/usuario.controller');

const router = express.Router();

// Rutas de autenticación
router.post('/auth/registrar', UsuarioController.registrar);
router.post('/auth/iniciar-sesion', UsuarioController.iniciarSesion);

// Ruta para obtener datos del usuario
router.get('/usuario/:id', UsuarioController.obtenerUsuario);

// Rutas de favoritos e historial
router.get('/favoritos/:id', UsuarioController.obtenerFavoritos);
router.get('/vistos/:id', UsuarioController.obtenerVistos);

module.exports = router;
