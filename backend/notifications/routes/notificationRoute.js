const router = require("express").Router();
const notificationController = require("../controllers/notificationController");

// Get all notifications for a user (with optional unread filter)
router.get("/:userId", notificationController.getUserNotifications);

// Get unread notification count
router.get("/:userId/unread-count", notificationController.getUnreadCount);

// Create a new notification
router.post("/", notificationController.createNotification);

// Mark notification as read
router.patch("/:notificationId/read", notificationController.markAsRead);

// Mark all notifications as read for a user
router.patch("/:userId/read-all", notificationController.markAllAsRead);

// Delete a notification
router.delete("/:notificationId", notificationController.deleteNotification);

// Delete all read notifications for a user
router.delete("/:userId/clear-read", notificationController.clearReadNotifications);

module.exports = router;
