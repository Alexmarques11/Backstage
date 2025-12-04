const bcrypt = require("bcryptjs");
const authPool = require("../db/authDb");
const userModel = require("../model/userModel");

// Obter perfil de utilizador
exports.getUserProfile = async (userId) => {
  const result = await authPool.query(
    `SELECT id, name, lastname, birthdate, username, email
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) throw new Error("User not found");

  return result.rows[0];
};

// Atualizar perfil de utilizador
exports.updateUserProfile = async (userId, profileData) => {
  const { name, lastname, birthdate } = profileData;

  await authPool.query(
    `UPDATE users
     SET name = $1, lastname = $2, birthdate = $3
     WHERE id = $4`,
    [name, lastname, birthdate, userId]
  );

  const result = await authPool.query(
    `SELECT id, name, lastname, birthdate, username, email FROM users WHERE id = $1`,
    [userId]
  );

  return result.rows[0];
};

// Mudar password
exports.changePassword = async (userId, userEmail, passwordData) => {
  const { currentPassword, newPassword } = passwordData;

  if (!currentPassword || !newPassword)
    throw new Error("Both passwords are required");

  if (newPassword.length < 8)
    throw new Error("New password must be at least 8 characters");

  const userResult = await userModel.findByEmail(userEmail);
  if (userResult.rows.length === 0) throw new Error("User not found");

  const user = userResult.rows[0];
  const validPassword = await bcrypt.compare(currentPassword, user.password);
  if (!validPassword) throw new Error("Current password is incorrect");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await authPool.query("UPDATE users SET password = $1 WHERE id = $2", [
    hashedPassword,
    userId,
  ]);

  return { message: "Password changed successfully" };
};

// Obter preferências de utilizador
exports.getUserPreferences = async (userId) => {
  const result = await authPool.query(
    `SELECT mg.name
     FROM users_genres ug
     JOIN music_genres mg ON ug.genre_id = mg.id
     WHERE ug.user_id = $1`,
    [userId]
  );

  return result.rows.map((r) => r.name);
};

// Atualizar preferências de utilizador
exports.updateUserPreferences = async (userId, preferencesData) => {
  const { genres } = preferencesData;

  if (!Array.isArray(genres)) throw new Error("Genres must be an array");

  // Limpar as preferências antigas
  await authPool.query(`DELETE FROM users_genres WHERE user_id = $1`, [userId]);

  // Inserir os novos géneros
  const genreResult = await authPool.query(
    `SELECT id FROM music_genres WHERE name = ANY($1)`,
    [genres]
  );

  const genreIds = genreResult.rows.map((g) => g.id);
  for (const genreId of genreIds) {
    await authPool.query(
      `INSERT INTO users_genres (user_id, genre_id) VALUES ($1, $2)`,
      [userId, genreId]
    );
  }

  return { message: "Preferences updated successfully" };
};

// Obter posts de utilizador
exports.getPosts = async (userId) => {
  const result = await authPool.query(
    `SELECT id, name, lastname, birthdate, username, email
     FROM users
     WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) throw new Error("User not found");

  return result.rows[0];
};
