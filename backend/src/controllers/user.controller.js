const bcrypt = require('bcryptjs');
const UsuarioService = require('../services/usuario.service');

class UserController {
  // Obtener perfil del usuario autenticado
  static async getProfile(req, res) {
    try {
      // El ID viene del payload decodificado del JWT en authMiddleware (req.user)
      const userId = req.user.id;
      
      const user = await UsuarioService.obtenerPorId(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil',
        error: error.message
      });
    }
  }

  // Actualizar perfil del usuario autenticado
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { usuario, correo, contrasena } = req.body;

      // Validaciones básicas
      if (!usuario || !correo) {
        return res.status(400).json({
          success: false,
          message: 'Nombre de usuario y correo son requeridos'
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

      // Validar si el nuevo usuario ya está tomado por OTRO usuario
      const existingUserByName = await UsuarioService.obtenerPorUsuario(usuario);
      if (existingUserByName && existingUserByName.id !== userId) {
        return res.status(409).json({
          success: false,
          message: 'El nombre de usuario ya está en uso por otra cuenta'
        });
      }

      // Validar si el nuevo correo ya está tomado por OTRO usuario
      const existingUserByEmail = await UsuarioService.obtenerPorCorreo(correo);
      if (existingUserByEmail && existingUserByEmail.id !== userId) {
        return res.status(409).json({
          success: false,
          message: 'El correo electrónico ya está en uso por otra cuenta'
        });
      }

      let contrasenaHasheada = null;
      if (contrasena && contrasena.trim() !== '') {
        // Validar longitud de la nueva contraseña
        if (contrasena.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 6 caracteres'
          });
        }
        // Hashear nueva contraseña
        const salt = await bcrypt.genSalt(10);
        contrasenaHasheada = await bcrypt.hash(contrasena, salt);
      }

      // Actualizar en base de datos
      const usuarioActualizado = await UsuarioService.actualizarUsuario(
        userId, 
        usuario, 
        correo, 
        contrasenaHasheada
      );

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: usuarioActualizado
      });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar perfil',
        error: error.message
      });
    }
  }

  // Obtener historial de pedidos
  static async getOrderHistory(req, res) {
    try {
      const userId = req.user.id;
      
      const historial = await UsuarioService.obtenerHistorialPedidos(userId);
      
      res.status(200).json({
        success: true,
        data: historial
      });
    } catch (error) {
      console.error('Error al obtener historial de pedidos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial de pedidos',
        error: error.message
      });
    }
  }

  // Compatibilidad: Obtener datos de usuario por parámetro ID
  static async obtenerUsuarioCompat(req, res) {
    try {
      const { id } = req.params;
      
      // Seguridad: Asegurar que un usuario solo pueda consultar su propio ID
      if (req.user.id !== Number(id)) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. No puedes consultar el perfil de otro usuario.'
        });
      }

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
      console.error('Error al obtener usuario compat:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuario',
        error: error.message
      });
    }
  }

  // Compatibilidad: Obtener favoritos del usuario por parámetro ID
  static async getFavoritos(req, res) {
    try {
      const { id } = req.params;
      
      // Seguridad: Asegurar que un usuario solo consulte sus propios favoritos
      if (req.user.id !== Number(id)) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado.'
        });
      }

      const favoritos = await UsuarioService.obtenerFavoritos(id);
      res.status(200).json(favoritos);
    } catch (error) {
      console.error('Error al obtener favoritos compat:', error);
      res.status(500).json({ error: 'Error al obtener favoritos' });
    }
  }

  // Compatibilidad: Obtener historial de vistos por parámetro ID
  static async getVistos(req, res) {
    try {
      const { id } = req.params;
      
      // Seguridad: Asegurar que un usuario solo consulte su propio historial de vistos
      if (req.user.id !== Number(id)) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado.'
        });
      }

      const vistos = await UsuarioService.obtenerVistos(id);
      res.status(200).json(vistos);
    } catch (error) {
      console.error('Error al obtener historial visto compat:', error);
      res.status(500).json({ error: 'Error al obtener historial' });
    }
  }

  // Verificar si un producto es favorito del usuario
  static async checkFavorito(req, res) {
    try {
      const userId = req.user.id;
      const { computadoraId } = req.params;
      const esFav = await UsuarioService.esFavorito(userId, Number(computadoraId));
      res.status(200).json({ esFavorito: esFav });
    } catch (error) {
      console.error('Error al verificar favorito:', error);
      res.status(500).json({ error: 'Error al verificar favorito' });
    }
  }

  // Agregar un producto a favoritos
  static async agregarFavorito(req, res) {
    try {
      const userId = req.user.id;
      const { computadoraId } = req.params;
      await UsuarioService.agregarFavorito(userId, Number(computadoraId));
      res.status(200).json({ success: true, message: 'Favorito agregado' });
    } catch (error) {
      console.error('Error al agregar favorito:', error);
      res.status(500).json({ error: 'Error al agregar favorito' });
    }
  }

  // Quitar un producto de favoritos
  static async quitarFavorito(req, res) {
    try {
      const userId = req.user.id;
      const { computadoraId } = req.params;
      await UsuarioService.quitarFavorito(userId, Number(computadoraId));
      res.status(200).json({ success: true, message: 'Favorito eliminado' });
    } catch (error) {
      console.error('Error al quitar favorito:', error);
      res.status(500).json({ error: 'Error al quitar favorito' });
    }
  }

  // Registrar un producto como visto recientemente
  static async registrarVisto(req, res) {
    try {
      const userId = req.user.id;
      const { computadoraId } = req.params;
      await UsuarioService.registrarVisto(userId, Number(computadoraId));
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error al registrar visto:', error);
      res.status(500).json({ error: 'Error al registrar visto' });
    }
  }
}

module.exports = UserController;
