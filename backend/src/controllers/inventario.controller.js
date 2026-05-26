const db = require('../config/db');

class InventarioController {
  // Obtener todas las computadoras (incluyendo inactivas para gestión del admin)
  static async obtenerProductos(req, res) {
    try {
      const result = await db.query('SELECT * FROM computadora ORDER BY id DESC');
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error al obtener inventario:', error.message);
      res.status(500).json({ success: false, mensaje: 'Error al obtener inventario', detalle: error.message });
    }
  }

  // Crear un producto nuevo
  static async crearProducto(req, res) {
    try {
      const { nombre, precio, cpu, ram, memoria, gpu, tienda, rutaimg, link } = req.body;
      
      if (!nombre || !precio) {
        return res.status(400).json({ success: false, mensaje: 'Nombre y precio son requeridos.' });
      }

      const query = `
        INSERT INTO computadora (nombre, precio, cpu, ram, memoria, gpu, tienda, rutaimg, link, activo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
        RETURNING *
      `;
      const result = await db.query(query, [
        nombre,
        Number(precio),
        cpu || null,
        ram || null,
        memoria || null,
        gpu || null,
        tienda || 'Admin Manual',
        rutaimg || 'assets/placeholder.png',
        link || '#'
      ]);

      res.status(201).json({
        success: true,
        mensaje: 'Producto creado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al crear producto:', error.message);
      res.status(500).json({ success: false, mensaje: 'Error al crear producto', detalle: error.message });
    }
  }

  // Actualizar un producto
  static async actualizarProducto(req, res) {
    try {
      const { id } = req.params;
      const { nombre, precio, cpu, ram, memoria, gpu, tienda, rutaimg, link, activo } = req.body;

      if (!nombre || !precio) {
        return res.status(400).json({ success: false, mensaje: 'Nombre y precio son requeridos.' });
      }

      const query = `
        UPDATE computadora
        SET nombre = $1, precio = $2, cpu = $3, ram = $4, memoria = $5, gpu = $6, tienda = $7, rutaimg = $8, link = $9, activo = $10
        WHERE id = $11
        RETURNING *
      `;
      const result = await db.query(query, [
        nombre,
        Number(precio),
        cpu || null,
        ram || null,
        memoria || null,
        gpu || null,
        tienda || 'Admin Manual',
        rutaimg || 'assets/placeholder.png',
        link || '#',
        activo !== undefined ? activo : true,
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, mensaje: 'Producto no encontrado.' });
      }

      res.json({
        success: true,
        mensaje: 'Producto actualizado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al actualizar producto:', error.message);
      res.status(500).json({ success: false, mensaje: 'Error al actualizar producto', detalle: error.message });
    }
  }

  // Borrado virtual de un producto (activo = false)
  static async borradoVirtualProducto(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        UPDATE computadora
        SET activo = FALSE
        WHERE id = $1
        RETURNING *
      `;
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, mensaje: 'Producto no encontrado.' });
      }

      res.json({
        success: true,
        mensaje: 'Producto desactivado (borrado virtual) exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error en borrado virtual:', error.message);
      res.status(500).json({ success: false, mensaje: 'Error al realizar borrado virtual', detalle: error.message });
    }
  }
}

module.exports = InventarioController;
