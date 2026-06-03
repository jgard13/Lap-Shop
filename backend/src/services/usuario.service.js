const pool = require('../config/db');

class UsuarioService {
  // Crear nuevo usuario
  static async crearUsuario(usuario, correo, contrasena) {
    const query = `
      INSERT INTO usuario (usuario, correo, contrasena)
      VALUES ($1, $2, $3)
      RETURNING id, usuario, correo, rol
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
    const query = 'SELECT id, usuario, correo, rol FROM usuario WHERE id = $1';
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

  // Mapear fila de computadora a formato Product (columnas reales: rutaimg, tienda, cpu, ram, etc.)
  static _mapComputadora(row) {
    const specs = [row.cpu, row.ram, row.memoria, row.gpu].filter(Boolean).join(' | ');
    return {
      id: row.id,
      name: row.nombre,
      price: Number(row.precio),
      imageUrl: row.rutaimg || '',
      description: specs || `Tienda: ${row.tienda || 'N/A'}`,
      category: row.tienda || '',
      inStock: true,
      stock: 10
    };
  }

  // Obtener favoritos del usuario
  static async obtenerFavoritos(usuarioId) {
    const query = `
      SELECT c.* 
      FROM computadora c
      JOIN lista l ON c.id = l.id_comp
      WHERE l.id_usu = $1 AND l.esfavorito = true
    `;
    try {
      const result = await pool.query(query, [usuarioId]);
      return result.rows.map(r => UsuarioService._mapComputadora(r));
    } catch (error) {
      throw error;
    }
  }

  // Obtener historial de vistos recientemente
  static async obtenerVistos(usuarioId) {
    const query = `
      SELECT c.* 
      FROM computadora c
      JOIN lista l ON c.id = l.id_comp
      WHERE l.id_usu = $1 AND (l.cantidadvi > 0 OR l.fechahora IS NOT NULL)
      ORDER BY l.fechahora DESC
      LIMIT 10
    `;
    try {
      const result = await pool.query(query, [usuarioId]);
      return result.rows.map(r => UsuarioService._mapComputadora(r));
    } catch (error) {
      throw error;
    }
  }

  // Verificar si un producto es favorito
  static async esFavorito(usuarioId, computadoraId) {
    const query = `SELECT 1 FROM lista WHERE id_usu = $1 AND id_comp = $2 AND esfavorito = true`;
    try {
      const result = await pool.query(query, [usuarioId, computadoraId]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Agregar favorito
  static async agregarFavorito(usuarioId, computadoraId) {
    const query = `
      INSERT INTO lista (id_usu, id_comp, esfavorito, fechahora)
      VALUES ($1, $2, true, NOW())
      ON CONFLICT (id_usu, id_comp)
      DO UPDATE SET esfavorito = true, fechahora = NOW()
    `;
    try {
      await pool.query(query, [usuarioId, computadoraId]);
    } catch (error) {
      throw error;
    }
  }

  // Quitar favorito
  static async quitarFavorito(usuarioId, computadoraId) {
    const query = `
      INSERT INTO lista (id_usu, id_comp, esfavorito)
      VALUES ($1, $2, false)
      ON CONFLICT (id_usu, id_comp)
      DO UPDATE SET esfavorito = false
    `;
    try {
      await pool.query(query, [usuarioId, computadoraId]);
    } catch (error) {
      throw error;
    }
  }

  // Registrar un visto (upsert con fecha y vistas incrementadas)
  static async registrarVisto(usuarioId, computadoraId) {
    const query = `
      INSERT INTO lista (id_usu, id_comp, cantidadvi, fechahora)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (id_usu, id_comp)
      DO UPDATE SET cantidadvi = COALESCE(lista.cantidadvi, 0) + 1, fechahora = NOW()
    `;
    try {
      await pool.query(query, [usuarioId, computadoraId]);
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

  // Guardar código de restablecimiento y fecha de expiración
  static async guardarCodigoRestablecimiento(correo, codigo, expiracion) {
    const query = `
      UPDATE usuario
      SET codigo_restablecimiento = $1, codigo_expiracion = $2
      WHERE correo = $3
      RETURNING id
    `;
    try {
      const result = await pool.query(query, [codigo, expiracion, correo]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener código de restablecimiento y expiración
  static async obtenerCodigoRestablecimiento(correo) {
    const query = `
      SELECT codigo_restablecimiento, codigo_expiracion
      FROM usuario
      WHERE correo = $1
    `;
    try {
      const result = await pool.query(query, [correo]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Actualizar contraseña por correo y limpiar el código de restablecimiento
  static async restablecerContrasenaPorCorreo(correo, contrasenaHasheada) {
    const query = `
      UPDATE usuario
      SET contrasena = $1, codigo_restablecimiento = NULL, codigo_expiracion = NULL
      WHERE correo = $2
      RETURNING id, usuario, correo
    `;
    try {
      const result = await pool.query(query, [contrasenaHasheada, correo]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los usuarios (excluyendo contraseñas)
  static async obtenerTodos() {
    const query = 'SELECT id, usuario, correo, rol FROM usuario ORDER BY id ASC';
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar rol del usuario
  static async actualizarRol(id, nuevoRol) {
    const query = `
      UPDATE usuario
      SET rol = $1
      WHERE id = $2
      RETURNING id, usuario, correo, rol
    `;
    try {
      const result = await pool.query(query, [nuevoRol, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Eliminar usuario físicamente de la base de datos
  static async eliminarUsuario(id) {
    const query = 'DELETE FROM usuario WHERE id = $1';
    try {
      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UsuarioService;
