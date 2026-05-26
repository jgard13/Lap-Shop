const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      mensaje: 'Usuario no autenticado' 
    });
  }
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      mensaje: 'Acceso denegado. Solo administradores.' 
    });
  }
  next();
};

module.exports = adminMiddleware;
