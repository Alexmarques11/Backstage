const router = require("express").Router();
const UserController = require("../controllers/UserController");

// User registration route
router.post("/register", UserController.registerUser);

// Refresh token route
router.post("/token", UserController.tokenUser);

// User login route
router.post("/login", UserController.loginUser);

// User logout route
router.post("/logout", UserController.logoutUser);

module.exports = router;
