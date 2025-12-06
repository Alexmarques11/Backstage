// Middleware para verificar se o user é admin
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};

// Middleware para verificar se o user é manager
exports.isManager = (req, res, next) => {
  if (!req.user || req.user.role !== "manager") {
    return res.status(403).json({ message: "Managers only" });
  }
  next();
};

// Middleware genérico para verificar vários roles
exports.hasRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access Denied. Allowed roles: ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
};
