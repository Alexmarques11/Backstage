const authPool = require("../db/authDb");

exports.findByEmail = (email) =>
  authPool.query(`SELECT * FROM users WHERE email = $1`, [email]);

exports.findByUsername = (username) =>
  authPool.query(`SELECT * FROM users WHERE username = $1`, [username]);

exports.findByUsernameOrEmail = (username, email) =>
  authPool.query(`SELECT * FROM users WHERE username = $1 OR email = $2`, [
    username,
    email,
  ]);

exports.createUser = (data) =>
  authPool.query(
    `INSERT INTO users (name, lastname, birthdate, username, email, password)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, username, email`,
    data
  );

exports.storeRefreshToken = (userId, hashedToken) =>
  authPool.query(
    `INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)`,
    [userId, hashedToken]
  );

exports.findTokenByUser = (userId) =>
  authPool.query(`SELECT * FROM refresh_tokens WHERE user_id = $1`, [userId]);

exports.deleteTokenById = (id) =>
  authPool.query(`DELETE FROM refresh_tokens WHERE id = $1`, [id]);

exports.deleteTokensByUser = (userId) =>
  authPool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);

exports.deleteAllTokens = () => authPool.query(`DELETE FROM refresh_tokens`);
