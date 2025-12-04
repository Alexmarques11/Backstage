const adminService = require("../services/adminService");

// GET /admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const result = await adminService.getAllUsers();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE /admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await adminService.deleteUser(userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
};

// PATCH /admin/users/:id/role
exports.updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await adminService.updateUserRole(userId, req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

// GET /admin/genres
exports.getMusicGenres = async (req, res) => {
  try {
    const result = await adminService.getMusicGenres();
    res.status(200).json(result);
  } catch (err) {
    console.error("Erro ao buscar géneros:", err.message);
    res.status(500).json({ message: "Erro ao buscar géneros" });
  }
};
