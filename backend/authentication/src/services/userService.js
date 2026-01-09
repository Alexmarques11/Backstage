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

  // Publish message to RabbitMQ for async notification
  try {
    const channel = getChannel();
    const queue = "user.deleted";

    await channel.assertQueue(queue, { durable: true });

    const message = {
      userId,
      createdAt: new Date().toISOString(),
    };

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });

    console.log(
      `User deleted message sent to queue for user ${userId}`
    );
  } catch (error) {
    console.error("Error sending message to RabbitMQ:", error);
    // Don't fail the creation if notification fails
  }

  return { message: `User with ID ${userId} deleted successfully` };
};

// Atualizar role de utilizador
exports.updateUserRole = async (userId, roleData) => {
  const { role } = roleData;
  const allowedRoles = ["user", "admin", "manager"];

  if (!role) throw new Error("Role is required");
  if (!allowedRoles.includes(role)) throw new Error("Invalid role");

  const userResult = await authPool.query("SELECT id FROM users WHERE id=$1", [
    userId,
  ]);
  if (userResult.rows.length === 0) throw new Error("User not found");

  await authPool.query("UPDATE users SET role=$1 WHERE id=$2", [role, userId]);
  return { message: `User role updated to ${role}` };
};

// Obter informações não sensíveis de um utilizador com géneros musicais
exports.getUserPublicInfo = async (userId) => {
  const userResult = await authPool.query(
    `SELECT id, name, lastname, username, birthdate, role
     FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) throw new Error("User not found");

  const user = userResult.rows[0];

  // Buscar géneros musicais do utilizador
  const genresResult = await authPool.query(
    `SELECT mg.name
     FROM users_genres ug
     JOIN music_genres mg ON ug.genre_id = mg.id
     WHERE ug.user_id = $1`,
    [userId]
  );

  const genres = genresResult.rows.map((r) => r.name);

  return {
    ...user,
    genres,
  };
};
