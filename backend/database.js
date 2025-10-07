const { Pool } = require("pg");

const pool = new Pool({
  host: "database",
  port: 5432,
  user: "user123",
  password: "123456",
  database: "backstage",
});

module.exports = pool;
