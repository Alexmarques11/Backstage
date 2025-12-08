const router = require("express").Router();
const notificationController = require("../controllers/notificationController");

/**
 * @swagger
 * /notifications/{userId}:
 *   get:
 *     summary: Get all notifications for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filter only unread notifications
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get("/:userId", notificationController.getUserNotifications);

/**
 * @swagger
 * /notifications/{userId}/unread-count:
 *   get:
 *     summary: Get unread notification count for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Unread notification count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
router.get("/:userId/unread-count", notificationController.getUnreadCount);

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - type
 *               - title
 *               - message
 *             properties:
 *               user_id:
 *                 type: integer
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               related_id:
 *                 type: string
 *               related_type:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 */
router.post("/", notificationController.createNotification);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch("/:notificationId/read", notificationController.markAsRead);

/**
 * @swagger
 * /notifications/{userId}/read-all:
 *   patch:
 *     summary: Mark all notifications as read for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch("/:userId/read-all", notificationController.markAllAsRead);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */
router.delete("/:notificationId", notificationController.deleteNotification);

/**
 * @swagger
 * /notifications/{userId}/clear-read:
 *   delete:
 *     summary: Delete all read notifications for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Read notifications cleared successfully
 */
router.delete(
  "/:userId/clear-read",
  notificationController.clearReadNotifications
);

module.exports = router;
