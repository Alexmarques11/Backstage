const router = require("express").Router();
const adminController = require("../controllers/adminController");
const { authenticateToken, isAdmin } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Administrative user management
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users (Admin only)
 *     tags: [Admin]
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
router.get("/users", authenticateToken, isAdmin, adminController.getAllUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user by ID (Admin only)
 *     tags: [Admin]
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
  "/users/:id",
  authenticateToken,
  isAdmin,
  adminController.deleteUser
);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Update a user's role by ID (Admin only)
 *     tags: [Admin]
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
  "/users/:id/role",
  authenticateToken,
  isAdmin,
  adminController.updateUserRole
);

/**
 * @swagger
 * /admin/genres:
 *   get:
 *     summary: Get all music genres
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all music genres
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *       401:
 *         description: Missing or invalid token
 *       500:
 *         description: Server error
 */
router.get(
  "/genres",
  authenticateToken,
  isAdmin,
  adminController.getMusicGenres
);

module.exports = router;
