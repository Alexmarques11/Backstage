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
  try {
    await pool.query(
      `INSERT INTO users (name, lastname) VALUES ('${name}', '${lastname}')`
    );
    res.status(200).send({ message: "User created" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating user");
  }
});

app.get("/setup", async (req, res) => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            lastname VARCHAR(100) NOT NULL,
            password VARCHAR(255) NOT NULL
        )`);
    res.status(200).send({ message: "Table created" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating table");
  }
});

app.get("/posts", authenticateToken, async (req, res) => {
  try {
    const username = req.user.name;

    const result = await pool.query(
      "SELECT id, name, lastname FROM users WHERE name = $1",
      [username]
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
