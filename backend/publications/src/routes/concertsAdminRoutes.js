const express = require("express");
const router = express.Router();
const concertsAdminController = require("../controllers/concertsAdminController");
const { authenticateToken, isAdmin } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   - name: Concerts - Admin
 *     description: Admin only operations for concert management
 */

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
  isAdmin,
  concertsAdminController.deleteConcert
);

module.exports = router;
