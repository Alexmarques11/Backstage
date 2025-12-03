const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authPool = require("../db/authDb");
const userModel = require("../model/userModel");

require("dotenv").config();

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
}

// ------------------------------AUTH CONTROLLERS------------------------------ //

// Register a new user
exports.registerUser = async (req, res) => {
  const { name, lastname, birthdate, username, email, password, genres } =
    req.body;

  try {
    // Verificar se o email ou username já existem
    const emailExists = await userModel.findByEmail(email);
    if (emailExists.rows.length > 0)
      return res.status(400).json({ message: "Email already in use" });

    const usernameExists = await userModel.findByUsername(username);
    if (usernameExists.rows.length > 0)
      return res.status(400).json({ message: "Username already in use" });

    // Validar senha
    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar utilizador
    const userResult = await userModel.createUser([
      name,
      lastname,
      birthdate,
      username,
      email,
      hashedPassword,
    ]);
    const userId = userResult.rows[0].id;

    // Inserir gêneros musicais (se houver)
    if (genres && Array.isArray(genres) && genres.length > 0) {
      const genreIdsResult = await authPool.query(
        `SELECT id FROM music_genres WHERE name = ANY($1)`,
        [genres]
      );
      const genreIds = genreIdsResult.rows.map((g) => g.id);

      for (const genreId of genreIds) {
        await authPool.query(
          `INSERT INTO users_genres (user_id, genre_id) VALUES ($1, $2)`,
          [userId, genreId]
        );
      }
    }

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error registering user" });
  }
};

exports.loginUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userResult = await userModel.findByUsernameOrEmail(username, email);
    if (userResult.rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const user = userResult.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ message: "Incorrect password" });

    const userPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(userPayload);

    // Criar refresh token com expiração de 7 dias
    const refreshToken = jwt.sign(
      userPayload,
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias de validade

    await authPool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, hashedRefreshToken, expiresAt]
    );

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error logging in" });
  }
};

exports.tokenUser = async (req, res) => {
  const { token: refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);

  try {
    const tokensResult = await authPool.query(`SELECT * FROM refresh_tokens`);
    const matched = tokensResult.rows.find(
      (rt) =>
        bcrypt.compareSync(refreshToken, rt.token) &&
        new Date(rt.expires_at) > new Date()
    );

    if (!matched)
      return res
        .status(403)
        .json({ message: "Refresh token not found or expired" });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);

      const accessToken = generateAccessToken({
        id: user.id,
        username: user.username,
        email: user.email,
      });
      res.json({ accessToken });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error validating token" });
  }
};

exports.logoutUser = async (req, res) => {
  const { token } = req.body;
  if (!token)
    return res.status(400).json({ message: "Refresh token is required" });

  try {
    const tokensResult = await authPool.query(`SELECT * FROM refresh_tokens`);
    let matched = null;

    for (const rt of tokensResult.rows) {
      if (await bcrypt.compare(token, rt.token)) {
        matched = rt;
        break;
      }
    }

    if (!matched)
      return res
        .status(400)
        .json({ message: "Invalid or already removed refresh token" });

    await userModel.deleteTokenById(matched.id);
    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error during logout" });
  }
};

// ------------------------------USER CONTROLLERS------------------------------ //

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

// GET /users/profile
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

// PUT /users/profile
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

// PUT /users/preferences
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

// ------------------------------ADMIN CONTROLLERS------------------------------ //

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
