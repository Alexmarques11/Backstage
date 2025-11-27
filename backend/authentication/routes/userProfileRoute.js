const router = require("express").Router();
const UserController = require("../controllers/UserController");

// Get user profile (by username)
router.get("/profile", UserController.getUsers);

// Update user profile
router.patch("/profile", UserController.updateUserProfile);

// Get user preferences
router.get("/preferences", UserController.getUserPreferences);

// Update user preferences
router.patch("/preferences", UserController.updateUserPreferences);

// Get user posts (requires authentication)
router.get("/posts", UserController.authenticateToken, UserController.getPosts);

module.exports = router;
