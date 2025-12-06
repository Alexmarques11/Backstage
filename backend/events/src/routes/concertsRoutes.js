const express = require("express");
const router = express.Router();
const concertsController = require("../controllers/concertsController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { hasRole } = require("../middleware/roleMiddleware");

/**
 * @swagger
 * tags:
 *   - name: Concerts
 *     description: Concert management and synchronization
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
 * /concerts/sync:
 *   get:
 *     summary: Synchronize concerts from Ticketmaster
 *     tags: [Concerts]
 *     parameters:
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country code (e.g., US, GB, PT)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Specific date (YYYY-MM-DD)
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of events to fetch
 *     responses:
 *       200:
 *         description: Synchronization successful
 *       500:
 *         description: Server error
 */
router.get("/sync", concertsController.syncConcerts);

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
router.get("/getconcert/:id", concertsController.getConcertById);

/**
 * @swagger
 * /deleteconcert/{id}:
 *   delete:
 *     summary: Delete concert by ID (admin only)
 *     tags: [Concerts]
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
  "/deleteconcert/:id",
  authenticateToken,
  hasRole("admin"),
  concertsController.deleteConcert
);

module.exports = router;
