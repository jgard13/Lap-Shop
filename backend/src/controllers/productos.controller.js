const db = require('../config/db');

const getProductos = async (req, res) => {
  try {
    // La tabla 'computadora' tiene columnas: id, nombre, precio, cpu, ram, memoria, gpu, tienda, rutaimg, link
    const resultados = await Promise.race([
      db.query('SELECT id, nombre, precio, cpu, ram, memoria, gpu, tienda, rutaimg, link FROM computadora WHERE activo = TRUE'),
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

const buscarProductos = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const queryStr = `
      SELECT id, nombre, precio, cpu, ram, memoria, gpu, tienda, rutaimg, link 
      FROM computadora 
      WHERE (nombre ILIKE $1 OR cpu ILIKE $1 OR tienda ILIKE $1) AND activo = TRUE
    `;
    
    const resultados = await db.query(queryStr, [`%${q}%`]);

    const productos = resultados.rows.map((row) => {
      const specs = [row.cpu, row.ram, row.memoria, row.gpu].filter(Boolean).join(' | ');
      return {
        id: row.id,
        name: row.nombre,
        price: Number(row.precio),
        imageUrl: row.rutaimg,
        description: specs || `Tienda: ${row.tienda || 'N/A'}`,
        category: row.tienda,
        stock: 10,
        inStock: true
      };
    });

    res.json(productos);
  } catch (error) {
    console.error('Error en buscarProductos:', error.message);
    res.status(500).json({ error: 'Error al buscar productos!', detalle: error.message });
  }
};

// ==========================================
// MÓDULO DE FILTROS AVANZADOS (Portado de Scrapers)
// ==========================================

const specs = require('../data/filtros_specs.json');

// Helper para parsear precios robustamente
const parsePrecio = (p) => {
  if (typeof p === 'number') return p;
  if (!p) return 0;
  const limpio = p.toString().replace(/[^0-9.]/g, '');
  return parseFloat(limpio) || 0;
};

// Helper para parsear RAM (ej: "16GB" -> 16)
const parseRAM = (ramStr) => {
  if (typeof ramStr === 'number') return ramStr;
  if (!ramStr) return 0;
  const match = ramStr.toString().match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

// Helper para parsear SSD/Memoria (ej: "512GB SSD" -> 512, "1TB" -> 1024)
const parseSSD = (memStr) => {
  if (typeof memStr === 'number') return memStr;
  if (!memStr) return 0;
  const match = memStr.toString().match(/(\d+)\s*(GB|TB)/i);
  if (!match) return 0;
  let valor = parseInt(match[1]);
  if (match[2].toUpperCase() === 'TB') valor *= 1024;
  return valor;
};

// Helper para determinar el "Tier" del CPU (i3=3, i5=5, etc)
const getCPUTier = (cpuStr) => {
  if (!cpuStr) return 0;
  cpuStr = cpuStr.toLowerCase();
  if (cpuStr.includes('i9') || cpuStr.includes('ryzen 9')) return 9;
  if (cpuStr.includes('i7') || cpuStr.includes('ryzen 7')) return 7;
  if (cpuStr.includes('i5') || cpuStr.includes('ryzen 5')) return 5;
  if (cpuStr.includes('i3') || cpuStr.includes('ryzen 3')) return 3;
  if (cpuStr.includes('celeron') || cpuStr.includes('athlon')) return 2;
  return 2;
};

// Helper para determinar la generación del CPU
const getCPUGen = (cpuStr) => {
  if (!cpuStr) return 0;
  cpuStr = cpuStr.toLowerCase();

  // Intel: busca iX-NN... o iX NN...
  const intelMatch = cpuStr.match(/i\d[- ](\d+)/);
  if (intelMatch) return parseInt(intelMatch[1].substring(0, intelMatch[1].length > 2 ? 2 : 1));

  // AMD Ryzen: busca Ryzen X N...
  const amdMatch = cpuStr.match(/ryzen \d (\d)/);
  if (amdMatch) {
    const firstDigit = parseInt(amdMatch[1]);
    if (firstDigit === 7) return 13;
    if (firstDigit === 5) return 11;
    if (firstDigit === 3) return 9;
    return firstDigit + 5;
  }
  return 1;
};

// Mapper para dar formato Product a los objetos de base de datos
const mapRowToProduct = (row) => {
  const specsStr = [row.cpu, row.ram, row.memoria, row.gpu].filter(Boolean).join(' | ');
  return {
    id: row.id,
    name: row.nombre,
    price: Number(row.precio),
    imageUrl: row.rutaimg,
    description: specsStr || `Tienda: ${row.tienda || 'N/A'}`,
    category: row.tienda,
    stock: 10,
    inStock: true
  };
};


const filtrarProductos = async (req, res) => {
  const { etiquetas, precio_min, precio_max, modo } = req.body;
  const pMin = Number(precio_min) || 0;
  const pMax = Number(precio_max) || 999999;

  try {
    const result = await db.query('SELECT * FROM computadora WHERE activo = TRUE');
    const laptops = result.rows;

    // Si no hay etiquetas seleccionadas, aplicar solo filtro de precio
    if (!etiquetas || etiquetas.length === 0) {
      const filtradas = laptops
        .filter(l => {
          const p = parsePrecio(l.precio);
          return p >= pMin && p <= pMax;
        })
        .map(mapRowToProduct);
      return res.json({
        laptops: filtradas,
        mensaje: "",
        tipo: "Exacta",
        sugerencia: filtradas[0] || null
      });
    }

    // 1. Calcular requerimientos combinados (Máximo entre etiquetas seleccionadas)
    let requirements = { ram: 0, cpu_tier: 0, cpu_gen: 0, ssd: 0 };
    etiquetas.forEach(tag => {
      const cat = specs.categorias[tag];
      if (cat) {
        const s = cat[modo === 'minimo' ? 'minimo' : 'optimo'];
        requirements.ram = Math.max(requirements.ram, s.ram);
        requirements.cpu_tier = Math.max(requirements.cpu_tier, s.cpu_tier);
        requirements.cpu_gen = Math.max(requirements.cpu_gen, s.cpu_gen || 0);
        requirements.ssd = Math.max(requirements.ssd, s.ssd);
      }
    });

    const filterFn = (lap, maxBudget, rRAM, rTier, rGen, rSSD) => {
      const p = parsePrecio(lap.precio);
      const ram = parseRAM(lap.ram);
      const tier = getCPUTier(lap.cpu);
      const gen = getCPUGen(lap.cpu);
      const ssd = parseSSD(lap.memoria);
      return p >= pMin && p <= maxBudget && ram >= rRAM && tier >= rTier && gen >= rGen && ssd >= rSSD;
    };

    // --- FASE 1: Búsqueda exacta ---
    let filtradas = laptops.filter(l => filterFn(l, pMax, requirements.ram, requirements.cpu_tier, requirements.cpu_gen, requirements.ssd));
    let mensaje = "";
    let tipo = "Exacta";

    // --- FASE 2: Fallback ---
    if (filtradas.length === 0) {
      // Sub-intento A: Usar requerimientos mínimos si estábamos en óptimo
      if (modo === 'optimo') {
        let reqMin = { ram: 0, cpu_tier: 0, cpu_gen: 0, ssd: 0 };
        etiquetas.forEach(tag => {
          const cat = specs.categorias[tag] || {};
          const s = cat.minimo || {};
          reqMin.ram = Math.max(reqMin.ram, s.ram || 0);
          reqMin.cpu_tier = Math.max(reqMin.cpu_tier, s.cpu_tier || 0);
          reqMin.cpu_gen = Math.max(reqMin.cpu_gen, s.cpu_gen || 0);
          reqMin.ssd = Math.max(reqMin.ssd, s.ssd || 0);
        });
        filtradas = laptops.filter(l => filterFn(l, pMax, reqMin.ram, reqMin.cpu_tier, reqMin.cpu_gen, reqMin.ssd));
        if (filtradas.length > 0) {
          mensaje = "No encontramos equipos con tus requisitos Óptimos en este precio, pero estos cumplen con lo Mínimo.";
          tipo = "Minimos";
        }
      }

      // Sub-intento B: Expandir presupuesto ±15% manteniendo specs originales
      if (filtradas.length === 0) {
        const precioExpandido = pMax * 1.15;
        filtradas = laptops.filter(l => filterFn(l, precioExpandido, requirements.ram, requirements.cpu_tier, requirements.cpu_gen, requirements.ssd));
        if (filtradas.length > 0) {
          mensaje = "Expandimos un poco tu presupuesto (+15%) para encontrar equipos que cumplan tus requerimientos Óptimos.";
          tipo = "Presupuesto Ext";
        }
      }
    }

    // --- FASE 3: Fallback Crítico (Modo Referencia) ---
    if (filtradas.length === 0) {
      tipo = "Referencia";
      mensaje = "No hay equipos en este rango de precios. Aquí tienes las mejores opciones técnicas que cumplen tus requerimientos independientemente del precio.";

      // 1. El más barato que cumple ÓPTIMO
      const opt = laptops
        .filter(l => parseRAM(l.ram) >= requirements.ram && getCPUTier(l.cpu) >= requirements.cpu_tier && getCPUGen(l.cpu) >= requirements.cpu_gen && parseSSD(l.memoria) >= requirements.ssd)
        .sort((a, b) => parsePrecio(a.precio) - parsePrecio(b.precio))[0];

      // 2. El más barato que cumple MÍNIMO
      let reqMin = { ram: 0, cpu_tier: 0, cpu_gen: 0, ssd: 0 };
      etiquetas.forEach(tag => {
        const s = (specs.categorias[tag] || {}).minimo || {};
        reqMin.ram = Math.max(reqMin.ram, s.ram || 0);
        reqMin.cpu_tier = Math.max(reqMin.cpu_tier, s.cpu_tier || 0);
        reqMin.cpu_gen = Math.max(reqMin.cpu_gen, s.cpu_gen || 0);
        reqMin.ssd = Math.max(reqMin.ssd, s.ssd || 0);
      });
      const min = laptops
        .filter(l => parseRAM(l.ram) >= reqMin.ram && getCPUTier(l.cpu) >= reqMin.cpu_tier)
        .sort((a, b) => parsePrecio(a.precio) - parsePrecio(b.precio))[0];

      filtradas = [opt, min].filter(Boolean);
    }

    // Ordenamiento final por precio más cercano al máximo del usuario
    filtradas.sort((a, b) => Math.abs(parsePrecio(a.precio) - pMax) - Math.abs(parsePrecio(b.precio) - pMax));

    // Sugerencia fija (Sugerencia del Especialista)
    const sugerenciaRow = laptops
      .filter(l => parseRAM(l.ram) >= requirements.ram && getCPUTier(l.cpu) >= requirements.cpu_tier && getCPUGen(l.cpu) >= requirements.cpu_gen)
      .sort((a, b) => parsePrecio(a.precio) - parsePrecio(b.precio))[0];

    res.json({
      laptops: filtradas.map(mapRowToProduct),
      mensaje,
      tipo,
      sugerencia: sugerenciaRow ? mapRowToProduct(sugerenciaRow) : null
    });

  } catch (err) {
    console.error("[ERROR Filtrado]", err);
    res.status(500).json({ error: "Error interno procesando filtros" });
  }
};

module.exports = {
  getProductos,
  buscarProductos,
  filtrarProductos
};
