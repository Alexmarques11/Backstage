const concertsPool = require("../db/concertsDb");

exports.deleteMarketPost = async (MarketPostId) => {
  const client = await concertsPool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `DELETE FROM market_place_post WHERE id = $1 RETURNING id, description`,
      [MarketPostId]
    );
    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  console.log("Deleted market post with ID:", MarketPostId);
};

exports.createMarketPost = async (
  userId,
  description,
  suggestedPrice,
  ticketQuantity,
  status,
  imageUrl
) => {
  const result = await concertsPool.query(
    `INSERT INTO market_place_post (user_id, description, suggested_price, ticket_quantity, status, image_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [userId, description, suggestedPrice, ticketQuantity, status, imageUrl]
  );
  return result.rows[0].id;
};

exports.getMarketPostById = async (marketPostId) => {
  const result = await concertsPool.query(
    `SELECT c.*
     FROM market_place_post c
     WHERE c.id = $1`,
    [marketPostId]
  );

  if (!result.rows[0]) return null;

  return result.rows[0];
};

exports.listMarketPosts = async (limit, offset) => {
  const result = await concertsPool.query(
    `SELECT c.*
     FROM market_place_post c
     ORDER BY c.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows;
};

//Filter concerts by multiple criteria
exports.filterConcerts = async (filters, limit, offset) => {
  const { user, description, ticket_quantity, max_price } = filters;

  let query = `SELECT c.*`;
  let params = [];
  let paramCount = 1;
  let whereConditions = [];

  if (user) {
    params.push(user);
    whereConditions.push(`c.user_id = $${paramCount}`);
    paramCount++;
  }

  if (description) {
    params.push(`%${description}%`);
    whereConditions.push(`c.description ILIKE $${paramCount}`);
    paramCount++;
  }

  if (ticket_quantity) {
    params.push(ticket_quantity);
    whereConditions.push(`c.ticket_quantity >= $${paramCount}`);
    paramCount++;
  }

  if (max_price) {
    params.push(max_price);
    whereConditions.push(`c.suggested_price <= $${paramCount}`);
    paramCount++;
  }

  query += ` FROM market_place_post c`;

  // Build WHERE clause
  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(" AND ")}`;
  }

  // Order by date DESC
  query += ` ORDER BY c.created_at DESC`;

  query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);

  const result = await concertsPool.query(query, params);

  return result.rows;
};

exports.filterByDescription = async (description, limit, offset) => {
  const result = await concertsPool.query(
    `SELECT c.*
     FROM market_place_post c
     WHERE c.description ILIKE $1
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [`%${description}%`, limit, offset]
  );

  return result.rows;
};

exports.updateMarketPost = async (
  marketPostId,
  quantity,
  status,
  description,
  price,
  imageUrl
) => {
  const result = await concertsPool.query(
    `UPDATE market_place_post
     SET description = COALESCE($4, description),
         ticket_quantity = COALESCE($2, ticket_quantity),
         status = COALESCE($3, status),
         suggested_price = COALESCE($5, suggested_price),
         image_url = COALESCE($6, image_url)
     WHERE id = $1
     RETURNING *`,
    [marketPostId, quantity, status, description, price, imageUrl]
  );
  return result.rows[0] || null;
};
