const router = require("express").Router();
const UserController = require("../controllers/userController");
const { authenticateToken, isAdmin } = require("../middleware/authMiddleware");

//Auth Routes

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints and token management
 *   - name: User
 *     description: User profile and preferences management
 *   - name: Admin
 *     description: Administrative user management
 *   - name: Genres
 *     description: Music genres management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - lastname
 *               - birthdate
 *               - username
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               lastname:
 *                 type: string
 *               birthdate:
 *                 type: string
 *                 format: date
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Email or username already exists / invalid password
 *       500:
 *         description: Server error
 */
router.post("/auth/register", UserController.registerUser);

/**
 * @swagger
 * /auth/token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 *       401:
 *         description: Token missing
 *       403:
 *         description: Invalid token
 *       500:
 *         description: Server error
 */
router.post("/auth/token", UserController.tokenUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: User not found or incorrect password
 *       500:
 *         description: Server error
 */
router.post("/auth/login", UserController.loginUser);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       400:
 *         description: Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post("/auth/logout", UserController.logoutUser);

//User Profile Routes

/**
 * @swagger
 * /profile:
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

/**
 * @swagger
 * /changepassword:
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
  UserController.changePassword
);

router.get("/profile", authenticateToken, UserController.getUserProfile);

/**
 * @swagger
 * /profile:
 *   patch:
 *     summary: Update authenticated user profile
 *     tags: [User]
 *
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
router.patch("/profile", authenticateToken, UserController.updateUserProfile);

/**
 * @swagger
 * /userpreferences:
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
  "/userpreferences",
  authenticateToken,
  UserController.getUserPreferences
);

/**
 * @swagger
 * /userpreferences:
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
  "/userpreferences",
  authenticateToken,
  UserController.updateUserPreferences
);

/**
 * @swagger
 * /posts:
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
router.get("/posts", authenticateToken, UserController.getPosts);

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
router.get(
  "/admin/users",
  authenticateToken,
  isAdmin,
  UserController.getAllUsers
);

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
  "/admin/users/:id",
  authenticateToken,
  isAdmin,
  UserController.deleteUser
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
  "/admin/users/:id/role",
  authenticateToken,
  isAdmin,
  UserController.updateUserRole
);

/**
 * @swagger
 * /genres:
 *   get:
 *     summary: Get all music genres
 *     tags: [Genres]
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
router.get("/", authenticateToken, UserController.getMusicGenres);

module.exports = router;
