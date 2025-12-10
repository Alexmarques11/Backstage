const concertsModel = require("../model/concertsModel");

//Get concerts
exports.getUserPassportPosts = async (filters) => {
  const { user_id, location, title, genre, limit = 20, offset = 0 } = filters;

  try {
    let concertos;

    // If any filter is present, use combined filter function
    if (title || location || genre) {
      concertos = await concertsModel.filterConcerts(
        { title, location, genre },
        user_id,
        limit,
        offset
      );
    } else {
      concertos = await concertsModel.listPassportPosts(user_id, limit, offset);
    }

    return {
      total: concertos.length,
      concertos: concertos,
      filtros: { location, title, genre, limit, offset },
    };
  } catch (err) {
    throw new Error(`Error fetching passport post: ${err.message}`);
  }
};

//Get concert by ID
exports.getConcertById = async (userId) => {
  try {
    const concert = await concertsModel.getConcertById(userId);

    if (!concert) {
      throw new Error(`Concert with ID ${userId} not found`);
    }

    return concert;
  } catch (err) {
    throw new Error(`Error fetching concert: ${err.message}`);
  }
};

//Create passport post
exports.createConcert = async (postData) => {
  console.log("postData:", postData);
  const { user_id, concert_title, artist, description, rating, location, genres, photos } = postData;

  try {
    // Validate required fields
    if (!user_id || !concert_title || !artist || !description || !rating) {
      throw new Error("Missing required fields: user_id, concert_title, artist, description, rating");
    }

    // Create passport post
    const postId = await concertsModel.createConcert(
      user_id,
      concert_title,
      artist,
      description,
      rating,
      location,
      photos
    );

    // Add genres if provided
    if (genres && Array.isArray(genres)) {
      for (const genreName of genres) {
        const genreId = await concertsModel.getGenreId(genreName);
        if (genreId) {
          await concertsModel.addGenreToConcert(postId, genreId);
        }
      }
    }

    // Fetch and return the created post
    const post = await concertsModel.getConcertById(postId);

    return {
      success: true,
      message: "Passport post created successfully",
      concert: post,
    };
  } catch (err) {
    throw new Error(`Error creating passport post: ${err.message}`);
  }
};

//Update passport post
exports.updateConcert = async (postId, postData) => {
  const { concert_title, artist, description, rating, location, genres, photos } = postData;

  try {
    // Update passport post
    const updatedPost = await concertsModel.updateConcert(
      postId,
      concert_title,
      artist,
      description,
      rating,
      location,
      photos
    );

    if (!updatedPost) {
      throw new Error(`Passport post with ID ${postId} not found`);
    }

    // Update genres if provided
    if (genres && Array.isArray(genres)) {
      // Remove existing genres
      const passportPool = require("../db/concertsDb");
      await passportPool.query(
        `DELETE FROM passport_genres WHERE passport_post_id = $1`,
        [postId]
      );
      
      // Add new genres
      for (const genreName of genres) {
        const genreId = await concertsModel.getGenreId(genreName);
        if (genreId) {
          await concertsModel.addGenreToConcert(postId, genreId);
        }
      }
    }

    // Fetch and return the updated post
    const post = await concertsModel.getConcertById(postId);

    return {
      success: true,
      message: "Passport post updated successfully",
      concert: post,
    };
  } catch (err) {
    throw new Error(`Error updating passport post: ${err.message}`);
  }
};

//Delete concert by ID
exports.deleteConcert = async (userId) => {
  try {
    const deletedConcert = await concertsModel.deleteConcert(userId);

    if (!deletedConcert) {
      throw new Error(`Concert with ID ${userId} not found`);
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

//Get concert by ID
exports.getPassportStatistics = async (userId) => {
  try {
    console.log("Fetching stats for user ID:", userId);
    const totalConcerts = await concertsModel.getTotalConcertsAttended(userId);
    const genres = await concertsModel.getPredominantGenres(userId);
    const frequentLocation = await concertsModel.getMostFrequentedLocations(userId);
    const temporalDestribution = await concertsModel.getTemporalDistribution(userId);

    const stats = {
      totalConcerts,
      genres,
      frequentLocation,
      temporalDestribution,
    }

    if (!stats) {
      throw new Error(`Concert with ID ${userId} not found`);
    }

    return stats;
  } catch (err) {
    throw new Error(`Error fetching concert: ${err.message}`);
  }
};