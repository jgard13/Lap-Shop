const pool = require('../config/db');

class UsuarioService {
  // Crear nuevo usuario
  static async crearUsuario(usuario, correo, contrasena) {
    const query = `
      INSERT INTO usuario (usuario, correo, contrasena)
      VALUES ($1, $2, $3)
      RETURNING id, usuario, correo
    `;
    try {
      const result = await pool.query(query, [usuario, correo, contrasena]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener usuario por email
  static async obtenerPorCorreo(correo) {
    const query = 'SELECT * FROM usuario WHERE correo = $1';
    try {
      const result = await pool.query(query, [correo]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener usuario por nombre de usuario
  static async obtenerPorUsuario(usuario) {
    const query = 'SELECT * FROM usuario WHERE usuario = $1';
    try {
      const result = await pool.query(query, [usuario]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener usuario por ID
  static async obtenerPorId(id) {
    const query = 'SELECT id, usuario, correo FROM usuario WHERE id = $1';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Validar credenciales
  static async validarCredenciales(usuario, contrasena) {
    const query = `
      SELECT id, usuario, correo FROM usuario
      WHERE usuario = $1 AND contrasena = $2
    `;
    try {
      const result = await pool.query(query, [usuario, contrasena]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Verificar si el usuario existe
  static async usuarioExiste(usuario) {
    const query = 'SELECT id FROM usuario WHERE usuario = $1';
    try {
      const result = await pool.query(query, [usuario]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Verificar si el correo existe
  static async correoExiste(correo) {
    const query = 'SELECT id FROM usuario WHERE correo = $1';
    try {
      const result = await pool.query(query, [correo]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Obtener favoritos del usuario
  static async obtenerFavoritos(usuarioId) {
    const query = `
      SELECT c.* 
      FROM computadora c
      JOIN favorito f ON c.id = f.computadora_id
      WHERE f.usuario_id = $1
    `;
    try {
      const result = await pool.query(query, [usuarioId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Obtener historial de vistos recientemente
  static async obtenerVistos(usuarioId) {
    const query = `
      SELECT c.* 
      FROM computadora c
      JOIN historial_visto h ON c.id = h.computadora_id
      WHERE h.usuario_id = $1
      ORDER BY h.fecha DESC
      LIMIT 10
    `;
    try {
      const result = await pool.query(query, [usuarioId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UsuarioService;
