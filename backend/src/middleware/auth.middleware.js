const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // Obtener la cabecera Authorization
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. No se proporcionó un token de seguridad.'
    });
  }

  // El formato debe ser "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Formato de token inválido. Debe ser Bearer <token>.'
    });
  }

  const token = parts[1];

  try {
    // Verificar firma y expiración
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adjuntar datos del usuario decodificado al request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Error al verificar JWT:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'El token de seguridad ha expirado. Por favor, inicia sesión de nuevo.',
        expired: true
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token de seguridad inválido o corrupto.'
    });
  }
}

module.exports = authMiddleware;
