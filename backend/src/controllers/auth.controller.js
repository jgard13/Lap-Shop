const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioService = require('../services/usuario.service');
const EmailService = require('../services/email.service');

class AuthController {
  // Registrar nuevo usuario
  static async registrar(req, res) {
    try {
      const { usuario, correo, contrasena } = req.body;

      // Validaciones básicas
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

      // Encriptar la contraseña (hasheo)
      const salt = await bcrypt.genSalt(10);
      const contrasenaHasheada = await bcrypt.hash(contrasena, salt);

      // Crear el usuario con la contraseña hasheada
      const nuevoUsuario = await UsuarioService.crearUsuario(usuario, correo, contrasenaHasheada);

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

      // Validaciones básicas
      if (!usuario || !contrasena) {
        return res.status(400).json({
          success: false,
          message: 'Usuario y contraseña son requeridos'
        });
      }

      // Buscar al usuario por nombre de usuario
      // (Podríamos buscar también por correo si es que el usuario ingresa su correo en el login)
      let user = await UsuarioService.obtenerPorUsuario(usuario);
      
      // Si no existe por usuario, intentar buscar por correo
      if (!user) {
        user = await UsuarioService.obtenerPorCorreo(usuario);
      }

      // Validar si el usuario existe
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario o contraseña incorrectos'
        });
      }

      // Comparar contraseña ingresada con el hash en la BD
      const contrasenaValida = await bcrypt.compare(contrasena, user.contrasena);
      if (!contrasenaValida) {
        return res.status(401).json({
          success: false,
          message: 'Usuario o contraseña incorrectos'
        });
      }

      // Generar JWT
      // Incluimos id, usuario, correo y rol en el payload del token
      const payload = {
        id: user.id,
        usuario: user.usuario,
        correo: user.correo,
        rol: user.rol
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h' // Token expira en 24 horas
      });

      // Registrar último acceso de manera asíncrona
      // Si la tabla o el service tienen esta función la llamamos, si no, actualizamos directamente.
      // Actualmente no tiene un update de último acceso expuesto en el service, pero no es crítico
      
      res.status(200).json({
        success: true,
        message: 'Sesión iniciada correctamente',
        data: {
          id: user.id,
          usuario: user.usuario,
          correo: user.correo,
          rol: user.rol,
          token
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

  // Solicitar restablecimiento de contraseña (enviar código)
  static async solicitarRestablecimiento(req, res) {
    try {
      const { correo } = req.body;

      if (!correo) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico es requerido'
        });
      }

      // Verificar si el correo existe
      const correoExiste = await UsuarioService.correoExiste(correo);
      if (!correoExiste) {
        // Por seguridad, no decimos si el correo existe o no, o sí?
        // En aplicaciones típicas a veces se prefiere responder genéricamente.
        // Pero para esta aplicación, demos feedback directo.
        return res.status(404).json({
          success: false,
          message: 'El correo electrónico no está registrado'
        });
      }

      // Generar código aleatorio de 6 dígitos
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Expiración en 15 minutos
      const expiracion = new Date();
      expiracion.setMinutes(expiracion.getMinutes() + 15);

      // Guardar en la base de datos
      await UsuarioService.guardarCodigoRestablecimiento(correo, codigo, expiracion);

      // Enviar por correo electrónico
      await EmailService.enviarCodigoVerificacion(correo, codigo);

      res.status(200).json({
        success: true,
        message: 'Código de verificación enviado con éxito al correo'
      });
    } catch (error) {
      console.error('Error al solicitar restablecimiento de contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar la solicitud',
        error: error.message
      });
    }
  }

  // Restablecer contraseña usando el código
  static async restablecerContrasena(req, res) {
    try {
      const { correo, codigo, nuevaContrasena } = req.body;

      if (!correo || !codigo || !nuevaContrasena) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      if (nuevaContrasena.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      // Obtener el código guardado
      const registro = await UsuarioService.obtenerCodigoRestablecimiento(correo);
      if (!registro) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró solicitud de restablecimiento para este correo'
        });
      }

      // Validar código
      if (registro.codigo_restablecimiento !== codigo) {
        return res.status(400).json({
          success: false,
          message: 'El código de verificación es incorrecto'
        });
      }

      // Validar expiración
      const ahora = new Date();
      const expiracion = new Date(registro.codigo_expiracion);
      if (ahora > expiracion) {
        return res.status(400).json({
          success: false,
          message: 'El código de verificación ha expirado'
        });
      }

      // Hashear la nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const contrasenaHasheada = await bcrypt.hash(nuevaContrasena, salt);

      // Actualizar en base de datos
      await UsuarioService.restablecerContrasenaPorCorreo(correo, contrasenaHasheada);

      res.status(200).json({
        success: true,
        message: 'Tu contraseña ha sido restablecida exitosamente'
      });
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error al restablecer la contraseña',
        error: error.message
      });
    }
  }
}

module.exports = AuthController;
