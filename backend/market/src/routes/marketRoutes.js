const express = require("express");
const router = express.Router();
const marketController = require("../controllers/marketController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { hasRole } = require("../middleware/roleMiddleware");
const { OrGate } = require("../middleware/orGateMiddleware");
const { isOwner } = require("../middleware/isOwner");

/**
 * @swagger
 * tags:
 *   - name: Market
 *     description: MarkPost management and synchronization
 */

/**
 * @swagger
 * /market:
 *   get:
 *     summary: Get market posts with optional filters
 *     tags: [Market]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by market post title
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (name or address)
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by music genre
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: List of market posts
 *       500:
 *         description: Server error
 */
router.get("/", marketController.getMarketPosts);

/**
 * @swagger
 * /market/{id}:
 *   get:
 *     summary: Get market post by ID
 *     tags: [Market]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: MarkPost ID
 *     responses:
 *       200:
 *         description: MarkPost details
 *       404:
 *         description: MarkPost not found
 *       500:
 *         description: Server error
 */
router.get("/:id", marketController.getConcertById);

/**
 * @swagger
 * /market:
 *   post:
 *     summary: Create a new market post
 *     tags: [Market]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - title
 *               - date
 *             properties:
 *               user_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   address:
 *                     type: string
 *                   geo_location:
 *                     type: string
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *               image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: MarkPost created successfully
 *       500:
 *         description: Server error
 */
router.post("/", authenticateToken, marketController.createMarketPost);

/**
 * @swagger
 * /market/{id}:
 *   put:
 *     summary: Update market post by ID
 *     tags: [Market]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: MarkPost ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   address:
 *                     type: string
 *                   geo_location:
 *                     type: string
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *               image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: MarkPost updated successfully
 *       404:
 *         description: MarkPost not found
 *       500:
 *         description: Server error
 */
router.put("/:id", marketController.updateMarketPost);

/**
 * @swagger
 * /market/{id}:
 *   delete:
 *     summary: Delete market post by ID (admin only)
 *     tags: [Market]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: MarkPost ID
 *     responses:
 *       200:
 *         description: MarkPost deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedConcert:
 *                   type: object
 *       401:
 *         description: Unauthorized - no token provided
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: MarkPost not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  authenticateToken,
  OrGate(hasRole("admin"), isOwner),
  // isOwner,
  // hasRole("admin"),
  marketController.deleteConcert
);

module.exports = router;
