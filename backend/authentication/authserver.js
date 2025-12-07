require("dotenv").config();
const express = require("express");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const setupSwagger = require("./static/swagger");
const pool = require("./src/db/authDb");

const app = express();
const port = 4000;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "backstage-auth" });
});

// Setup database tables
app.get("/setup", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        lastname VARCHAR(100),
        birthdate DATE,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(250) NOT NULL,
        notifications_enabled BOOLEAN DEFAULT true,
        role INTEGER,
        avatar_url VARCHAR(250),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS music_genres (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users_genres (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        genre_id INTEGER REFERENCES music_genres(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, genre_id)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    res.json({ message: "Auth tables created successfully" });
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Rotas de autenticação
app.use("/auth", authRoutes);

// Rotas de utilizador
app.use("/user", userRoutes);

// Swagger
setupSwagger(app);

// Apenas 1 vez
app.listen(port, "0.0.0.0", () =>
  console.log(`Server running at http://0.0.0.0:${port}`)
);
