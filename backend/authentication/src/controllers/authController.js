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
