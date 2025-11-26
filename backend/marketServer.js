require('dotenv').config();

const express = require('express');
const marketPool = require('./marketDb');
const port = 6000;

const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());

// Health check endpoint for Kubernetes probes
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'backstage-market',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Backstage Marketplace Service', 
    version: '1.0.0',
    description: 'Ticket marketplace for buying and selling'
  });
});

// Setup route to create market tables
app.get('/setup', async (req, res) => {
  let createTablesQuery = `
    CREATE TABLE IF NOT EXISTS market_place (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      ticket_description TEXT,
      suggested_price DECIMAL(10,2),
      ticket_quantity INT NOT NULL CHECK (ticket_quantity > 0),
      status INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS ticket_transactions (
      id SERIAL PRIMARY KEY,
      listing_id INT NOT NULL,
      buyer_id INT NOT NULL,
      seller_id INT NOT NULL,
      quantity INT NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      transaction_status VARCHAR(50) DEFAULT 'pending' CHECK (transaction_status IN ('pending', 'completed', 'cancelled', 'refunded')),
      payment_method VARCHAR(100),
      transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      FOREIGN KEY (listing_id) REFERENCES market_place(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS marketplace_reviews (
      id SERIAL PRIMARY KEY,
      transaction_id INT NOT NULL,
      reviewer_id INT NOT NULL,
      reviewed_user_id INT NOT NULL,
      rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES ticket_transactions(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_market_user ON market_place(user_id);
    CREATE INDEX IF NOT EXISTS idx_market_status ON market_place(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON ticket_transactions(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_seller ON ticket_transactions(seller_id);
  `;

  try {
    await marketPool.query(createTablesQuery);
    res.status(200).json({ message: 'Market tables created successfully' });
  } catch (err) {
    console.error('Error creating market tables:', err);
    res.status(500).json({ message: 'Error creating tables', error: err.message });
  }
});

// Get all active listings
app.get('/listings', async (req, res) => {
  try {
    const { concert_id, max_price, sort } = req.query;
    
    let query = `SELECT * FROM ticket_listings WHERE status = 'active' AND available_quantity > 0`;
    let params = [];
    let paramCount = 1;

    if (concert_id) {
      query += ` AND concert_id = $${paramCount}`;
      params.push(concert_id);
      paramCount++;
    }

    if (max_price) {
      query += ` AND price <= $${paramCount}`;
      params.push(max_price);
      paramCount++;
    }

    query += ` ORDER BY ${sort === 'price_asc' ? 'price ASC' : sort === 'price_desc' ? 'price DESC' : 'created_at DESC'}`;

    const result = await marketPool.query(query, params);
    res.json({
      total: result.rows.length,
      listings: result.rows
    });
  } catch (err) {
    console.error('Error fetching listings:', err);
    res.status(500).json({ message: 'Error fetching listings' });
  }
});

// Get listing by ID
app.get('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await marketPool.query(
      `SELECT * FROM ticket_listings WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching listing:', err);
    res.status(500).json({ message: 'Error fetching listing' });
  }
});

// Create new listing
app.post('/listings', authenticateToken, async (req, res) => {
  try {
    const { seller_id, concert_id, concert_name, concert_date, ticket_type, price, quantity, description } = req.body;

    if (!seller_id || !concert_id || !concert_name || !concert_date || !price || !quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await marketPool.query(
      `INSERT INTO ticket_listings 
        (seller_id, concert_id, concert_name, concert_date, ticket_type, price, quantity, available_quantity, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8)
       RETURNING *`,
      [seller_id, concert_id, concert_name, concert_date, ticket_type, price, quantity, description]
    );

    res.status(201).json({
      message: 'Listing created successfully',
      listing: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating listing:', err);
    res.status(500).json({ message: 'Error creating listing', error: err.message });
  }
});

// Purchase ticket
app.post('/purchase', authenticateToken, async (req, res) => {
  try {
    const { listing_id, buyer_id, quantity, payment_method } = req.body;

    if (!listing_id || !buyer_id || !quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check listing availability
    const listing = await marketPool.query(
      `SELECT * FROM ticket_listings WHERE id = $1 AND status = 'active'`,
      [listing_id]
    );

    if (listing.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found or not active' });
    }

    const listingData = listing.rows[0];

    if (listingData.available_quantity < quantity) {
      return res.status(400).json({ message: 'Not enough tickets available' });
    }

    const totalPrice = listingData.price * quantity;

    // Create transaction
    const transaction = await marketPool.query(
      `INSERT INTO ticket_transactions 
        (listing_id, buyer_id, seller_id, quantity, total_price, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [listing_id, buyer_id, listingData.seller_id, quantity, totalPrice, payment_method]
    );

    // Update listing quantity
    const newQuantity = listingData.available_quantity - quantity;
    const newStatus = newQuantity === 0 ? 'sold' : 'active';

    await marketPool.query(
      `UPDATE ticket_listings 
       SET available_quantity = $1, status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newQuantity, newStatus, listing_id]
    );

    res.status(201).json({
      message: 'Purchase successful',
      transaction: transaction.rows[0]
    });
  } catch (err) {
    console.error('Error processing purchase:', err);
    res.status(500).json({ message: 'Error processing purchase', error: err.message });
  }
});

// Get user's listings
app.get('/user/:userId/listings', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await marketPool.query(
      `SELECT * FROM ticket_listings WHERE seller_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      total: result.rows.length,
      listings: result.rows
    });
  } catch (err) {
    console.error('Error fetching user listings:', err);
    res.status(500).json({ message: 'Error fetching listings' });
  }
});

// Get user's purchases
app.get('/user/:userId/purchases', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await marketPool.query(
      `SELECT t.*, l.concert_name, l.concert_date 
       FROM ticket_transactions t
       JOIN ticket_listings l ON t.listing_id = l.id
       WHERE t.buyer_id = $1 
       ORDER BY t.transaction_date DESC`,
      [userId]
    );

    res.json({
      total: result.rows.length,
      purchases: result.rows
    });
  } catch (err) {
    console.error('Error fetching purchases:', err);
    res.status(500).json({ message: 'Error fetching purchases' });
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
  console.log(`Market Server running on port http://0.0.0.0:${port}`)
);
