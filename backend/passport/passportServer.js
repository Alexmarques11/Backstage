require('dotenv').config();

const express = require('express');
const passportPool = require('./passportDb');
const port = 5000;

const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());

// Health check endpoint for Kubernetes probes
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'backstage-passport',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Backstage Passport Service', 
    version: '1.0.0',
    description: 'Concert passports and user statistics'
  });
});

// Setup route to create passport tables
app.get('/setup', async (req, res) => {
  let createTablesQuery = `
    CREATE TABLE IF NOT EXISTS passport_posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      concert_id INTEGER NOT NULL,
      artist VARCHAR(200),
      description TEXT,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      location_id INTEGER,
      photos TEXT[],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS passport_genres (
      passport_post_id INTEGER REFERENCES passport_posts(id) ON DELETE CASCADE,
      genre_id INTEGER NOT NULL,
      PRIMARY KEY (passport_post_id, genre_id)
    );
    
    CREATE TABLE IF NOT EXISTS locations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150),
      address VARCHAR(250),
      geo_location VARCHAR(250)
    );
    
    CREATE INDEX IF NOT EXISTS idx_passport_posts_user ON passport_posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_passport_posts_concert ON passport_posts(concert_id);
    CREATE INDEX IF NOT EXISTS idx_passport_posts_location ON passport_posts(location_id);
  `;

  try {
    await passportPool.query(createTablesQuery);
    res.status(200).json({ message: 'Passport tables created successfully' });
  } catch (err) {
    console.error('Error creating passport tables:', err);
    res.status(500).json({ message: 'Error creating tables', error: err.message });
  }
});

// Get user's concert passport (all attended concerts)
app.get('/passport/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await passportPool.query(
      `SELECT * FROM concert_passports WHERE user_id = $1 ORDER BY attended_at DESC`,
      [userId]
    );

    res.json({
      userId: parseInt(userId),
      totalConcerts: result.rows.length,
      concerts: result.rows
    });
  } catch (err) {
    console.error('Error fetching passport:', err);
    res.status(500).json({ message: 'Error fetching passport data' });
  }
});

// Add concert to passport
app.post('/passport', authenticateToken, async (req, res) => {
  try {
    const { user_id, concert_id, rating, review } = req.body;

    if (!user_id || !concert_id) {
      return res.status(400).json({ message: 'user_id and concert_id are required' });
    }

    const result = await passportPool.query(
      `INSERT INTO concert_passports (user_id, concert_id, rating, review)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, concert_id, rating, review]
    );

    // Update user statistics
    await updateUserStatistics(user_id);

    res.status(201).json({
      message: 'Concert added to passport',
      passport: result.rows[0]
    });
  } catch (err) {
    console.error('Error adding concert to passport:', err);
    res.status(500).json({ message: 'Error adding concert', error: err.message });
  }
});

// Get user statistics
app.get('/statistics/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await passportPool.query(
      `SELECT * FROM user_statistics WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Statistics not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Helper function to update user statistics
async function updateUserStatistics(userId) {
  try {
    const stats = await passportPool.query(
      `SELECT 
        COUNT(*) as total_concerts,
        COUNT(review) as total_reviews,
        AVG(rating) as avg_rating,
        MAX(attended_at) as last_concert
       FROM concert_passports
       WHERE user_id = $1`,
      [userId]
    );

    const { total_concerts, total_reviews, avg_rating, last_concert } = stats.rows[0];

    await passportPool.query(
      `INSERT INTO user_statistics (user_id, total_concerts_attended, total_reviews, average_rating, last_concert_date, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         total_concerts_attended = $2,
         total_reviews = $3,
         average_rating = $4,
         last_concert_date = $5,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, total_concerts, total_reviews, avg_rating, last_concert]
    );
  } catch (err) {
    console.error('Error updating statistics:', err);
  }
}

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

app.listen(port, '0.0.0.0', () =>
  console.log(`Passport Server running on port http://0.0.0.0:${port}`)
);
