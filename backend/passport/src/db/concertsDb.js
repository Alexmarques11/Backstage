const { Pool } = require("pg");

// Passport Database - for user concert posts/memories
const useSSL = process.env.DATABASE_SSL === "true"; // apenas ativa SSL se for exatamente "true"

const passportPool = new Pool({
  host: process.env.PASSPORT_DB_HOST || process.env.DATABASE_HOST || "localhost",
  port: process.env.PASSPORT_DB_PORT || process.env.DATABASE_PORT || 5432,
  user: process.env.PASSPORT_DB_USER || process.env.DATABASE_USER,
  password: process.env.PASSPORT_DB_PASSWORD || process.env.DATABASE_PASSWORD,
  database:
    process.env.PASSPORT_DB_NAME || process.env.DATABASE_NAME || "passport_db",
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

// Validate required environment variables
if (!process.env.PASSPORT_DB_USER && !process.env.DATABASE_USER) {
  console.error(
    "⚠️  SECURITY ERROR: PASSPORT_DB_USER (or DATABASE_USER) is required!"
  );
  console.error(
    "   Set these environment variables before starting the application."
  );
  process.exit(1);
}

if (!process.env.PASSPORT_DB_PASSWORD && !process.env.DATABASE_PASSWORD) {
  console.error(
    "⚠️  SECURITY ERROR: PASSPORT_DB_PASSWORD (or DATABASE_PASSWORD) is required!"
  );
  console.error(
    "   Set these environment variables before starting the application."
  );
  process.exit(1);
}

module.exports = passportPool;
