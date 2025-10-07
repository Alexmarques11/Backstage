const express = require("express");
const pool = require("./database");
const port = 3000;

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
            lastname VARCHAR(100) NOT NULL
        )`);
    res.status(200).send({ message: "Table created" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating table");
  }
});

app.listen(port, () =>
  console.log(`Server running on port http://localhost:${port}`)
);
