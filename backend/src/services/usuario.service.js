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

  // Actualizar datos del usuario
  static async actualizarUsuario(id, usuario, correo, contrasenaHasheada = null) {
    let query;
    let params;

    if (contrasenaHasheada) {
      query = `
        UPDATE usuario 
        SET usuario = $1, correo = $2, contrasena = $3
        WHERE id = $4
        RETURNING id, usuario, correo
      `;
      params = [usuario, correo, contrasenaHasheada, id];
    } else {
      query = `
        UPDATE usuario 
        SET usuario = $1, correo = $2
        WHERE id = $3
        RETURNING id, usuario, correo
      `;
      params = [usuario, correo, id];
    }

    try {
      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Crear un nuevo pedido con sus items asociados (Transacción atómica)
  static async crearPedido(usuarioId, paypalOrderId, total, items) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insertar el Pedido
      const insertPedidoQuery = `
        INSERT INTO pedido (usuario_id, paypal_order_id, total)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const pedidoResult = await client.query(insertPedidoQuery, [usuarioId, paypalOrderId, total]);
      const pedidoId = pedidoResult.rows[0].id;

      // 2. Insertar cada Item del Pedido
      const insertItemQuery = `
        INSERT INTO pedido_item (pedido_id, computadora_id, nombre, precio, cantidad)
        VALUES ($1, $2, $3, $4, $5)
      `;

      for (const item of items) {
        const computadoraId = item.id || null;
        const nombre = item.nombre || item.name || 'Laptop';
        const precio = item.precio || item.price || 0;
        const cantidad = item.cantidad || 1;

        await client.query(insertItemQuery, [pedidoId, computadoraId, nombre, precio, cantidad]);
      }

      await client.query('COMMIT');
      return pedidoId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Obtener historial de pedidos completo de un usuario
  static async obtenerHistorialPedidos(usuarioId) {
    const query = `
      SELECT p.id as pedido_id, p.paypal_order_id, p.total, p.moneda, p.estado, p.fecha_pedido,
             pi.id as item_id, pi.computadora_id, pi.nombre as item_nombre, pi.precio as item_precio, pi.cantidad as item_cantidad
      FROM pedido p
      LEFT JOIN pedido_item pi ON p.id = pi.pedido_id
      WHERE p.usuario_id = $1
      ORDER BY p.fecha_pedido DESC
    `;
    try {
      const result = await pool.query(query, [usuarioId]);
      
      // Agrupar filas por ID de pedido
      const pedidosMap = new Map();
      
      for (const row of result.rows) {
        if (!pedidosMap.has(row.pedido_id)) {
          pedidosMap.set(row.pedido_id, {
            id: row.pedido_id,
            paypal_order_id: row.paypal_order_id,
            total: Number(row.total),
            moneda: row.moneda,
            estado: row.estado,
            fecha_pedido: row.fecha_pedido,
            items: []
          });
        }
        
        if (row.item_id) {
          pedidosMap.get(row.pedido_id).items.push({
            id: row.item_id,
            computadora_id: row.computadora_id,
            nombre: row.item_nombre,
            precio: Number(row.item_precio),
            cantidad: row.item_cantidad
          });
        }
      }
      
      return Array.from(pedidosMap.values());
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UsuarioService;
