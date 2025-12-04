const authService = require("../services/authService");

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

exports.tokenUser = async (req, res) => {
  try {
    const { token: refreshToken } = req.body;
    const result = await authService.tokenUser(refreshToken);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: err.message });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const { token } = req.body;
    const result = await authService.logoutUser(token);
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};
