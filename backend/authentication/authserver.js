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
    // User roles table first (referenced by users)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100)
      )
    `);
    
    // Music genres table (shared reference data)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS music_genres (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
      )
    `);
    
    // Users table with composite primary key
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL,
        name VARCHAR(100),
        lastname VARCHAR(100),
        birthdate DATE,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(250) NOT NULL,
        notifications_enabled BOOLEAN DEFAULT true,
        role INTEGER REFERENCES user_roles(id),
        avatar_url VARCHAR(250),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, role)
      )
    `);
    
    // Users genres junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users_genres (
        user_id INTEGER,
        genre_id INTEGER REFERENCES music_genres(id),
        PRIMARY KEY (user_id, genre_id)
      )
    `);
    
    // Refresh tokens
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        token VARCHAR(500) UNIQUE NOT NULL,
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
