require("dotenv").config();

const express = require("express");
const pool = require("./database");
const port = 4000;

const jwt = require("jsonwebtoken");

const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());

let refreshTokens = [];

app.post("/token", (req, res) => {
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

app.post("/register", async (req, res) => {
  const { name, lastname, password } = req.body;
  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE name = $1",
      [name]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, lastname, password) VALUES ($1, $2, $3)",
      [name, lastname, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error registering user" });
  }
});

app.post("/login", async (req, res) => {
  const { name, password } = req.body;
  try {
    const userResult = await pool.query("SELECT * FROM users WHERE name = $1", [
      name,
    ]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const accessToken = generateAccessToken({ name: user.name, id: user.id });
    const refreshToken = jwt.sign(
      { name: user.name, id: user.id },
      process.env.REFRESH_TOKEN_SECRET
    );
    refreshTokens.push(refreshToken);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

app.delete("/logout", (req, res) => {
  refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
  res.sendStatus(204);
});

app.listen(port, () =>
  console.log(`Server running on port http://localhost:${port}`)
);
