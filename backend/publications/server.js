require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const publicationPool = require("./publicationDb");
const authPool = require("../authentication/db/authDb"); // Auth DB from authentication directory
const port = 3000;

const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

// Health check endpoint for Kubernetes probes
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "backstage-server",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", async (req, res) => {
  try {
    const data = await authPool.query(`SELECT * FROM users`);
    res.status(200).send(data.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving users");
  }
});

app.post("/", async (req, res) => {
  const { name, lastname, username, email, password } = req.body;

  if (!name || !lastname || !username || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await authPool.query(
      `INSERT INTO users (name, lastname, username, email, password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, lastname, username, email, hashedPassword]
    );

    res.status(201).json({
      message: "User created",
      id: result.rows[0].id,
    });
  } catch (err) {
    console.error("Error creating user:", err);

    // Check for unique constraint violation (PostgreSQL error code 23505)
    if (err.code === "23505") {
      if (err.constraint === "users_username_key") {
        return res.status(409).json({ message: "Username already exists" });
      }
      if (err.constraint === "users_email_key") {
        return res.status(409).json({ message: "Email already exists" });
      }
      return res.status(409).json({ message: "User already exists" });
    }

    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
});

//Setup route for auth database (users, genres, locations)
app.get("/setup", async (req, res) => {
  let createTablesQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        lastname VARCHAR(100) NOT NULL,
        birthdate DATE,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(250) NOT NULL,
        wallet DECIMAL(10,2) DEFAULT 0.00,
        notifications_enabled BOOLEAN DEFAULT true
      );
      
      CREATE TABLE IF NOT EXISTS music_genres (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      );
      
      CREATE TABLE IF NOT EXISTS users_genres (
        user_id INT NOT NULL,
        genre_id INT NOT NULL,
        PRIMARY KEY (user_id, genre_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES music_genres(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS user_concerts (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        genre VARCHAR(100),
        datetime TIMESTAMP NOT NULL,
        location_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS user_concerts_genres (
        user_concert_id INT NOT NULL,
        genre_id INT NOT NULL,
        PRIMARY KEY (user_concert_id, genre_id),
        FOREIGN KEY (user_concert_id) REFERENCES user_concerts(id) ON DELETE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES music_genres(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT,
        token VARCHAR(500) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150),
        address VARCHAR(250),
        geo_location VARCHAR(250)
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_user_concerts_user ON user_concerts(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_concerts_datetime ON user_concerts(datetime);`;

  try {
    await authPool.query(createTablesQuery);
    res.status(200).send({ message: "Table created" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating table");
  }
});

// Setup route for publication database (posts/content)
app.get("/setup-publications", async (req, res) => {
  let createTablesQuery = `
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      content TEXT,
      event_date TIMESTAMP,
      location_id INT,
      price DECIMAL(10,2),
      tickets_available INT,
      image_url TEXT,
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS posts_genres (
      post_id INT NOT NULL,
      genre_id INT NOT NULL,
      PRIMARY KEY (post_id, genre_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS post_likes (
      id SERIAL PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(post_id, user_id)
    );
    
    CREATE TABLE IF NOT EXISTS post_comments (
      id SERIAL PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_event_date ON posts(event_date);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
  `;

  try {
    await publicationPool.query(createTablesQuery);
    res
      .status(200)
      .json({ message: "Publication tables created successfully" });
  } catch (err) {
    console.error("Error creating publication tables:", err);
    res
      .status(500)
      .json({ message: "Error creating tables", error: err.message });
  }
});

app.get("/posts", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await authPool.query(
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

//? Users

app.get("/users/profile", async (req, res) => {
  try {
    const { username } = req.body;

    const result = await authPool.query(
      `SELECT name, lastname, age, username, musical_genre
      FROM users
      WHERE username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "user not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

app.patch("/users/profile", async (req, res) => {
  try {
    const { username, name, lastname, age } = req.body;

    const result = await authPool.query(
      `UPDATE users
      SET name = $2, lastname = $3, age = $4
      WHERE username = $1`,
      [username, name, lastname, age]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

app.get("/users/preferences", async (req, res) => {
  try {
    const { username } = req.body;

    const result = await authPool.query(
      `SELECT musical_genre
      FROM users
      WHERE username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "user not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

app.patch("/users/preferences", async (req, res) => {
  try {
    const { username, musical_genre } = req.body;

    const result = await authPool.query(
      `UPDATE users
      SET musical_genre = $2
      WHERE username = $1`,
      [username, musical_genre]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

app.listen(port, "0.0.0.0", () =>
  console.log(`Server running on port http://0.0.0.0:${port}`)
);
