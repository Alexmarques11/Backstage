const { Pool } = require("pg");

const notificationPool = new Pool({
  host: process.env.NOTIFICATION_DB_HOST || "localhost",
  user: process.env.NOTIFICATION_DB_USER || "postgres",
  password: process.env.NOTIFICATION_DB_PASSWORD || "password",
  database: process.env.NOTIFICATION_DB_NAME || "notification_db",
  port: process.env.NOTIFICATION_DB_PORT || 5432,
  ssl: process.env.NOTIFICATION_DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

module.exports = notificationPool;
