const router = require("express").Router();
const profileController = require("../controllers/profileController");
const { authenticateToken } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User profile and preferences management
 */

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get authenticated user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/profile", authenticateToken, profileController.getUserProfile);

/**
 * @swagger
 * /user/profile:
 *   patch:
 *     summary: Update authenticated user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               lastname:
 *                 type: string
 *               birthdate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       401:
 *         description: Missing or invalid token
 *       500:
 *         description: Server error
 */
router.patch(
  "/profile",
  authenticateToken,
  profileController.updateUserProfile
);

/**
 * @swagger
 * /user/changepassword:
 *   patch:
 *     summary: Change authenticated user's password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password is incorrect / New password invalid
 *       401:
 *         description: Missing or invalid token
 *       500:
 *         description: Server error
 */
router.patch(
  "/changepassword",
  authenticateToken,
  profileController.changePassword
);

/**
 * @swagger
 * /user/preferences:
 *   get:
 *     summary: Get authenticated user music preferences
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
 *       401:
 *         description: Missing or invalid token
 *       500:
 *         description: Server error
 */
router.get(
  "/preferences",
  authenticateToken,
  profileController.getUserPreferences
);

/**
 * @swagger
 * /user/preferences:
 *   patch:
 *     summary: Update authenticated user music preferences
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: User preferences updated successfully
 *       400:
 *         description: Invalid request (genres must be an array)
 *       401:
 *         description: Missing or invalid token
 *       500:
 *         description: Server error
 */
router.patch(
  "/preferences",
  authenticateToken,
  profileController.updateUserPreferences
);

/**
 * @swagger
 * /user/posts:
 *   get:
 *     summary: Get authenticated user's posts
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User posts retrieved successfully
 *       401:
 *         description: Missing or invalid token
 *       500:
 *         description: Server error
 */
router.get("/posts", authenticateToken, profileController.getPosts);

module.exports = router;
