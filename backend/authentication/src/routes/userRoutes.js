const router = require("express").Router();
const profileController = require("../controllers/profileController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { hasRole } = require("../middleware/roleMiddleware");

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User profile and users management
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
 * /user/allusers:
 *   get:
 *     summary: List all users (Admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Admins only
 *       500:
 *         description: Server error
 */
router.get(
  "/allusers",
  authenticateToken,
  hasRole("admin"),
  profileController.getAllUsers
);

/**
 * @swagger
 * /user/deleteuser/{id}:
 *   delete:
 *     summary: Delete a user by ID (Admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Admins only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/deleteuser/:id",
  authenticateToken,
  hasRole("admin"),
  profileController.deleteUser
);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Update a user's role by ID (Admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: ["user", "admin"]
 *                 description: New role for the user
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid role provided
 *       403:
 *         description: Admins only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/:id/role",
  authenticateToken,
  hasRole("admin"),
  profileController.updateUserRole
);

/**
 * @swagger
 * /users/{id}/info:
 *   get:
 *     summary: Get non-sensitive information of a user (Admin and Manager only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User public information retrieved successfully
 *       403:
 *         description: Admins and Managers only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get(
  "/:id/info",
  authenticateToken,
  hasRole("admin", "manager"),
  profileController.getUserPublicInfo
);

module.exports = router;
