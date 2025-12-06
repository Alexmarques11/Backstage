const concertsModel = require("../model/concertsModel");

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
