require("dotenv").config();

const express = require("express");
const pool = require("./database");
const port = 4000;

const jwt = require("jsonwebtoken");

const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());

let refreshTokens = [];

// Health check endpoint for Kubernetes probes
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    service: "backstage-auth",
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "Backstage Auth Server", 
    version: "1.0.0",
    endpoints: ["/auth/login", "/auth/register", "/auth/token", "/health"]
  });
});

app.post("/auth/token", (req, res) => {
  const { token: refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken({ name: user.name, id: user.id });
    res.json({ accessToken });
  });
});

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15s" });
}

app.post("/auth/register", async (req, res) => {
  const { name, lastname, age, username, email, password, musical_genre } =
    req.body;

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Username or email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
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
});

app.post("/auth/login", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userResult = await pool.query(
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
});

app.post("/auth/logout", (req, res) => {
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
});

app.listen(port, () =>
  console.log(`Server running on port http://localhost:${port}`)
);
