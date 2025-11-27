const { Pool } = require("pg");

// Market Database - for ticket marketplace, listings, and sales
const marketPool = new Pool({
  host: process.env.MARKET_DB_HOST || process.env.DATABASE_HOST || "database",
  port: process.env.MARKET_DB_PORT || process.env.DATABASE_PORT || 5432,
  user: process.env.MARKET_DB_USER || process.env.DATABASE_USER,
  password: process.env.MARKET_DB_PASSWORD || process.env.DATABASE_PASSWORD,
  database: process.env.MARKET_DB_NAME || process.env.DATABASE_NAME || "market_db",
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

// Validate required environment variables
if (!process.env.MARKET_DB_USER && !process.env.DATABASE_USER) {
  console.error("⚠️  SECURITY ERROR: MARKET_DB_USER (or DATABASE_USER) is required!");
  console.error("   Set these environment variables before starting the application.");
  process.exit(1);
}

if (!process.env.MARKET_DB_PASSWORD && !process.env.DATABASE_PASSWORD) {
  console.error("⚠️  SECURITY ERROR: MARKET_DB_PASSWORD (or DATABASE_PASSWORD) is required!");
  console.error("   Set these environment variables before starting the application.");
  process.exit(1);
}

module.exports = marketPool;
