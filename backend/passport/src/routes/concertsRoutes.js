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
 *   - name: Passports
 *     description: Passport management and synchronization
 */

/**
 * @swagger
 * /passport:
 *   get:
 *     summary: Get passports with optional filters
 *     tags: [Passports]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by passport title
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
 *         description: List of passports
 *       500:
 *         description: Server error
 */
router.get("/", authenticateToken, concertsController.getConcerts);

/**
 * @swagger
 * /passport/{id}:
 *   get:
 *     summary: Get passport by ID
 *     tags: [Passports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Passport ID
 *     responses:
 *       200:
 *         description: Passport details
 *       404:
 *         description: Passport not found
 *       500:
 *         description: Server error
 */
router.get("/:id", concertsController.getConcertById);

/**
 * @swagger
 * /passport:
 *   post:
 *     summary: Create a new passport
 *     tags: [Passports]
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
 *         description: Passport created successfully
 *       500:
 *         description: Server error
 */
router.post("/", authenticateToken, concertsController.createConcert);

/**
 * @swagger
 * /passport/{id}:
 *   put:
 *     summary: Update passport by ID
 *     tags: [Passports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Passport ID
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
 *         description: Passport updated successfully
 *       404:
 *         description: Passport not found
 *       500:
 *         description: Server error
 */
router.put("/:id", authenticateToken, isOwner, concertsController.updateConcert);


/**
 * @swagger
 * /passport/statistics/{id}:
 *   get:
 *     summary: Get user statistics
 *     tags: [Passports]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalConcerts:
 *                   type: integer
 *                   description: Total number of concerts attended
 *                 predominantGenres:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       count:
 *                         type: integer
 *                   description: Most frequent music genres
 *                 mostFrequentedLocations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       address:
 *                         type: string
 *                       count:
 *                         type: integer
 *                   description: Most visited locations
 *                 temporalDistribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       year:
 *                         type: integer
 *                       count:
 *                         type: integer
 *                   description: Concert distribution by year and month
 *       401:
 *         description: Unauthorized - no token provided
 *       500:
 *         description: Server error
 */
router.get("/statistics/:id",concertsController.getStatistics);

/**
 * @swagger
 * /passport/{id}:
 *   delete:
 *     summary: Delete passport by ID (admin only)
 *     tags: [Passports]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Passport ID
 *     responses:
 *       200:
 *         description: Passport deleted successfully
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
 *         description: Passport not found
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
