const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authPool = require("../authDb");

require("dotenv").config();

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15min",
  });
}

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Register a new user
exports.registerUser = async (req, res) => {
  const { name, lastname, birthdate, username, email, password, genres } =
    req.body;

  try {
    // Verificar se o email já existe
    const emailExists = await authPool.query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );
    if (emailExists.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Verificar se o username já existe
    const usernameExists = await authPool.query(
      "SELECT 1 FROM users WHERE username = $1",
      [username]
    );
    if (usernameExists.rows.length > 0) {
      return res.status(400).json({ message: "Username already in use" });
    }

    // Validar senha
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir usuário
    const userResult = await authPool.query(
      `INSERT INTO users (name, lastname, birthdate, username, email, password)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [name, lastname, birthdate, username, email, hashedPassword]
    );

    const userId = userResult.rows[0].id;

    // Inserir gêneros musicais
    if (genres && Array.isArray(genres)) {
      const genreResult = await authPool.query(
        `SELECT id FROM music_genres WHERE name = ANY($1)`,
        [genres]
      );

      const genreIds = genreResult.rows.map((g) => g.id);

      for (const genreId of genreIds) {
        await authPool.query(
          `INSERT INTO users_genres (user_id, genre_id)
           VALUES ($1, $2)`,
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
    const userResult = await authPool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const userPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = jwt.sign(
      userPayload,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Hash do refresh token antes de guardar
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await authPool.query(
      `INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)`,
      [user.id, hashedRefreshToken]
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
    // Buscar todos os refresh tokens do utilizador
    const tokensResult = await authPool.query(`SELECT * FROM refresh_tokens`);
    const matched = tokensResult.rows.find((rt) =>
      bcrypt.compareSync(refreshToken, rt.token)
    );

    if (!matched) {
      return res.status(403).json({ message: "Refresh token not found" });
    }

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

    await authPool.query(`DELETE FROM refresh_tokens WHERE id = $1`, [
      matched.id,
    ]);

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error during logout" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters" });
    }

    const userResult = await authPool.query(
      "SELECT password FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

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
