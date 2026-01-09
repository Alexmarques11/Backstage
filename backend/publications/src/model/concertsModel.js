const concertsPool = require("../db/concertsDb");

//Helper: Get genres for concert IDs
const getGenresForConcerts = async (concertIds) => {
  if (!concertIds || concertIds.length === 0) return {};

  const result = await concertsPool.query(
    `SELECT cg.user_concert_id, mg.id, mg.name 
     FROM music_genres mg
     INNER JOIN user_concerts_genres cg ON mg.id = cg.genre_id
     WHERE cg.user_concert_id = ANY($1)`,
    [concertIds]
  );

  const genresByConcer = {};
  result.rows.forEach((row) => {
    if (!genresByConcer[row.user_concert_id]) {
      genresByConcer[row.user_concert_id] = [];
    }
    genresByConcer[row.user_concert_id].push({ id: row.id, name: row.name });
  });

  return genresByConcer;
};

exports.deleteConcert = async (concertId) => {
  const client = await concertsPool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM user_concerts_genres WHERE user_concert_id = $1`, [
      concertId,
    ]);
    const result = await client.query(
      `DELETE FROM user_concerts WHERE id = $1 RETURNING id, title`,
      [concertId]
    );
    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.deleteConcertsByUserId = async (userId) => {
  const client = await concertsPool.connect();
  try {
    await client.query("BEGIN");
    
    // Delete all genre associations for user's concerts
    await client.query(
      `DELETE FROM user_concerts_genres 
       WHERE user_concert_id IN (
         SELECT id FROM user_concerts WHERE user_id = $1
       )`,
      [userId]
    );
    
    // Delete all concerts from the user
    const result = await client.query(
      `DELETE FROM user_concerts WHERE user_id = $1 RETURNING id`,
      [userId]
    );
    
    await client.query("COMMIT");
    return result.rows; // Returns array of deleted concert IDs
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

//Get location by name and address
exports.getLocationByNameAndAddress = async (name, address) => {
  const result = await concertsPool.query(
    `SELECT id FROM locations WHERE name = $1 AND address = $2`,
    [name, address]
  );
  return result.rows[0]?.id || null;
};

//Insert location
exports.insertLocation = async (name, address, geoLocation) => {
  const result = await concertsPool.query(
    `INSERT INTO locations (name, address, geo_location)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [name, address, geoLocation || null]
  );
  return result.rows[0].id;
};

