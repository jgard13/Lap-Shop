-- Script para crear la tabla de usuario
-- Ejecutar este script en PostgreSQL

CREATE TABLE IF NOT EXISTS usuario (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  correo VARCHAR(100) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_usuario ON usuario(usuario);
CREATE INDEX IF NOT EXISTS idx_usuario_correo ON usuario(correo);

-- Insertar algunos usuarios de prueba (opcional)
-- Los datos deben estar encriptados en producción
-- INSERT INTO usuario (usuario, correo, contrasena) VALUES 
-- ('usuario1', 'usuario1@example.com', 'password123'),
-- ('usuario2', 'usuario2@example.com', 'password456');
