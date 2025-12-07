require("dotenv").config();
const express = require("express");
const concertsRoutes = require("./src/routes/concertsRoutes");
const adminRoutes = require("./src/routes/concertsAdminRoutes");
const setupSwagger = require("./static/swagger");
const pool = require("./src/db/concertsDb");

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "backstage-publications", timestamp: new Date().toISOString() });
});

// Setup database tables
app.get("/setup", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS music_genres (
        id SERIAL PRIMARY KEY,
        genre VARCHAR(50) NOT NULL UNIQUE
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_concerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(200),
        description TEXT,
        date TIMESTAMP,
        location_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        image_url VARCHAR(250)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_concerts_genres (
        user_concert_id INTEGER REFERENCES user_concerts(id) ON DELETE CASCADE,
        genre_id INTEGER REFERENCES music_genres(id) ON DELETE CASCADE,
        PRIMARY KEY (user_concert_id, genre_id)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150),
        address VARCHAR(250),
        geo_location VARCHAR(250)
      )
    `);
    
    res.json({ message: "Publications tables created successfully" });
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Concerts routes
app.use("/publications", concertsRoutes);
app.use("/publications-admin", adminRoutes);

// Swagger
setupSwagger(app);

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Publication service running at http://0.0.0.0:${PORT}`)
);