//Create concert
exports.createConcert = async (
  userId,
  title,
  description,
  date,
  locationId,
  imageUrl
) => {
  const result = await concertsPool.query(
    `INSERT INTO user_concerts (user_id, title, description, date, location_id, image_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [userId, title, description, date, locationId, imageUrl]
  );
  return result.rows[0].id;
};

//Get concert by ID with genres
exports.getConcertById = async (concertId) => {
  const result = await concertsPool.query(
    `SELECT c.id, c.user_id, c.title, c.description, c.date, c.image_url, c.created_at,
            l.id as location_id, l.name as location_name, l.address, l.geo_location
     FROM user_concerts c
     LEFT JOIN locations l ON c.location_id = l.id
     WHERE c.id = $1`,
    [concertId]
  );

  if (!result.rows[0]) return null;

  const concert = result.rows[0];

  //Fetch associated genres
  const genresResult = await concertsPool.query(
    `SELECT mg.id, mg.name FROM music_genres mg
     INNER JOIN user_concerts_genres cg ON mg.id = cg.genre_id
     WHERE cg.user_concert_id = $1`,
    [concertId]
  );

  concert.generos = genresResult.rows;

  return concert;
};

//List concerts
exports.listConcerts = async (limit, offset) => {
  const result = await concertsPool.query(
    `SELECT c.*, l.name as location_name, l.address
     FROM user_concerts c
     LEFT JOIN locations l ON c.location_id = l.id
     ORDER BY c.date DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  // Add genres to each concert
  const concertIds = result.rows.map((c) => c.id);
  const genres = await getGenresForConcerts(concertIds);
  result.rows.forEach((c) => {
    c.generos = genres[c.id] || [];
  });

  return result.rows;
};

//Filter concerts by location (name OR address)
exports.filterByLocation = async (locationName, limit, offset) => {
  const result = await concertsPool.query(
    `SELECT c.*, l.name as location_name, l.address
     FROM user_concerts c
     LEFT JOIN locations l ON c.location_id = l.id
     WHERE l.name ILIKE $1 OR l.address ILIKE $1
     ORDER BY c.date DESC
     LIMIT $2 OFFSET $3`,
    [`%${locationName}%`, limit, offset]
  );

  // Add genres to each concert
  const concertIds = result.rows.map((c) => c.id);
  const genres = await getGenresForConcerts(concertIds);
  result.rows.forEach((c) => {
    c.generos = genres[c.id] || [];
  });

  return result.rows;
};

//Filter concerts by multiple criteria
exports.filterConcerts = async (filters, limit, offset) => {
  const { title, location, genre } = filters;

  let query = `SELECT c.*, l.name as location_name, l.address`;
  let params = [];
  let paramCount = 1;
  let whereConditions = [];

  // Add title filter
  if (title) {
    params.push(`%${title}%`);
    whereConditions.push(`c.title ILIKE $${paramCount}`);
    paramCount++;
  }

  query += ` FROM user_concerts c LEFT JOIN locations l ON c.location_id = l.id`;

  // Add genre filter (requires JOIN)
  if (genre) {
    query += ` INNER JOIN user_concerts_genres cg ON c.id = cg.user_concert_id
              INNER JOIN music_genres mg ON cg.genre_id = mg.id`;
    params.push(`%${genre}%`);
    whereConditions.push(`mg.name ILIKE $${paramCount}`);
    paramCount++;
  }

  // Add location filter
  if (location) {
    params.push(`%${location}%`);
    whereConditions.push(
      `(l.name ILIKE $${paramCount} OR l.address ILIKE $${paramCount})`
    );
    paramCount++;
  }

  // Build WHERE clause
  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(" AND ")}`;
  }

  // Order by date DESC
  query += ` ORDER BY c.date DESC`;

  query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);

  const result = await concertsPool.query(query, params);

  // Add genres to each concert
  const concertIds = result.rows.map((c) => c.id);
  const genres = await getGenresForConcerts(concertIds);
  result.rows.forEach((c) => {
    c.generos = genres[c.id] || [];
  });

  return result.rows;
};

//Filter concerts by title
exports.filterByTitle = async (title, limit, offset) => {
  const result = await concertsPool.query(
    `SELECT c.*, l.name as location_name, l.address
     FROM user_concerts c
     LEFT JOIN locations l ON c.location_id = l.id
     WHERE c.title ILIKE $1
     ORDER BY c.date DESC
     LIMIT $2 OFFSET $3`,
    [`%${title}%`, limit, offset]
  );

  // Add genres to each concert
  const concertIds = result.rows.map((c) => c.id);
  const genres = await getGenresForConcerts(concertIds);
  result.rows.forEach((c) => {
    c.generos = genres[c.id] || [];
  });

  return result.rows;
};

//Filter concerts by genre
exports.filterByGenre = async (genreName, limit, offset) => {
  const result = await concertsPool.query(
    `SELECT c.*, l.name as location_name, l.address
     FROM user_concerts c
     LEFT JOIN locations l ON c.location_id = l.id
     INNER JOIN user_concerts_genres cg ON c.id = cg.user_concert_id
     INNER JOIN music_genres mg ON cg.genre_id = mg.id
     WHERE mg.name ILIKE $1
     ORDER BY c.date DESC
     LIMIT $2 OFFSET $3`,
    [`%${genreName}%`, limit, offset]
  );

  // Add genres to each concert
  const concertIds = result.rows.map((c) => c.id);
  const genres = await getGenresForConcerts(concertIds);
  result.rows.forEach((c) => {
    c.generos = genres[c.id] || [];
  });

  return result.rows;
};

//Get genre ID
exports.getGenreId = async (genreName) => {
  const result = await concertsPool.query(
    `SELECT id FROM music_genres WHERE name = $1`,
    [genreName]
  );
  return result.rows[0]?.id || null;
};

//Add genre to concert
exports.addGenreToConcert = async (concertId, genreId) => {
  await concertsPool.query(
    `INSERT INTO user_concerts_genres (user_concert_id, genre_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [concertId, genreId]
  );
};

//Update concert
exports.updateConcert = async (
  concertId,
  userId,
  title,
  description,
  date,
  locationId,
  imageUrl
) => {
  const result = await concertsPool.query(
    `UPDATE user_concerts
     SET user_id = COALESCE($2, user_id),
         title = COALESCE($3, title),
         description = COALESCE($4, description),
         date = COALESCE($5, date),
         location_id = COALESCE($6, location_id),
         image_url = COALESCE($7, image_url)
     WHERE id = $1
     RETURNING *`,
    [concertId, userId, title, description, date, locationId, imageUrl]
  );
  return result.rows[0] || null;
};
