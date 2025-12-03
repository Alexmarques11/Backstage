const concertsPool = require("../db/concertsDb");

async function createConcert(concert) {
  const client = await concertsPool.connect();
  try {
    await client.query("BEGIN");

    // 0. Verificar se o concerto já existe (evitar duplicatas)
    const existingConcert = await client.query(
      `SELECT id FROM concerts WHERE title = $1 AND datetime = $2`,
      [
        concert.titulo,
        concert.data && concert.hora
          ? `${concert.data} ${concert.hora}`
          : concert.data,
      ]
    );

    if (existingConcert.rows.length > 0) {
      console.log(
        `⏭️  Concerto "${concert.titulo}" já existe (ID: ${existingConcert.rows[0].id}). Ignorado.`
      );
      await client.query("COMMIT");
      return existingConcert.rows[0].id;
    }

    // 1. Procurar ou inserir local (locations)
    let locationId = null;
    if (concert.venue_name) {
      // Construir address completa: endereço, cidade, estado, país
      const addressParts = [
        concert.address,
        concert.cidade,
        concert.estado,
        concert.pais,
      ].filter(Boolean);

      const fullAddress = addressParts.join(", ") || null;

      const locationCheck = await client.query(
        `SELECT id FROM locations WHERE name = $1 AND address = $2`,
        [concert.venue_name, fullAddress]
      );

      if (locationCheck.rows.length > 0) {
        locationId = locationCheck.rows[0].id;
      } else {
        const locationResult = await client.query(
          `INSERT INTO locations (name, address, geo_location)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [concert.venue_name, fullAddress, concert.geo_location || null]
        );
        locationId = locationResult.rows[0].id;
      }
    }

    // 2. Construir datetime corretamente
    let datetime = null;
    if (concert.data) {
      const hora = concert.hora ?? "00:00:00";
      datetime = `${concert.data} ${hora}`;
    }

    // 3. Inserir concerto
    const concertResult = await client.query(
      `INSERT INTO concerts (title, datetime, tickets_available, purchase_url, location_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        concert.titulo,
        datetime,
        concert.bilhetes_disponiveis,
        concert.url_compra,
        locationId,
        concert.imagem,
      ]
    );
    const concertId = concertResult.rows[0].id;

    // 4. Inserir relacionamento com género
    if (
      concert.genero_musical &&
      concert.genero_musical !== "Não especificado"
    ) {
      // Obter o ID do género
      const genreResult = await client.query(
        `SELECT id FROM music_genres WHERE name = $1`,
        [concert.genero_musical]
      );

      if (genreResult.rows.length > 0) {
        const genreId = genreResult.rows[0].id;

        // Verificar se o relacionamento já existe
        const relCheck = await client.query(
          `SELECT 1 FROM concerts_genres WHERE concert_id = $1 AND genre_id = $2`,
          [concertId, genreId]
        );

        if (relCheck.rows.length === 0) {
          // Inserir apenas se não existir
          await client.query(
            `INSERT INTO concerts_genres (concert_id, genre_id) VALUES ($1, $2)`,
            [concertId, genreId]
          );
        }
      }
    }

    await client.query("COMMIT");
    console.log(
      `✅ Concerto "${concert.titulo}" guardado com sucesso (ID: ${concertId})`
    );
    return concertId;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Erro ao inserir concerto:", err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createConcert };
