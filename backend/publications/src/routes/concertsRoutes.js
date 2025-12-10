const express = require("express");
const router = express.Router();
const concertsController = require("../controllers/concertsController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { hasRole } = require("../middleware/roleMiddleware");
const { OrGate } = require("../middleware/orGateMiddleware");
const { isOwner } = require("../middleware/isOwner");

/**
 * @swagger
 * tags:
 *   - name: Concerts
 *     description: User concert publications management
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
router.get("/", concertsController.getConcerts);

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
 *     summary: Create a new concert publication
 *     tags: [Concerts]
 *     security:
 *       - Bearer: []
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
 *               - location
 *               - genres
 *               - image_url
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID of the user creating the publication
 *               title:
 *                 type: string
 *                 description: Concert title
 *               description:
 *                 type: string
 *                 description: Concert description
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Concert date and time
 *               location:
 *                 type: object
 *                 required:
 *                   - name
 *                   - address
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Venue name
 *                   address:
 *                     type: string
 *                     description: Venue address
 *                   geo_location:
 *                     type: string
 *                     description: Geographic coordinates
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of music genres
 *               image_url:
 *                 type: string
 *                 description: Concert image URL
 *     responses:
 *       201:
 *         description: Concert publication created successfully
 *       401:
 *         description: Unauthorized - no token provided
 *       500:
 *         description: Server error
 */
router.post("/", authenticateToken, concertsController.createConcert);

/**
 * @swagger
 * /concerts/{id}:
 *   put:
 *     summary: Update concert publication by ID (admin, manager, or owner only)
 *     tags: [Concerts]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Concert publication ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: User ID (for ownership verification)
 *               title:
 *                 type: string
 *                 description: Concert title
 *               description:
 *                 type: string
 *                 description: Concert description
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Concert date and time
 *               location:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Venue name
 *                   address:
 *                     type: string
 *                     description: Venue address
 *                   geo_location:
 *                     type: string
 *                     description: Geographic coordinates
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of music genres
 *               image_url:
 *                 type: string
 *                 description: Concert image URL
 *     responses:
 *       200:
 *         description: Concert publication updated successfully
 *       401:
 *         description: Unauthorized - no token provided
 *       403:
 *         description: Forbidden - not owner or admin/manager
 *       404:
 *         description: Concert publication not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id",
  authenticateToken,
  OrGate(hasRole("admin,manager"), isOwner),
  concertsController.updateConcert
);

/**
 * @swagger
 * /concerts/{id}:
 *   delete:
 *     summary: Delete concert publication by ID (admin, manager, or owner only)
 *     tags: [Concerts]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Concert publication ID
 *     responses:
 *       200:
 *         description: Concert publication deleted successfully
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
 *         description: Forbidden - not owner or admin/manager
 *       404:
 *         description: Concert publication not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  authenticateToken,
  OrGate(hasRole("admin,manager"), isOwner),
  concertsController.deleteConcert
);

module.exports = router;
