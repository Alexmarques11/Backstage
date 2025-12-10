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
 *   - name: Publications
 *     description: User concert publications management
 */

/**
 * @swagger
 * /publications:
 *   get:
 *     summary: Get publications with optional filters
 *     tags: [Publications]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by publication title
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
 *         description: List of publications
 *       500:
 *         description: Server error
 */
router.get("/", concertsController.getConcerts);

/**
 * @swagger
 * /publications/{id}:
 *   get:
 *     summary: Get publication by ID
 *     tags: [Publications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Publication ID
 *     responses:
 *       200:
 *         description: Publication details
 *       404:
 *         description: Publication not found
 *       500:
 *         description: Server error
 */
router.get("/:id", concertsController.getConcertById);

/**
 * @swagger
 * /publications:
 *   post:
 *     summary: Create a new publication
 *     tags: [Publications]
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
 *                 description: Publication title
 *               description:
 *                 type: string
 *                 description: Publication description
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Publication date and time
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
 *                 description: Publication image URL
 *     responses:
 *       201:
 *         description: Publication created successfully
 *       401:
 *         description: Unauthorized - no token provided
 *       500:
 *         description: Server error
 */
router.post("/", authenticateToken, concertsController.createConcert);

/**
 * @swagger
 * /publications/{id}:
 *   put:
 *     summary: Update publication by ID (admin, manager, or owner only)
 *     tags: [Publications]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Publication ID
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
 *                 description: Publication title
 *               description:
 *                 type: string
 *                 description: Publication description
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Publication date and time
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
 *                 description: Publication image URL
 *     responses:
 *       200:
 *         description: Publication updated successfully
 *       401:
 *         description: Unauthorized - no token provided
 *       403:
 *         description: Forbidden - not owner or admin/manager
 *       404:
 *         description: Publication not found
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
 * /publications/{id}:
 *   delete:
 *     summary: Delete publication by ID (admin, manager, or owner only)
 *     tags: [Publications]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Publication ID
 *     responses:
 *       200:
 *         description: Publication deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedPublication:
 *                   type: object
 *       401:
 *         description: Unauthorized - no token provided
 *       403:
 *         description: Forbidden - not owner or admin/manager
 *       404:
 *         description: Publication not found
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
