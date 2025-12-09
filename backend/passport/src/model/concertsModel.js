const passportPool = require("../db/concertsDb");

//Helper: Get genres for passport post IDs
const getGenresForPosts = async (postIds) => {
  if (!postIds || postIds.length === 0) return {};

  const result = await passportPool.query(
    `SELECT pg.passport_post_id, mg.id, mg.name 
     FROM music_genres mg
     INNER JOIN passport_genres pg ON mg.id = pg.genre_id
     WHERE pg.passport_post_id = ANY($1)`,
    [postIds]
  );

  const genresByPost = {};
  result.rows.forEach((row) => {
    if (!genresByPost[row.passport_post_id]) {
      genresByPost[row.passport_post_id] = [];
    }
    genresByPost[row.passport_post_id].push({ id: row.id, name: row.name });
  });

  return genresByPost;
};

exports.deleteConcert = async (postId) => {
  const client = await passportPool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM passport_genres WHERE passport_post_id = $1`, [
      postId,
    ]);
    const result = await client.query(
      `DELETE FROM passport_posts WHERE id = $1 RETURNING id, concert_title`,
      [postId]
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

//Get location by name and address
exports.getLocationByNameAndAddress = async (name, address) => {
  const result = await passportPool.query(
    `SELECT id FROM locations WHERE name = $1 AND address = $2`,
    [name, address]
  );
  return result.rows[0]?.id || null;
};

//Insert location
exports.insertLocation = async (name, address, geoLocation) => {
  const result = await passportPool.query(
    `INSERT INTO locations (name, address, geo_location)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [name, address, geoLocation || null]
  );
  return result.rows[0].id;
};

//Create passport post
exports.createConcert = async (
  user_id,
  concert_title,
  artist,
  description,
  rating,
  location,
  photos
) => {
  const result = await passportPool.query(
    `INSERT INTO passport_posts (user_id, concert_title, artist, description, rating, location_id, photos)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [user_id, concert_title, artist, description, rating, location, photos]
  );
  return result.rows[0];
};

//Get passport post by ID with genres
exports.getConcertById = async (postId) => {
  const result = await passportPool.query(
    `SELECT p.*, l.name as location_name, l.address
     FROM passport_posts p
     LEFT JOIN locations l ON p.location_id = l.id
     WHERE p.id = $1`,
    [postId]
  );

  if (!result.rows[0]) return null;

  const post = result.rows[0];

  //Fetch associated genres
  const genresResult = await passportPool.query(
    `SELECT mg.id, mg.name FROM music_genres mg
     INNER JOIN passport_genres pg ON mg.id = pg.genre_id
     WHERE pg.passport_post_id = $1`,
    [postId]
  );

  post.generos = genresResult.rows;

  return post;
};

//List passport posts
exports.listPassportPosts = async (user_id, limit, offset) => {
  const result = await passportPool.query(
    `SELECT p.*, l.name as location_name, l.address
     FROM passport_posts p
     LEFT JOIN locations l ON p.location_id = l.id
     WHERE p.user_id = $3 
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset, user_id]
  );

  // Add genres to each post
  const postIds = result.rows.map((p) => p.id);
  const genres = await getGenresForPosts(postIds);
  result.rows.forEach((p) => {
    p.generos = genres[p.id] || [];
  });
  return result.rows;
};

//Filter posts by location (name OR address)
exports.filterByLocation = async (locationName, limit, offset) => {
  const result = await passportPool.query(
    `SELECT p.*, l.name as location_name, l.address
     FROM passport_posts p
     LEFT JOIN locations l ON p.location_id = l.id
     WHERE l.name ILIKE $1 OR l.address ILIKE $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [`%${locationName}%`, limit, offset]
  );

  // Add genres to each post
  const postIds = result.rows.map((p) => p.id);
  const genres = await getGenresForPosts(postIds);
  result.rows.forEach((p) => {
    p.generos = genres[p.id] || [];
  });

  return result.rows;
};

//Filter posts by multiple criteria
exports.filterConcerts = async (filters, limit, offset) => {
  const { title, location, genre } = filters;

  let query = `SELECT p.*, l.name as location_name, l.address`;
  let params = [];
  let paramCount = 1;
  let whereConditions = [];

  // Add title filter (concert_title)
  if (title) {
    params.push(`%${title}%`);
    whereConditions.push(`p.concert_title ILIKE $${paramCount}`);
    paramCount++;
  }

  query += ` FROM passport_posts p LEFT JOIN locations l ON p.location_id = l.id`;

  // Add genre filter (requires JOIN)
  if (genre) {
    query += ` INNER JOIN passport_genres pg ON p.id = pg.passport_post_id
              INNER JOIN music_genres mg ON pg.genre_id = mg.id`;
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

  // Order by created_at DESC
  query += ` ORDER BY p.created_at DESC`;

  query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);

  const result = await passportPool.query(query, params);

  // Add genres to each post
  const postIds = result.rows.map((p) => p.id);
  const genres = await getGenresForPosts(postIds);
  result.rows.forEach((p) => {
    p.generos = genres[p.id] || [];
  });

  return result.rows;
};

//Filter posts by concert title
exports.filterByTitle = async (title, limit, offset) => {
  const result = await passportPool.query(
    `SELECT p.*, l.name as location_name, l.address
     FROM passport_posts p
     LEFT JOIN locations l ON p.location_id = l.id
     WHERE p.concert_title ILIKE $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [`%${title}%`, limit, offset]
  );

  // Add genres to each post
  const postIds = result.rows.map((p) => p.id);
  const genres = await getGenresForPosts(postIds);
  result.rows.forEach((p) => {
    p.generos = genres[p.id] || [];
  });

  return result.rows;
};

//Filter posts by genre
exports.filterByGenre = async (genreName, limit, offset) => {
  const result = await passportPool.query(
    `SELECT p.*, l.name as location_name, l.address
     FROM passport_posts p
     LEFT JOIN locations l ON p.location_id = l.id
     INNER JOIN passport_genres pg ON p.id = pg.passport_post_id
     INNER JOIN music_genres mg ON pg.genre_id = mg.id
     WHERE mg.name ILIKE $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [`%${genreName}%`, limit, offset]
  );

  // Add genres to each post
  const postIds = result.rows.map((p) => p.id);
  const genres = await getGenresForPosts(postIds);
  result.rows.forEach((p) => {
    p.generos = genres[p.id] || [];
  });

  return result.rows;
};

//Get genre ID
exports.getGenreId = async (genreName) => {
  const result = await passportPool.query(
    `SELECT id FROM music_genres WHERE name = $1`,
    [genreName]
  );
  return result.rows[0]?.id || null;
};

//Add genre to passport post
exports.addGenreToConcert = async (postId, genreId) => {
  await passportPool.query(
    `INSERT INTO passport_genres (passport_post_id, genre_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [postId, genreId]
  );
};

//Update passport post
exports.updateConcert = async (
  postId,
  concertTitle,
  artist,
  description,
  rating,
  location,
  photos
) => {
  const result = await passportPool.query(
    `UPDATE passport_posts
     SET concert_title = COALESCE($2, concert_title),
         artist = COALESCE($3, artist),
         description = COALESCE($4, description),
         rating = COALESCE($5, rating),
         location_id = COALESCE($6, location_id),
         photos = COALESCE($7, photos)
     WHERE id = $1
     RETURNING *`,
    [postId, concertTitle, artist, description, rating, location, photos]
  );
  return result.rows[0] || null;
};
