const userService = require("../services/userService");

// GET /user/profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await userService.getUserProfile(userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};

// PATCH /user/profile
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await userService.updateUserProfile(userId, req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// PATCH /user/changepassword
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await userService.changePassword(
      userId,
      req.user.email,
      req.body
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

// GET /user/preferences
exports.getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await userService.getUserPreferences(userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// PATCH /user/preferences
exports.updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await userService.updateUserPreferences(userId, req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

// GET /user/posts
exports.getPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await userService.getPosts(userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};
