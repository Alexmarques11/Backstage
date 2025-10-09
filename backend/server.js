require("dotenv").config();

const express = require("express");
const pool = require("./database");
const port = 3000;

const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const data = await pool.query(`SELECT * FROM users`);
    res.status(200).send(data.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving users");
  }
});

app.post("/", async (req, res) => {
  const { name, lastname } = req.body;

  // Validate input
  if (!name || !lastname) {
    return res.status(400).send({ error: "Name and lastname are required" });
  }

  try {
    await pool.query(`INSERT INTO users (name, lastname) VALUES ($1, $2)`, [
      name,
      lastname,
    ]);
    res.status(200).send({ message: "User created" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating user");
  }
});

//Setup route to create users table if it doesn't exist

app.get("/setup", async (req, res) => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            lastname VARCHAR(100) NOT NULL,
            age INT,
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            musical_genre TEXT[]
        )`);
    res.status(200).send({ message: "Table created" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating table");
  }
});

app.get("/posts", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
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
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.listen(port, () =>
  console.log(`Server running on port http://localhost:${port}`)
);
