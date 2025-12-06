const concertsService = require("../services/concertsService");

//synchronize concerts from Ticketmaster
exports.syncConcerts = async (req, res) => {
  try {
    const country = req.query.country || req.body?.country || null;
    const date = req.query.date || req.body?.date || null;
    const size = req.query.size || req.body?.size || 20;

    const result = await concertsService.syncConcerts({
      country,
      date,
      size,
    });

    res.json(result);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: "Error synchronizing concerts",
      details: err.message,
    });
  }
};

// Get concerts
exports.getConcerts = async (req, res) => {
  try {
    const location = req.query.location || null;
    const title = req.query.title || null;
    const genre = req.query.genre || null;
    const limit = req.query.limit || 20;
    const offset = req.query.offset || 0;

    const result = await concertsService.getConcerts({
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
      error: "Error fetching concerts",
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
        erro: "Concerto não encontrado",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching concert",
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
      error: "Error deleting concert",
      details: err.message,
    });
  }
};
