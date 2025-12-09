marketModel = require("../model/marketModel");

exports.isOwner = (req, res, next) => {
  const userId = req.user.id; // Assuming user ID is stored in req.user after authentication
  const marketPostId = req.params.id; // Assuming the market post ID is passed as a URL parameter

  // Check if the user is the owner of the market post
  marketModel.getMarketPostById(marketPostId)
    .then(marketPost => {
      if (!marketPost) {
        return res.status(404).json({ success: false, message: "Market post not found" });
      }
      if (marketPost.user_id !== userId) {
        return res.status(403).json({ success: false, message: "You are not owner of this post" });
      }
      next();
    })
    .catch(err => {
      console.error("Error checking ownership:", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    });
};