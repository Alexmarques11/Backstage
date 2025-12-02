require("dotenv").config();

const express = require("express");
const publicationPool = require("./publicationDb");
const authPool = require("../authentication/db/authDb"); // Auth DB from authentication directory
const notificationRouter = require("./routes/notificationRoute");
const postRouter = require("./routes/postRoute");
const port = 3000;

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

// Routes
app.use("/notifications", notificationRouter);
app.use("/posts", postRouter);

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
    
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('like', 'comment', 'event', 'system', 'ticket_purchase', 'event_reminder')),
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      related_id INT,
      related_type VARCHAR(50) CHECK (related_type IN ('post', 'comment', 'event', 'ticket')),
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_event_date ON posts(event_date);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
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

app.listen(port, "0.0.0.0", () =>
  console.log(`Server running on port http://0.0.0.0:${port}`)
);
