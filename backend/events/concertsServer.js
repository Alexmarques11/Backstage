require("dotenv").config();
const express = require("express");
const concertsRoutes = require("./src/routes/concertsRoutes");
const setupSwagger = require("./static/swagger");
const pool = require("./src/db/concertsDb");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "backstage-events", timestamp: new Date().toISOString() });
});

// Setup route to create events tables
app.get("/setup", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS concerts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200),
        date TIMESTAMP,
        price DECIMAL(10,2),
        tickets_available INTEGER,
        purchase_url VARCHAR(250),
        location_id INTEGER,
        image_url VARCHAR(250)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS concerts_genres (
        concert_id INTEGER REFERENCES concerts(id) ON DELETE CASCADE,
        genre_id INTEGER NOT NULL,
        PRIMARY KEY (concert_id, genre_id)
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
    
    res.json({ message: "Events tables created successfully" });
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Concerts public routes
app.use("/concerts", concertsRoutes);

// Swagger
setupSwagger(app);

app.listen(PORT, "0.0.0.0", () =>
  console.log(`🎵 Concert service running at http://0.0.0.0:${PORT}`)
);
