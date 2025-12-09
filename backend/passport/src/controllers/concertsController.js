const concertsService = require("../services/concertsService");

// Get concerts
exports.getConcerts = async (req, res) => {
  try {
    const user_id = req.user.id;
    const location = req.query.location || null;
    const title = req.query.title || null;
    const genre = req.query.genre || null;
    const limit = req.query.limit || 20;
    const offset = req.query.offset || 0;

    const result = await concertsService.getUserPassportPosts({
      user_id,
      location,
      title,
      genre,
      limit,
      offset,
    });

    res.json(result);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching passport posts",
      details: err.message,
    });
  }
};

//Get concert by ID
exports.getConcertById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await concertsService.getConcertById(id);

    if (!result) {
      return res.status(404).json({
        sucesso: false,
        erro: "Passport post not found",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching passport post",
      details: err.message,
    });
  }
};

//Create concert
exports.createConcert = async (req, res) => {
  try {
    const concertData = req.body;
    concertData.user_id = req.user.id;
    const result = await concertsService.createConcert(concertData);

    res.status(201).json(result);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: "Error creating passport post",
      details: err.message,
    });
  }
};

//Update concert
exports.updateConcert = async (req, res) => {
  try {
    const { id } = req.params;
    const concertData = req.body;
    const result = await concertsService.updateConcert(id, concertData);

    res.json(result);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: "Error updating passport post",
      details: err.message,
    });
  }
};

//Delete concert by ID (admin only)
exports.deleteConcert = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await concertsService.deleteConcert(id);

    res.json(result);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: "Error deleting passport post",
      details: err.message,
    });
  }
};