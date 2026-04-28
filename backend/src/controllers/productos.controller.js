const db = require('../config/db');

const getProductos = async (req, res) => {
  try {
    // La tabla 'computadora' tiene columnas: id, nombre, precio, cpu, ram, memoria, gpu, tienda, rutaimg, link
    const resultados = await Promise.race([
      db.query('SELECT id, nombre, precio, cpu, ram, memoria, gpu, tienda, rutaimg, link FROM computadora'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout: BD toma demasiado tiempo')), 5000))
    ]);

    const productos = resultados.rows.map((row) => {
      // Crear una descripción combinando especificaciones
      const specs = [row.cpu, row.ram, row.memoria, row.gpu].filter(Boolean).join(' | ');
      
      return {
        id: row.id,
        name: row.nombre,
        price: Number(row.precio),
        imageUrl: row.rutaimg,
        description: specs || `Tienda: ${row.tienda || 'N/A'}`,
        category: row.tienda,
        stock: 10, // Default stock since column is missing
        inStock: true
      };
    });

    res.json(productos);
  } catch (error) {
    console.error('Error en getProductos:', error.message);
    // Si es timeout de BD, responder con status 503
    if (error.message.includes('timeout') || error.message.includes('connect')) {
      return res.status(503).json({ error: 'Base de datos no disponible', detalle: error.message });
    }
    res.status(500).json({ error: 'Error al obtener productos!', detalle: error.message });
  }
};

module.exports = {
  getProductos
};
