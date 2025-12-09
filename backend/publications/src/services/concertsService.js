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

//Create concert
exports.createConcert = async (concertData) => {
  const { user_id, title, description, date, location, genres, image_url } = concertData;

  try {
    // Validate required fields
    if (!title || !date || !location || !genres || !image_url) {
      throw new Error("Missing required fields: title, date, location, genres, image_url");
    }

    // Create concert
    const concertId = await concertsModel.createConcert(
      user_id,
      title,
      description,
      date,
      location,
      image_url
    );

    // Add genres if provided
    if (genres && Array.isArray(genres)) {
      for (const genre of genres) {
        await concertsModel.addGenreToConcert(concertId, genre);
      }
    }

    return {
      success: true,
      message: "Concert created successfully",
      concert: concertData,
    };
  } catch (err) {
    throw new Error(`Error creating concert: ${err.message}`);
  }
};

//Update concert
exports.updateConcert = async (concertId, concertData) => {
  const { user_id, title, description, date, location, genres, image_url } = concertData;

  try {
    let locationId = undefined;

    // Handle location update
    if (location) {
      const { name, address, geo_location } = location;
      
      // Check if location exists
      locationId = await concertsModel.getLocationByNameAndAddress(name, address);
      
      // If not, create it
      if (!locationId) {
        locationId = await concertsModel.insertLocation(name, address, geo_location);
      }
    }

    // Update concert
    const updatedConcert = await concertsModel.updateConcert(
      concertId,
      user_id,
      title,
      description,
      date,
      locationId,
      image_url
    );

    if (!updatedConcert) {
      throw new Error(`Concert with ID ${concertId} not found`);
    }

    // Update genres if provided
    if (genres && Array.isArray(genres)) {
      // Remove existing genres
      await concertsModel.query(
        `DELETE FROM user_concerts_genres WHERE user_concert_id = $1`,
        [concertId]
      );
      
      // Add new genres
      for (const genre of genres) {
        await concertsModel.addGenreToConcert(concertId, genre);
      }
    }

    // Fetch and return the updated concert
    const concert = await concertsModel.getConcertById(concertId);

    return {
      success: true,
      message: "Concert updated successfully",
      concert: concert,
    };
  } catch (err) {
    throw new Error(`Error updating concert: ${err.message}`);
  }
};

//Delete concert by ID
exports.deleteConcert = async (concertId) => {
  try {
    const deletedConcert = await concertsModel.deleteConcert(concertId);

    if (!deletedConcert) {
      throw new Error(`Concert with ID ${concertId} not found`);
    }

    return {
      success: true,
      message: "Concert deleted successfully",
      deletedConcert: deletedConcert,
    };
  } catch (err) {
    throw new Error(`Error deleting concert: ${err.message}`);
  }
};
