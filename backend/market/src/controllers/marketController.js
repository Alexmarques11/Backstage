const marketService = require("../services/marketService");

// Get concerts
exports.getMarketPosts = async (req, res) => {
  try {
    const user = req.query.user || null;
    const description = req.query.description || null;
    const ticket_quantity = req.query.ticket_quantity || null;
    const max_price = req.query.max_price || null;
    const limit = req.query.limit || 20;
    const offset = req.query.offset || 0;

    const result = await marketService.getMarketPosts({
      user,
      description,
      ticket_quantity,
      max_price,
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
    const result = await marketService.getConcertById(id);

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

//Create concert
exports.createMarketPost = async (req, res) => {
  try {
    const marketpostData = req.body;
    marketpostData.user_id = req.user.id; // Get user ID from authenticated token
    const result = await marketService.createMarketPost(marketpostData);

    res.status(201).json(result);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: "Error creating concert",
      details: err.message,
    });
  }
};

//Update concert
exports.updateMarketPost = async (req, res) => {
  try {
    const { id } = req.params;
    const marketPostData = req.body;
    const result = await marketService.updateMarketPost(id, marketPostData);
    res.json(result);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: "Error updating concert",
      details: err.message,
    });
  }
};

//Delete concert by ID (admin only)
exports.deleteConcert = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await marketService.deleteMarketPost(id);

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