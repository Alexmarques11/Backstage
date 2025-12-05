const concertsModel = require("../model/concertsModel");

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
