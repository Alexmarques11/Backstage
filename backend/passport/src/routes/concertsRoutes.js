const express = require("express");
const router = express.Router();
const concertsController = require("../controllers/concertsController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { hasRole } = require("../middleware/roleMiddleware");
const { isOwner } = require("../middleware/isOwner");
const { OrGate } = require("../middleware/orGateMiddleware");

/**
 * @swagger
 * tags:
 *   - name: Concerts
 *     description: Concert management and synchronization
 *   - name: Concerts - Admin
 *     description: Admin only operations for concert management
 */

/**
 * @swagger
 * /concerts:
 *   get:
 *     summary: Get concerts with optional filters
 *     tags: [Concerts]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by concert title
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
 *         description: List of concerts
 *       500:
 *         description: Server error
 */
router.get("/", authenticateToken, concertsController.getConcerts);

/**
 * @swagger
 * /concerts/{id}:
 *   get:
 *     summary: Get concert by ID
 *     tags: [Concerts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Concert ID
 *     responses:
 *       200:
 *         description: Concert details
 *       404:
 *         description: Concert not found
 *       500:
 *         description: Server error
 */
router.get("/:id", concertsController.getConcertById);

/**
 * @swagger
 * /concerts:
 *   post:
 *     summary: Create a new concert
 *     tags: [Concerts]
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
 *         description: Concert created successfully
 *       500:
 *         description: Server error
 */
router.post("/", authenticateToken, concertsController.createConcert);

/**
 * @swagger
 * /concerts/{id}:
 *   put:
 *     summary: Update concert by ID
 *     tags: [Concerts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Concert ID
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
 *         description: Concert updated successfully
 *       404:
 *         description: Concert not found
 *       500:
 *         description: Server error
 */
router.put("/:id", authenticateToken, isOwner, concertsController.updateConcert);

/**
 * @swagger
 * /concerts-admin/{id}:
 *   delete:
 *     summary: Delete concert by ID (admin only)
 *     tags: [Concerts - Admin]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Concert ID
 *     responses:
 *       200:
 *         description: Concert deleted successfully
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
 *         description: Concert not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  authenticateToken,
  OrGate(hasRole("admin"), isOwner),
  concertsController.deleteConcert
);

module.exports = router;
