require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('./database');
const port = 3000;

const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());

// Health check endpoint for Kubernetes probes
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'backstage-server',
    timestamp: new Date().toISOString()
  });
});

app.get('/', async (req, res) => {
  try {
    const data = await pool.query(`SELECT * FROM users`);
    res.status(200).send(data.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving users');
  }
});

app.post('/', async (req, res) => {
  const { name, lastname, username, email, password } = req.body;

  if (!name || !lastname || !username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (name, lastname, username, email, password)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, lastname, username, email, hashedPassword]
    );

    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating user' });
  }
});

//Setup route to create users table if it doesn't exist

app.get('/setup', async (req, res) => {
  let createTablesQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        lastname VARCHAR(100) NOT NULL,
        age INT,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        musical_genre TEXT[]
      );
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT,
        token TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );`;

  try {
    await pool.query(createTablesQuery);
    res.status(200).send({ message: 'Table created' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating table');
  }
});

app.get('/posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, name, lastname, age, username, email, musical_genre
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

//? Users

app.get('/users/profile', async (req, res) => {
  try {
    const { username } = req.body;

    const result = await pool.query(
      `SELECT name, lastname, age, username, musical_genre
      FROM users
      WHERE username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'user not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

app.patch('/users/profile', async (req, res) => {
  try {
    const { username, name, lastname, age } = req.body;

    const result = await pool.query(
      `UPDATE users
      SET name = $2, lastname = $3, age = $4
      WHERE username = $1`,
      [username, name, lastname, age]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

app.get('/users/preferences', async (req, res) => {
  try {
    const { username } = req.body;

    const result = await pool.query(
      `SELECT musical_genre
      FROM users
      WHERE username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'user not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

app.patch('/users/preferences', async (req, res) => {
  try {
    const { username, musical_genre } = req.body;

    const result = await pool.query(
      `UPDATE users
      SET musical_genre = $2
      WHERE username = $1`,
      [username, musical_genre]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

app.listen(port, '0.0.0.0', () =>
  console.log(`Server running on port http://0.0.0.0:${port}`)
);
