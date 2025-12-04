const bcrypt = require("bcryptjs");
const authPool = require("../db/authDb");
const userModel = require("../model/userModel");

// GET /user/profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // vem do authenticateToken

    const result = await authPool.query(
      `SELECT id, name, lastname, birthdate, username, email
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

// PATCH /user/profile
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // autenticação obrigatória
    const { name, lastname, birthdate } = req.body;

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

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating user profile" });
  }
};

// PATCH /user/changepassword
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Both passwords are required" });

    if (newPassword.length < 8)
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters" });

    const userResult = await userModel.findByEmail(req.user.email);
    if (userResult.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword)
      return res.status(400).json({ message: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await authPool.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedPassword,
      userId,
    ]);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error changing password" });
  }
};

// GET /user/preferences
exports.getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await authPool.query(
      `SELECT mg.name
       FROM users_genres ug
       JOIN music_genres mg ON ug.genre_id = mg.id
       WHERE ug.user_id = $1`,
      [userId]
    );

    res.json(result.rows.map((r) => r.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user preferences" });
  }
};

// PATCH /user/preferences
exports.updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { genres } = req.body; // array de nomes de géneros

    if (!Array.isArray(genres))
      return res.status(400).json({ message: "Genres must be an array" });

    // Limpar as preferências antigas
    await authPool.query(`DELETE FROM users_genres WHERE user_id = $1`, [
      userId,
    ]);

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

    res.json({ message: "Preferences updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating user preferences" });
  }
};

// GET /user/posts
exports.getPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await authPool.query(
      `SELECT id, name, lastname, birthdate, username, email
FROM users
WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user data" });
  }
};
