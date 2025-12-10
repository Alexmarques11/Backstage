const pool = require("./concertsDb");

async function createTables() {
  try {
    // Locations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "locations" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(150),
        "address" VARCHAR(250),
        "geo_location" VARCHAR(250)
      )
    `);

    // Music genres
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "music_genres" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) UNIQUE
      )
    `);

    // Concerts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "concerts" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(200) NOT NULL,
        "datetime" TIMESTAMP,
        "tickets_available" BOOLEAN,
        "purchase_url" VARCHAR(250),
        "location_id" INTEGER REFERENCES "locations"("id") ON DELETE SET NULL,
        "image_url" VARCHAR(250)
      )
    `);

    // Concerts & genres (many-to-many)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "concerts_genres" (
        "concert_id" INTEGER REFERENCES "concerts"("id") ON DELETE CASCADE,
        "genre_id" INTEGER REFERENCES "music_genres"("id") ON DELETE CASCADE,
        PRIMARY KEY ("concert_id", "genre_id")
      )
    `);

    console.log("✅ Concert tables created or already exist.");

    // Inserir gêneros se não existirem
    const genres = [
      "Pop",
      "Pop Rock",
      "Pop Punk",
      "Pop Soul",
      "Pop Indie",
      "Rock",
      "Hard Rock",
      "Soft Rock",
      "Classic Rock",
      "Alternative Rock",
      "Indie Rock",
      "Punk Rock",
      "Grunge",
      "Metal",
      "Heavy Metal",
      "Thrash Metal",
      "Black Metal",
      "Death Metal",
      "Doom Metal",
      "Symphonic Metal",
      "Power Metal",
      "Nu Metal",
      "Funk",
      "Funk Rock",
      "Funk Soul",
      "Soul",
      "Neo Soul",
      "R&B",
      "Contemporary R&B",
      "Hip Hop",
      "Rap",
      "Trap",
      "Drill",
      "Boom Bap",
      "Lo-Fi Hip Hop",
      "Jazz",
      "Smooth Jazz",
      "Jazz Fusion",
      "Bebop",
      "Swing",
      "Blues",
      "Delta Blues",
      "Electric Blues",
      "Country",
      "Bluegrass",
      "Country Pop",
      "Folk",
      "Indie Folk",
      "Acoustic",
      "Singer-Songwriter",
      "Classical",
      "Baroque",
      "Romantic",
      "Opera",
      "Orchestral",
      "Choral",
      "Electronic",
      "EDM",
      "House",
      "Deep House",
      "Progressive House",
      "Tech House",
      "Electro House",
      "Trance",
      "Psytrance",
      "Dubstep",
      "Brostep",
      "Drum and Bass",
      "Jungle",
      "Techno",
      "Minimal Techno",
      "Hard Techno",
      "Chillout",
      "Chillstep",
      "Ambient",
      "Downtempo",
      "Synthwave",
      "Retrowave",
      "Vaporwave",
      "Future Bass",
      "Future Funk",
      "Reggae",
      "Reggae Fusion",
      "Ska",
      "Dub",
      "Dancehall",
      "Latin",
      "Reggaeton",
      "Bachata",
      "Salsa",
      "Merengue",
      "Cumbia",
      "Flamenco",
      "Fado",
      "Samba",
      "Bossa Nova",
      "MPB",
      "K-Pop",
      "J-Pop",
      "J-Rock",
      "C-Pop",
      "Mandopop",
      "Cantopop",
      "Afrobeat",
      "Afrobeats",
      "Amapiano",
      "Highlife",
      "Makossa",
      "Zouk",
      "Zumba",
      "Gospel",
      "Christian Rock",
      "Christian Pop",
      "Worship",
      "World Music",
      "Meditation Music",
      "New Age",
      "Soundtrack",
      "Film Score",
      "Game Soundtrack",
      "Experimental",
      "Avant-Garde",
      "Industrial",
      "Noise",
      "Post-Rock",
      "Post-Punk",
      "Shoegaze",
      "Dream Pop",
      "Gothic Rock",
      "Emo",
      "Screamo",
      "Alternative Metal",
      "Melodic Metalcore",
      "Metalcore",
      "Post-Hardcore",
      "Punk",
      "Garage Rock",
      "Garage Punk",
      "Indie Pop",
      "Electropop",
      "Hyperpop",
      "Disco",
      "Eurodance",
      "Italo Disco",
      "Funk Carioca",
      "Pagode",
      "Kuduro",
      "Semba",
      "Tango",
      "Chanson",
      "Opera Rock",
      "Progressive Rock",
      "Progressive Metal",
      "Math Rock",
      "Mathcore",
      "Chiptune",
      "8-bit",
      "Breakbeat",
      "UK Garage",
      "Grime",
      "IDM",
      "Glitch",
      "Space Rock",
      "Drone",
      "Folk Rock",
      "Celtic",
      "Irish Folk",
      "Medieval",
      "Barbershop",
      "A Cappella",
      "Musical Theatre",
      "Broadway",
      "Lounge",
      "Easy Listening",
      "Trip-Hop",
      "Electro Swing",
      "Swing Revival",
      "Blue-Eyed Soul",
      "Neo-Classical",
      "Minimalism",
      "Glam Rock",
      "Glam Metal",
      "Stoner Rock",
      "Stoner Metal",
    ];

    await pool.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS music_genres_name_unique_idx
  ON music_genres(name)
`);

    for (const genre of genres) {
      await pool.query(
        `INSERT INTO music_genres (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [genre]
      );
    }

    console.log("Tables created or already exist.");
  } catch (err) {
    console.error("Error creating tables:", err);
    process.exit(1);
  }
}

module.exports = createTables;
