const jwt = require("jsonwebtoken");

exports.generateAccessToken = (user) =>
  jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

exports.generateRefreshToken = (user) =>
  jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);

exports.verifyAccess = (token) =>
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

exports.verifyRefresh = (token) =>
  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
