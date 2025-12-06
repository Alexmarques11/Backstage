const concertsAdminService = require("../services/concertsAdminService");

//Delete concert by ID (admin only)
exports.deleteConcert = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await concertsAdminService.deleteConcert(id);

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
