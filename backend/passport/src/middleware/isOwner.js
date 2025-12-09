concertModel = require("../model/concertsModel");

exports.isOwner = (req, res, next) => {
  const userId = req.user.id; // Assuming user ID is stored in req.user after authentication
  const concertId = req.params.id; // Assuming the concert ID is passed as a URL parameter

  // Check if the user is the owner of the concert
  concertModel.getConcertById(concertId)
    .then(concert => {
      if (!concert) {
        return res.status(404).json({ success: false, message: "Concert not found" });
      }
      if (concert.user_id !== userId) {
        return res.status(403).json({ success: false, message: "You are not owner of this concert" });
      }
      next();
    })
    .catch(err => {
      console.error("Error checking ownership:", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    });
};