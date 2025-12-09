const marketPostsModel = require("../model/marketModel");

//Get concerts
exports.getMarketPosts = async (filters) => {
  const { user, description, ticket_quantity, max_price, limit = 20, offset = 0 } = filters;

  try {
    let concertos;

    // If any filter is present, use combined filter function
    if (user || description || ticket_quantity || max_price) {
      concertos = await marketPostsModel.filterConcerts(
        { user, description, ticket_quantity, max_price },
        limit,
        offset
      );
    } else {
      concertos = await marketPostsModel.listMarketPosts(limit, offset);
    }

    return {
      total: concertos.length,
      concertos: concertos,
      filtros: { title: description, ticket_quantity, max_price, limit, offset },
    };
  } catch (err) {
    throw new Error(`Error fetching concerts: ${err.message}`);
  }
};

//Get concert by ID
exports.getConcertById = async (concertId) => {
  try {
    const concert = await marketPostsModel.getConcertById(concertId);

    if (!concert) {
      throw new Error(`Concert with ID ${concertId} not found`);
    }

    return concert;
  } catch (err) {
    throw new Error(`Error fetching concert: ${err.message}`);
  }
};

//Create concert
exports.createMarketPost = async (marketpostData) => {
  const { user_id, description, suggested_price, ticket_quantity, status, image_url } = marketpostData;

  try {
    // Validate required fields
    if (!user_id || !description || !suggested_price || !ticket_quantity || !status || !image_url) {
      throw new Error("Missing required fields: user_id, description, suggested_price, ticket_quantity, status, image_url");
    }

    // Create concert
    const marketpost = await marketPostsModel.createMarketPost(
      user_id,
      description,
      suggested_price,
      ticket_quantity,
      status,
      image_url
    );

    return {
      success: true,
      message: "Market post created successfully",
      marketpost: marketpost,
    };
  } catch (err) {
    throw new Error(`Error creating market post: ${err.message}`);
  }
};

//Update market post
exports.updateMarketPost = async (marketpostId, marketpostData) => {
  const { description, suggested_price, ticket_quantity, status, image_url } = marketpostData;

  try {
    // Update market post
    const updatedMarketPost = await marketPostsModel.updateMarketPost(
      marketpostId,
      ticket_quantity,
      status,
      description,
      suggested_price,
      image_url
    );

    if (!updatedMarketPost) {
      throw new Error(`Market post with ID ${marketpostId} not found`);
    }

    // Fetch and return the updated market post
    const marketpost = await marketPostsModel.getMarketPostById(marketpostId);

    return {
      success: true,
      message: "Market post updated successfully",
      marketpost: marketpost,
    };
  } catch (err) {
    throw new Error(`Error updating market post: ${err.message}`);
  }
};

//Delete market post by ID
exports.deleteMarketPost = async (marketpostId) => {
  try {
    const deletedMarketPost = await marketPostsModel.deleteMarketPost(marketpostId);

    if (!deletedMarketPost) {
      throw new Error(`Market post with ID ${marketpostId} not found`);
    }

    return {
      success: true,
      message: "Market post deleted successfully",
      deletedMarketPost: deletedMarketPost,
    };
  } catch (err) {
    throw new Error(`Error deleting market post: ${err.message}`);
  }
};
