const express = require('express');
const AuthController = require('../controllers/auth.controller');

const router = express.Router();

// Rutas expuestas en /api/auth
router.post('/auth/registrar', AuthController.registrar);
router.post('/auth/iniciar-sesion', AuthController.iniciarSesion);
router.post('/auth/solicitar-restablecimiento', AuthController.solicitarRestablecimiento);
router.post('/auth/restablecer-contrasena', AuthController.restablecerContrasena);

module.exports = router;
