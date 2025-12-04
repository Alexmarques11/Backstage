const authPool = require("../db/authDb");
const userModel = require("../model/userModel");

// Obter todos os utilizadores
exports.getAllUsers = async () => {
  const result = await authPool.query(
    `SELECT id, name, lastname, username, email, role, birthdate 
     FROM users
     ORDER BY id ASC`
  );

  return result.rows;
};

// Eliminar utilizador
exports.deleteUser = async (userId) => {
  const userResult = await authPool.query("SELECT id FROM users WHERE id=$1", [
    userId,
  ]);
  if (userResult.rows.length === 0) throw new Error("User not found");

  await userModel.deleteTokensByUser(userId); // apaga todos tokens do utilizador
  await authPool.query("DELETE FROM users_genres WHERE user_id=$1", [userId]);
  await authPool.query("DELETE FROM users WHERE id=$1", [userId]);

  return { message: `User with ID ${userId} deleted successfully` };
};

// Atualizar role de utilizador
exports.updateUserRole = async (userId, roleData) => {
  const { role } = roleData;
  const allowedRoles = ["user", "admin"];

  if (!role) throw new Error("Role is required");
  if (!allowedRoles.includes(role)) throw new Error("Invalid role");

  const userResult = await authPool.query("SELECT id FROM users WHERE id=$1", [
    userId,
  ]);
  if (userResult.rows.length === 0) throw new Error("User not found");

  await authPool.query("UPDATE users SET role=$1 WHERE id=$2", [role, userId]);
  return { message: `User role updated to ${role}` };
};

// Obter todos os géneros musicais
exports.getMusicGenres = async () => {
  const result = await authPool.query(
    `SELECT id, name FROM music_genres ORDER BY name`
  );

  return result.rows;
};
