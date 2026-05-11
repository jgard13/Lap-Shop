-- Script para crear tablas de favoritos e historial
-- Ejecutar en PostgreSQL

-- Tabla de Favoritos
CREATE TABLE IF NOT EXISTS favorito (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuario(id) ON DELETE CASCADE,
    computadora_id INTEGER REFERENCES computadora(id) ON DELETE CASCADE,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, computadora_id)
);

-- Tabla de Historial (Vistos recientemente)
CREATE TABLE IF NOT EXISTS historial_visto (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuario(id) ON DELETE CASCADE,
    computadora_id INTEGER REFERENCES computadora(id) ON DELETE CASCADE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_favorito_usuario ON favorito(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_visto(usuario_id);
