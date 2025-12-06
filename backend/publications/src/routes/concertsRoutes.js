const express = require("express");
const router = express.Router();
const concertsController = require("../controllers/concertsController");

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

router.post("/", concertsController.createConcert);

module.exports = router;
