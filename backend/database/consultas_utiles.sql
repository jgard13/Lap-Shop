-- ============================================================================
-- BASE DE DATOS - TABLA USUARIO
-- ============================================================================
-- Sistema de Autenticación MVC
-- Base de datos: PostgreSQL

-- ============================================================================
-- CREAR TABLA USUARIO
-- ============================================================================

CREATE TABLE IF NOT EXISTS usuario (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  correo VARCHAR(100) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP
);

-- ============================================================================
-- CREAR ÍNDICES (Mejora rendimiento de búsquedas)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_usuario_usuario ON usuario(usuario);
CREATE INDEX IF NOT EXISTS idx_usuario_correo ON usuario(correo);
CREATE INDEX IF NOT EXISTS idx_usuario_fecha ON usuario(fecha_registro);

-- ============================================================================
-- ESTRUCTURA DE LA TABLA
-- ============================================================================
/*
  Columna          | Tipo          | Restricciones
  ─────────────────┼───────────────┼─────────────────────────────────────
  id               | SERIAL        | PRIMARY KEY (auto-incremento)
  usuario          | VARCHAR(50)   | NOT NULL, UNIQUE
  correo           | VARCHAR(100)  | NOT NULL, UNIQUE
  contrasena       | VARCHAR(255)  | NOT NULL
  fecha_registro   | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP
  ultimo_acceso    | TIMESTAMP     | NULL (opcional)
*/

-- ============================================================================
-- EJEMPLOS DE INSERCIÓN (PRUEBA)
-- ============================================================================

-- Registro 1
INSERT INTO usuario (usuario, correo, contrasena) 
VALUES ('juan_perez', 'juan@example.com', 'Password123!');

-- Registro 2
INSERT INTO usuario (usuario, correo, contrasena) 
VALUES ('maria_garcia', 'maria@example.com', 'Segura456!');

-- Registro 3 (actualizado)
INSERT INTO usuario (usuario, correo, contrasena, ultimo_acceso) 
VALUES ('carlos_lopez', 'carlos@example.com', 'Fuerte789!', NOW());

-- ============================================================================
-- CONSULTAS ÚTILES
-- ============================================================================

-- Ver todos los usuarios
SELECT * FROM usuario;

-- Ver usuarios con menos información
SELECT id, usuario, correo, fecha_registro FROM usuario;

-- Buscar usuario específico por nombre
SELECT * FROM usuario WHERE usuario = 'juan_perez';

-- Buscar usuario por correo
SELECT * FROM usuario WHERE correo = 'juan@example.com';

-- Contar total de usuarios registrados
SELECT COUNT(*) as total_usuarios FROM usuario;

-- Ver usuarios ordenados por fecha de registro (más recientes primero)
SELECT id, usuario, correo, fecha_registro 
FROM usuario 
ORDER BY fecha_registro DESC;

-- Ver usuarios que han accedido (con ultimo_acceso)
SELECT usuario, correo, ultimo_acceso 
FROM usuario 
WHERE ultimo_acceso IS NOT NULL 
ORDER BY ultimo_acceso DESC;

-- Ver usuarios que nunca han accedido
SELECT usuario, correo, fecha_registro 
FROM usuario 
WHERE ultimo_acceso IS NULL;

-- Buscar usuarios registrados en los últimos 7 días
SELECT id, usuario, correo, fecha_registro 
FROM usuario 
WHERE fecha_registro >= CURRENT_DATE - INTERVAL '7 days';

-- Ver el usuario más reciente
SELECT * FROM usuario ORDER BY fecha_registro DESC LIMIT 1;

-- Ver los últimos 5 usuarios registrados
SELECT id, usuario, correo, fecha_registro 
FROM usuario 
ORDER BY fecha_registro DESC 
LIMIT 5;

-- ============================================================================
-- ACTUALIZACIONES ÚTILES
-- ============================================================================

-- Actualizar último acceso de un usuario
UPDATE usuario 
SET ultimo_acceso = NOW() 
WHERE usuario = 'juan_perez';

-- Cambiar contraseña de un usuario
UPDATE usuario 
SET contrasena = 'NuevaPassword789!' 
WHERE usuario = 'juan_perez';

-- Actualizar correo
UPDATE usuario 
SET correo = 'juan_nuevo@example.com' 
WHERE id = 1;

-- ============================================================================
-- ELIMINAR DATOS
-- ============================================================================

-- Eliminar un usuario específico
DELETE FROM usuario WHERE usuario = 'juan_perez';

-- Eliminar usuario por correo
DELETE FROM usuario WHERE correo = 'juan@example.com';

-- Eliminar todos los usuarios (⚠️ CUIDADO!)
DELETE FROM usuario;

-- Vaciar la tabla completamente
TRUNCATE TABLE usuario CASCADE;

-- Resetear el contador de IDs después de limpiar
ALTER SEQUENCE usuario_id_seq RESTART WITH 1;

-- ============================================================================
-- MANTENIMIENTO
-- ============================================================================

-- Ver información sobre la tabla
\dt usuario

-- Ver definición de la tabla
\d usuario

-- Ver índices
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'usuario';

-- Analizar tabla para optimizar consultas
ANALYZE usuario;

-- Ver estadísticas de la tabla
SELECT 
  schemaname,
  tablename,
  relpages,
  reltuples::int as rows
FROM pg_stat_user_tables 
WHERE tablename = 'usuario';

-- Limpiar espacio no usado
VACUUM usuario;

