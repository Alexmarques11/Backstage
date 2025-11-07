const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DATABASE_HOST || "database",
  port: process.env.DATABASE_PORT || 5432,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || "backstage",
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});
//type shit
//tests push
// Validate required environment variables
if (!process.env.DATABASE_USER || !process.env.DATABASE_PASSWORD) {
  console.error(" SECURITY ERROR: DATABASE_USER and DATABASE_PASSWORD environment variables are required!");
  console.error("   Never use hardcoded credentials in production.");
  console.error("   Set these environment variables before starting the application.");
  process.exit(1);
}

module.exports = pool;
