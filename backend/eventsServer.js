require('dotenv').config();

const express = require('express');
const eventsPool = require('./eventsDb');
const port = 7000;

const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());

// Health check endpoint for Kubernetes probes
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'backstage-events',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Backstage Events Aggregation Service', 
    version: '1.0.0',
    description: 'External events API aggregation and caching'
  });
});

// Setup route to create events tables
app.get('/setup', async (req, res) => {
  let createTablesQuery = `
    CREATE TABLE IF NOT EXISTS external_events (
      id SERIAL PRIMARY KEY,
      external_id VARCHAR(255) UNIQUE NOT NULL,
      source VARCHAR(100) NOT NULL,
      event_name VARCHAR(255) NOT NULL,
      artist_name VARCHAR(255),
      venue_name VARCHAR(255),
      venue_location VARCHAR(255),
      event_date TIMESTAMP NOT NULL,
      description TEXT,
      price_range VARCHAR(100),
      ticket_url TEXT,
      image_url TEXT,
      genre VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS event_sources (
      id SERIAL PRIMARY KEY,
      source_name VARCHAR(100) UNIQUE NOT NULL,
      api_endpoint TEXT,
      api_key_required BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      last_sync TIMESTAMP,
      sync_frequency_hours INT DEFAULT 24,
      total_events_imported INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS user_event_interests (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      event_id INT NOT NULL,
      interest_type VARCHAR(50) CHECK (interest_type IN ('interested', 'going', 'notified')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES external_events(id) ON DELETE CASCADE,
      UNIQUE(user_id, event_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_events_date ON external_events(event_date);
    CREATE INDEX IF NOT EXISTS idx_events_source ON external_events(source);
    CREATE INDEX IF NOT EXISTS idx_events_genre ON external_events(genre);
    CREATE INDEX IF NOT EXISTS idx_events_location ON external_events(venue_location);
    CREATE INDEX IF NOT EXISTS idx_user_interests ON user_event_interests(user_id);
  `;

  try {
    await eventsPool.query(createTablesQuery);
    res.status(200).json({ message: 'Events tables created successfully' });
  } catch (err) {
    console.error('Error creating events tables:', err);
    res.status(500).json({ message: 'Error creating tables', error: err.message });
  }
});

// Get all external events
app.get('/events', async (req, res) => {
  try {
    const { genre, location, date_from, date_to, source, limit = 50, offset = 0 } = req.query;
    
    let query = `SELECT * FROM external_events WHERE 1=1`;
    let params = [];
    let paramCount = 1;

    if (genre) {
      query += ` AND genre = $${paramCount}`;
      params.push(genre);
      paramCount++;
    }

    if (location) {
      query += ` AND venue_location ILIKE $${paramCount}`;
      params.push(`%${location}%`);
      paramCount++;
    }

    if (date_from) {
      query += ` AND event_date >= $${paramCount}`;
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      query += ` AND event_date <= $${paramCount}`;
      params.push(date_to);
      paramCount++;
    }

    if (source) {
      query += ` AND source = $${paramCount}`;
      params.push(source);
      paramCount++;
    }

    query += ` ORDER BY event_date ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await eventsPool.query(query, params);
    
    const countQuery = `SELECT COUNT(*) FROM external_events WHERE 1=1` + 
      (genre ? ` AND genre = '${genre}'` : '') +
      (location ? ` AND venue_location ILIKE '%${location}%'` : '') +
      (date_from ? ` AND event_date >= '${date_from}'` : '') +
      (date_to ? ` AND event_date <= '${date_to}'` : '') +
      (source ? ` AND source = '${source}'` : '');
    
    const countResult = await eventsPool.query(countQuery);

    res.json({
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
      events: result.rows
    });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// Get event by ID
app.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await eventsPool.query(
      `SELECT * FROM external_events WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Error fetching event' });
  }
});

// Add/Update external event (from API sync)
app.post('/events', authenticateToken, async (req, res) => {
  try {
    const { 
      external_id, source, event_name, artist_name, venue_name, venue_location,
      event_date, description, price_range, ticket_url, image_url, genre 
    } = req.body;

    if (!external_id || !source || !event_name || !event_date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await eventsPool.query(
      `INSERT INTO external_events 
        (external_id, source, event_name, artist_name, venue_name, venue_location, 
         event_date, description, price_range, ticket_url, image_url, genre, last_synced)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
       ON CONFLICT (external_id) 
       DO UPDATE SET 
         event_name = $3,
         artist_name = $4,
         venue_name = $5,
         venue_location = $6,
         event_date = $7,
         description = $8,
         price_range = $9,
         ticket_url = $10,
         image_url = $11,
         genre = $12,
         updated_at = CURRENT_TIMESTAMP,
         last_synced = CURRENT_TIMESTAMP
       RETURNING *`,
      [external_id, source, event_name, artist_name, venue_name, venue_location,
       event_date, description, price_range, ticket_url, image_url, genre]
    );

    res.status(201).json({
      message: 'Event added/updated successfully',
      event: result.rows[0]
    });
  } catch (err) {
    console.error('Error adding event:', err);
    res.status(500).json({ message: 'Error adding event', error: err.message });
  }
});

// Mark user interest in event
app.post('/interests', authenticateToken, async (req, res) => {
  try {
    const { user_id, event_id, interest_type } = req.body;

    if (!user_id || !event_id || !interest_type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['interested', 'going', 'notified'].includes(interest_type)) {
      return res.status(400).json({ message: 'Invalid interest_type' });
    }

    const result = await eventsPool.query(
      `INSERT INTO user_event_interests (user_id, event_id, interest_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, event_id) 
       DO UPDATE SET interest_type = $3, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, event_id, interest_type]
    );

    res.status(201).json({
      message: 'Interest saved successfully',
      interest: result.rows[0]
    });
  } catch (err) {
    console.error('Error saving interest:', err);
    res.status(500).json({ message: 'Error saving interest', error: err.message });
  }
});

// Get user's interested events
app.get('/user/:userId/interests', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await eventsPool.query(
      `SELECT e.*, i.interest_type, i.created_at as marked_at
       FROM external_events e
       JOIN user_event_interests i ON e.id = i.event_id
       WHERE i.user_id = $1
       ORDER BY e.event_date ASC`,
      [userId]
    );

    res.json({
      total: result.rows.length,
      interests: result.rows
    });
  } catch (err) {
    console.error('Error fetching user interests:', err);
    res.status(500).json({ message: 'Error fetching interests' });
  }
});

// Get event sources
app.get('/sources', async (req, res) => {
  try {
    const result = await eventsPool.query(
      `SELECT * FROM event_sources ORDER BY source_name`
    );

    res.json({
      total: result.rows.length,
      sources: result.rows
    });
  } catch (err) {
    console.error('Error fetching sources:', err);
    res.status(500).json({ message: 'Error fetching sources' });
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

app.listen(port, '0.0.0.0', () =>
  console.log(`Events Server running on port http://0.0.0.0:${port}`)
);
