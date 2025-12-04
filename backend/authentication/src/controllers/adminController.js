const authPool = require("../db/authDb");
const userModel = require("../model/userModel");

// GET /admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const result = await authPool.query(
      `SELECT id, name, lastname, username, email, role, birthdate 
       FROM users
       ORDER BY id ASC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// DELETE /admin/users/:id
exports.deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const userResult = await authPool.query(
      "SELECT id FROM users WHERE id=$1",
      [userId]
    );
    if (userResult.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    await userModel.deleteTokensByUser(userId); // apaga todos tokens do utilizador
    await authPool.query("DELETE FROM users_genres WHERE user_id=$1", [userId]);
    await authPool.query("DELETE FROM users WHERE id=$1", [userId]);

    res.json({ message: `User with ID ${userId} deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting user" });
  }
};

// PATCH /admin/users/:id/role
exports.updateUserRole = async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;
  const allowedRoles = ["user", "admin"];

  if (!role) return res.status(400).json({ message: "Role is required" });
  if (!allowedRoles.includes(role))
    return res.status(400).json({ message: "Invalid role" });

  try {
    const userResult = await authPool.query(
      "SELECT id FROM users WHERE id=$1",
      [userId]
    );
    if (userResult.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    await authPool.query("UPDATE users SET role=$1 WHERE id=$2", [
      role,
      userId,
    ]);
    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating user role" });
  }
};

// GET /admin/genres
exports.getMusicGenres = async (req, res) => {
  try {
    const result = await authPool.query(
      `SELECT id, name FROM music_genres ORDER BY name`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar géneros:", err.message);
    res.status(500).json({ message: "Erro ao buscar géneros" });
  }
};
