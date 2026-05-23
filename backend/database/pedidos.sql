-- Script para crear las tablas de pedidos e historial de compras
-- Ejecutar este script en PostgreSQL

-- Tabla de Pedidos principales
CREATE TABLE IF NOT EXISTS pedido (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuario(id) ON DELETE CASCADE,
  paypal_order_id VARCHAR(100) UNIQUE NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  moneda VARCHAR(10) DEFAULT 'MXN',
  estado VARCHAR(50) DEFAULT 'COMPLETADO',
  fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Items individuales comprados
CREATE TABLE IF NOT EXISTS pedido_item (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedido(id) ON DELETE CASCADE,
  computadora_id INTEGER REFERENCES computadora(id) ON DELETE SET NULL,
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  cantidad INTEGER DEFAULT 1
);

-- Índices para optimizar las búsquedas de historial
CREATE INDEX IF NOT EXISTS idx_pedido_usuario ON pedido(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedido_item_pedido ON pedido_item(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_paypal ON pedido(paypal_order_id);
