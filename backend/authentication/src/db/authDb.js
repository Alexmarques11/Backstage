const { Pool } = require("pg");

// Auth Database - for user authentication and profile management
const authPool = new Pool({
  host: process.env.AUTH_DB_HOST || process.env.DATABASE_HOST || "database",
  port: process.env.AUTH_DB_PORT || process.env.DATABASE_PORT || 5432,
  user: process.env.AUTH_DB_USER || process.env.DATABASE_USER,
  password: process.env.AUTH_DB_PASSWORD || process.env.DATABASE_PASSWORD,
  database: process.env.AUTH_DB_NAME || process.env.DATABASE_NAME || "auth_db",
  ssl:
    process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Validate required environment variables
if (!process.env.AUTH_DB_USER && !process.env.DATABASE_USER) {
  console.error(
    "⚠️  SECURITY ERROR: AUTH_DB_USER (or DATABASE_USER) is required!"
  );
  console.error(
    "   Set these environment variables before starting the application."
  );
  process.exit(1);
}

if (!process.env.AUTH_DB_PASSWORD && !process.env.DATABASE_PASSWORD) {
  console.error(
    "⚠️  SECURITY ERROR: AUTH_DB_PASSWORD (or DATABASE_PASSWORD) is required!"
  );
  console.error(
    "   Set these environment variables before starting the application."
  );
  process.exit(1);
}

module.exports = authPool;
