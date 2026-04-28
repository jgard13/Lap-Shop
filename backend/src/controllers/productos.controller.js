const db = require('../config/db');

const getProductos = async (req, res) => {
  try {
    const sqlQuery = db.query('SELECT id, nombre, precio, cpu, ram, memoria, gpu, tienda, rutaimg, link FROM computadora');
    const dbTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('El tiempo de espera de la BD expiro')), 5000));

    const dbResponse = await Promise.race([sqlQuery, dbTimeout]);

    const listaProductos = dbResponse.rows.map(item => {
      const caracteristicas = [item.cpu, item.ram, item.memoria, item.gpu].filter(Boolean).join(' | ');
      
      return {
        id: item.id,
        name: item.nombre,
        price: parseFloat(item.precio),
        imageUrl: item.rutaimg,
        description: caracteristicas || `Tienda: ${item.tienda || 'N/A'}`,
        category: item.tienda,
        stock: 10, 
        inStock: true
      };
    });

    return res.json(listaProductos);
  } catch (err) {
    console.error('Fallo en getProductos:', err.message);
    if (err.message.includes('espera') || err.message.includes('connect')) {
      return res.status(503).json({ error: 'Base de datos no disponible', detalle: err.message });
    }
    return res.status(500).json({ error: 'Error al obtener productos!', detalle: err.message });
  }
};

module.exports = { getProductos };