-- ============================================================================
-- VALIDACIONES Y RESTRICCIONES ÚTILES (OPCIONAL)
-- ============================================================================

-- Agregar restricción de validación de email
ALTER TABLE usuario 
ADD CONSTRAINT chk_correo_format 
CHECK (correo ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Agregar restricción de largo mínimo de usuario
ALTER TABLE usuario 
ADD CONSTRAINT chk_usuario_length 
CHECK (LENGTH(usuario) >= 3);

-- Agregar restricción de largo mínimo de contraseña
ALTER TABLE usuario 
ADD CONSTRAINT chk_password_length 
CHECK (LENGTH(contrasena) >= 6);

-- Ver restricciones actuales
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'usuario';

-- ============================================================================
-- BACKUP Y RESTORE
-- ============================================================================

-- BACKUP de la tabla (ejecutar en terminal, no en psql)
-- pg_dump -U postgres -d tu_base_datos -t usuario -f usuario_backup.sql

-- RESTORE desde backup (ejecutar en terminal)
-- psql -U postgres -d tu_base_datos -f usuario_backup.sql

-- Exportar datos a CSV (en terminal)
-- psql -U postgres -d tu_base_datos -c "\COPY usuario TO 'usuarios.csv' CSV HEADER"

-- Importar datos desde CSV (en terminal)
-- psql -U postgres -d tu_base_datos -c "\COPY usuario(usuario, correo, contrasena) FROM 'usuarios.csv' CSV HEADER"

-- ============================================================================
-- CONSULTAS AVANZADAS
-- ============================================================================

-- Contar usuarios por fecha de registro
SELECT DATE(fecha_registro) as fecha, COUNT(*) as cantidad
FROM usuario
GROUP BY DATE(fecha_registro)
ORDER BY fecha DESC;

-- Usuarios que se han conectado recientemente
SELECT usuario, correo, 
  CASE 
    WHEN ultimo_acceso IS NULL THEN 'Nunca ha accedido'
    WHEN ultimo_acceso > CURRENT_DATE - INTERVAL '1 day' THEN 'Hoy'
    WHEN ultimo_acceso > CURRENT_DATE - INTERVAL '7 days' THEN 'Esta semana'
    ELSE 'Más de una semana'
  END as estado_acceso
FROM usuario
ORDER BY ultimo_acceso DESC;

-- Usuarios inactivos (no han accedido en los últimos 30 días)
SELECT id, usuario, correo, ultimo_acceso
FROM usuario
WHERE ultimo_acceso < CURRENT_DATE - INTERVAL '30 days'
  OR ultimo_acceso IS NULL
ORDER BY ultimo_acceso DESC;

-- ============================================================================
-- NOTAS DE SEGURIDAD
-- ============================================================================

/*
⚠️ IMPORTANTE: ENCRIPTACIÓN DE CONTRASEÑAS

En este script las contraseñas se guardan EN TEXTO PLANO.
Esto es SOLO para propósitos educativos/MVC.

PARA PRODUCCIÓN:
1. Usar bcryptjs o similar en el backend
2. NUNCA guardar contraseñas en texto plano
3. Las contraseñas deben estar hasheadas antes de guardar

Ejemplo con bcryptjs (en Node.js):
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(contrasena, 10);
  // Guardar hashedPassword en la BD

Verificación:
  const isValid = await bcrypt.compare(contrasena, hashedPassword);
*/

-- ============================================================================
-- TIPS DE PERFORMANCE
-- ============================================================================

/*
1. Los índices en 'usuario' y 'correo' hacen búsquedas rápidas

2. Para búsquedas LIKE (caso insensible):
   SELECT * FROM usuario WHERE LOWER(usuario) LIKE LOWER('%juan%');

3. Usar EXPLAIN para analizar consultas:
   EXPLAIN SELECT * FROM usuario WHERE usuario = 'juan_perez';

4. Limitar resultados con LIMIT cuando sea apropiado:
   SELECT * FROM usuario LIMIT 10;

5. Usar OFFSET para paginación:
   SELECT * FROM usuario LIMIT 10 OFFSET 0; -- Página 1
   SELECT * FROM usuario LIMIT 10 OFFSET 10; -- Página 2
*/

-- ============================================================================
-- EJEMPLO COMPLETO DE FLUJO
-- ============================================================================

-- 1. Registrar usuario
INSERT INTO usuario (usuario, correo, contrasena) 
VALUES ('nuevo_usuario', 'nuevo@example.com', 'Password123!');

-- 2. Verificar que se registró
SELECT * FROM usuario WHERE usuario = 'nuevo_usuario';

-- 3. Login: Buscar usuario y validar contraseña
SELECT id, usuario, correo 
FROM usuario 
WHERE usuario = 'nuevo_usuario' AND contrasena = 'Password123!';

-- 4. Actualizar último acceso
UPDATE usuario 
SET ultimo_acceso = NOW() 
WHERE usuario = 'nuevo_usuario';

-- 5. Verificar actualización
SELECT usuario, ultimo_acceso FROM usuario WHERE usuario = 'nuevo_usuario';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

/*
Este script contiene:
✓ Creación de tabla
✓ Creación de índices
✓ Ejemplos de inserción
✓ Consultas útiles
✓ Actualizaciones
✓ Eliminación de datos
✓ Mantenimiento
✓ Consultas avanzadas
✓ Tips de performance

Para dudas o más información, revisa la documentación principal.
*/
