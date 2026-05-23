require('dotenv').config();
const db = require('./src/config/db');

async function runTests() {
  console.log('Iniciando pruebas de integración del módulo de filtros...');

  try {
    // 1. Verificar conexión a base de datos
    const resHealth = await db.query('SELECT 1');
    console.log('✓ Conexión exitosa a PostgreSQL');

    // Importamos controladores directamente
    const { filtrarProductos } = require('./src/controllers/productos.controller');

    // 2. Simular peticiones
    console.log('\nPrueba 1: Filtrar sin categorías (solo por rango de precios)...');
    let req = {
      body: {
        etiquetas: [],
        precio_min: 5000,
        precio_max: 25000,
        modo: 'optimo'
      }
    };
    let res = {
      json: (data) => {
        console.log(`✓ Recibidos ${data.laptops.length} laptops.`);
        if (data.laptops.length > 0) {
          const first = data.laptops[0];
          console.log(`  Primera laptop: "${first.name}" | Precio: $${first.price}`);
          if (first.id && first.name && typeof first.price === 'number' && first.imageUrl && first.description) {
            console.log('  ✓ Estructura de mapeo a Product es correcta');
          } else {
            console.error('  ✗ Estructura de mapeo a Product tiene campos faltantes:', first);
          }
        }
      },
      status: (code) => {
        console.error(`  ✗ Error de estado: ${code}`);
        return res;
      }
    };
    await filtrarProductos(req, res);

    console.log('\nPrueba 2: Filtrar con categoría Gaming en modo Óptimo...');
    req.body.etiquetas = ['Gaming'];
    req.body.precio_max = 50000;
    res.json = (data) => {
      console.log(`✓ Recibidos ${data.laptops.length} laptops.`);
      console.log(`  Tipo de coincidencia obtenido: "${data.tipo}"`);
      console.log(`  Mensaje sistema: "${data.mensaje || 'Ninguno'}"`);
      if (data.sugerencia) {
        console.log(`  Sugerencia del especialista: "${data.sugerencia.name}" - $${data.sugerencia.price}`);
      }
    };
    await filtrarProductos(req, res);

    console.log('\nPrueba 3: Forzar Fallback de Referencia Crítica (Rango de precio ultra bajo)...');
    req.body.etiquetas = ['Diseño 3D', 'Arquitectura'];
    req.body.precio_max = 2000; // Demasiado bajo para diseño 3D
    res.json = (data) => {
      console.log(`✓ Recibidos ${data.laptops.length} laptops de referencia.`);
      console.log(`  Tipo de coincidencia obtenido (esperado: "Referencia"): "${data.tipo}"`);
      console.log(`  Mensaje sistema: "${data.mensaje}"`);
    };
    await filtrarProductos(req, res);

    console.log('\n✓ Pruebas completadas con éxito.');
  } catch (error) {
    console.error('✗ Error ejecutando pruebas:', error);
  } finally {
    // Cerrar el pool de base de datos
    await db.end();
  }
}

runTests();
