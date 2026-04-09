const authService = require("../services/authService");

// Register a new user
// src/controllers/authController.js
exports.registerUser = async (req, res) => {
  console.log("BODY:", req.body); // Verifica se os textos chegam aqui
  console.log("FILE:", req.file); // Verifica se a imagem chega aqui

  try {
    // Certifica-te que req.body não está vazio
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: "Body is empty. Check form-data config." });
    }

    const result = await authService.registerUser(req.body, req.file);
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
