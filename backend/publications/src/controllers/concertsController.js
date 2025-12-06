const concertsService = require("../services/concertsService");

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

//Get concert by ID
exports.createConcert = async (req, res) => {
  try {
    const { user_id, title, description, event_date, location_id } = req.body;
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
