const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DATABASE_HOST || "database",
  port: process.env.DATABASE_PORT || 5432,
  user: process.env.DATABASE_USER || "user123",
  password: process.env.DATABASE_PASSWORD || "123456",
  database: process.env.DATABASE_NAME || "backstage",
});

module.exports = pool;
