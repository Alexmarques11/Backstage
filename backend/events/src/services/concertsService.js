const { fetchConcerts } = require("./ticketMasterService");
const concertsModel = require("../model/concertsModel");
const axios = require("axios");

//Synchronize concerts from Ticketmaster API
exports.syncConcerts = async (filters) => {
  const { country = null, date = null, size = 20 } = filters;

  console.log(`📡 Synchronizing concerts...`);
  if (country) console.log(`Country: ${country}`);
  if (date) console.log(`Date: ${date}`);
  console.log(`Quantity: ${size}`);

  try {
    const concerts = await fetchConcerts(country, date, parseInt(size));

    if (concerts.length === 0) {
      return {
        success: true,
        message: "No concerts found",
        total: 0,
        filtros: {
          pais: country || "Default (US)",
          data: date || "From today",
          quantidade: size,
        },
      };
    }

    //Save concerts to the database
    let inserted = 0;
    let skipped = 0;

    for (const concert of concerts) {
      try {
        await saveConcert(concert);
        inserted++;
      } catch (err) {
        console.error("Error saving concert:", err.message);
        skipped++;
      }
    }

    return {
      success: true,
      message: "Concerts synchronized successfully",
      total: concerts.length,
      inseridos: inserted,
      duplicados: skipped,
      filtros: {
        pais: country || "Default (US)",
        data: date || "From today",
        quantidade: size,
      },
    };
  } catch (err) {
    throw new Error(`Error synchronizing concerts: ${err.message}`);
  }
};

//Save concert with all business logic
const saveConcert = async (concertData) => {
  const {
    titulo,
    data,
    hora,
    venue_name,
    address,
    cidade,
    estado,
    pais,
    geo_location,
    bilhetes_disponiveis,
    url_compra,
    imagem,
    generos,
  } = concertData;

  //Check for duplicates based on title and datetime
  const datetime = data && hora ? `${data} ${hora}` : data;
  const existingId = await concertsModel.concertExists(titulo, datetime);

  if (existingId) {
    console.log(
      `Concert "${titulo}" already exists (ID: ${existingId}). Skipped.`
    );
    return existingId;
  }

  //Get or create location
  let locationId = null;
  if (venue_name) {
    const addressParts = [address, cidade, estado, pais].filter(Boolean);
    const fullAddress = addressParts.join(", ") || null;

    locationId = await concertsModel.getLocationByNameAndAddress(
      venue_name,
      fullAddress
    );

    if (!locationId) {
      locationId = await concertsModel.insertLocation(
        venue_name,
        fullAddress,
        geo_location
      );
    }
  }

  //Insert concert
  const concertId = await concertsModel.createConcert(
    titulo,
    datetime,
    bilhetes_disponiveis,
    url_compra,
    locationId,
    imagem
  );

  //Add genres
  if (generos && Array.isArray(generos) && generos.length > 0) {
    for (const genreName of generos) {
      if (genreName && genreName !== "Not specified") {
        const genreId = await concertsModel.getGenreId(genreName);

        if (genreId) {
          await concertsModel.addGenreToConcert(concertId, genreId);
          console.log(`Genre added: ${genreName}`);
        }
      }
    }
  }

  console.log(`Concert "${titulo}" saved successfully (ID: ${concertId})`);
  return concertId;
};

//Get concerts
exports.getConcerts = async (filters) => {
  const { location, title, genre, limit = 20, offset = 0 } = filters;

  try {
    let concertos;

    // If any filter is present, use combined filter function
    if (title || location || genre) {
      concertos = await concertsModel.filterConcerts(
        { title, location, genre },
        limit,
        offset
      );
    } else {
      concertos = await concertsModel.listConcerts(limit, offset);
    }

    return {
      total: concertos.length,
      concertos: concertos,
      filtros: { location, title, genre, limit, offset },
    };
  } catch (err) {
    throw new Error(`Error fetching concerts: ${err.message}`);
  }
};

//Get concert by ID
exports.getConcertById = async (concertId) => {
  try {
    const concert = await concertsModel.getConcertById(concertId);

    if (!concert) {
      throw new Error(`Concert with ID ${concertId} not found`);
    }

    return concert;
  } catch (err) {
    throw new Error(`Error fetching concert: ${err.message}`);
  }
};
