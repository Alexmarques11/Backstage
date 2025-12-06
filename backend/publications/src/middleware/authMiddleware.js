const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware para validar access token
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    console.log("Decoded user:", user);
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Middleware para verificar se o user é admin
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};
