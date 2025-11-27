const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authPool = require("../authDb");

require("dotenv").config();

let refreshTokens = [];

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15s" });
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
  const { name, lastname, age, username, email, password, musical_genre } =
    req.body;

  try {
    const existingUser = await authPool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Username or email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await authPool.query(
      `INSERT INTO users 
        (name, lastname, age, username, email, password, musical_genre) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        name,
        lastname,
        age,
        username,
        email,
        hashedPassword,
        musical_genre || [],
      ]
    );

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

    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    const refreshToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.REFRESH_TOKEN_SECRET
    );

    refreshTokens.push(refreshToken);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error logging in" });
  }
};

exports.tokenUser = (req, res) => {
  const { token: refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
    });
    res.json({ accessToken });
  });
};

exports.logoutUser = (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  const beforeCount = refreshTokens.length;
  refreshTokens = refreshTokens.filter((t) => t !== token);

  if (refreshTokens.length === beforeCount) {
    return res
      .status(400)
      .json({ message: "Invalid or already removed token" });
  }

  return res.status(200).json({ message: "Logout successful" });
};

exports.getPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await authPool.query(
      `SELECT id, name, lastname, age, username, email, musical_genre
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

exports.getUsers = async (req, res) => {
  try {
    const { username } = req.body;

    const result = await authPool.query(
      `SELECT name, lastname, age, username, musical_genre
      FROM users
      WHERE username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "user not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user data" });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { username, name, lastname, age } = req.body;

    await authPool.query(
      `UPDATE users
      SET name = $2, lastname = $3, age = $4
      WHERE username = $1`,
      [username, name, lastname, age]
    );

    const result = await authPool.query(
      `SELECT name, lastname, age, username FROM users WHERE username = $1`,
      [username]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating user profile" });
  }
};

exports.getUserPreferences = async (req, res) => {
  try {
    const { username } = req.body;

    const result = await authPool.query(
      `SELECT musical_genre
      FROM users
      WHERE username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "user not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user preferences" });
  }
};

exports.updateUserPreferences = async (req, res) => {
  try {
    const { username, musical_genre } = req.body;

    await authPool.query(
      `UPDATE users
      SET musical_genre = $2
      WHERE username = $1`,
      [username, musical_genre]
    );

    const result = await authPool.query(
      `SELECT musical_genre FROM users WHERE username = $1`,
      [username]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating user preferences" });
  }
};
