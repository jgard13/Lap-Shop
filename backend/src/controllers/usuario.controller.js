const UsuarioService = require('../services/usuario.service');

class UsuarioController {
  // Registrar nuevo usuario
  static async registrar(req, res) {
    try {
      const { usuario, correo, contrasena } = req.body;

      // Validaciones
      if (!usuario || !correo || !contrasena) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      // Validar formato de correo
      const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regexCorreo.test(correo)) {
        return res.status(400).json({
          success: false,
          message: 'Correo electrónico inválido'
        });
      }

      // Validar longitud de contraseña
      if (contrasena.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Verificar si el usuario ya existe
      const usuarioExistente = await UsuarioService.usuarioExiste(usuario);
      if (usuarioExistente) {
        return res.status(409).json({
          success: false,
          message: 'El nombre de usuario ya está registrado'
        });
      }

      // Verificar si el correo ya existe
      const correoExistente = await UsuarioService.correoExiste(correo);
      if (correoExistente) {
        return res.status(409).json({
          success: false,
          message: 'El correo electrónico ya está registrado'
        });
      }

      // Crear usuario
      const nuevoUsuario = await UsuarioService.crearUsuario(usuario, correo, contrasena);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: nuevoUsuario
      });
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar usuario',
        error: error.message
      });
    }
  }

  // Iniciar sesión
  static async iniciarSesion(req, res) {
    try {
      const { usuario, contrasena } = req.body;

      // Validaciones
      if (!usuario || !contrasena) {
        return res.status(400).json({
          success: false,
          message: 'Usuario y contraseña son requeridos'
        });
      }

      // Validar credenciales
      const usuarioValido = await UsuarioService.validarCredenciales(usuario, contrasena);

      if (!usuarioValido) {
        return res.status(401).json({
          success: false,
          message: 'Usuario o contraseña incorrectos'
        });
      }

      // Aquí podrías generar un JWT u otra forma de autenticación
      res.status(200).json({
        success: true,
        message: 'Sesión iniciada correctamente',
        data: {
          id: usuarioValido.id,
          usuario: usuarioValido.usuario,
          correo: usuarioValido.correo
        }
      });
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión',
        error: error.message
      });
    }
  }

  // Obtener datos del usuario
  static async obtenerUsuario(req, res) {
    try {
      const { id } = req.params;

      const usuario = await UsuarioService.obtenerPorId(id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: usuario
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuario',
        error: error.message
      });
    }
  }

  // Obtener favoritos del usuario
  static async obtenerFavoritos(req, res) {
    try {
      const { id } = req.params;
      const favoritos = await UsuarioService.obtenerFavoritos(id);
      res.status(200).json(favoritos);
    } catch (error) {
      console.error('Error al obtener favoritos:', error);
      res.status(500).json({ error: 'Error al obtener favoritos' });
    }
  }

  // Obtener vistos recientemente
  static async obtenerVistos(req, res) {
    try {
      const { id } = req.params;
      const vistos = await UsuarioService.obtenerVistos(id);
      res.status(200).json(vistos);
    } catch (error) {
      console.error('Error al obtener historial:', error);
      res.status(500).json({ error: 'Error al obtener historial' });
    }
  }
}

module.exports = UsuarioController;
