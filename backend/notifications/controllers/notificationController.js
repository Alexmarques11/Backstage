const notificationCache = require("../notificationCache");
const { v4: uuidv4 } = require('uuid');

// Helper: Get user notifications key
const getUserNotificationsKey = (userId) => `notifications:user:${userId}`;

// Helper: Get notification key
const getNotificationKey = (notificationId) => `notification:${notificationId}`;

// Get all notification IDs for a user
function getUserNotificationIds(userId) {
  return notificationCache.get(getUserNotificationsKey(userId)) || [];
}

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { unread_only } = req.query;

    const notificationIds = getUserNotificationIds(userId);
    
    if (notificationIds.length === 0) {
      return res.json({ count: 0, notifications: [] });
    }

    // Get all notifications from cache
    const notifications = notificationIds
      .map(id => notificationCache.get(getNotificationKey(id)))
      .filter(n => n !== undefined);

    // Apply unread filter if needed
    let filtered = notifications;
    if (unread_only === "true") {
      filtered = notifications.filter(n => !n.is_read);
    }

    res.json({
      count: filtered.length,
      notifications: filtered,
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Error fetching notifications", error: err.message });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const notificationIds = getUserNotificationIds(userId);
    
    let unreadCount = 0;
    for (const id of notificationIds) {
      const notification = notificationCache.get(getNotificationKey(id));
      if (notification && !notification.is_read) {
        unreadCount++;
      }
    }

    res.json({ unread_count: unreadCount });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    res.status(500).json({ message: "Error fetching unread count", error: err.message });
  }
};

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { user_id, type, title, message, related_id, related_type } = req.body;

    if (!user_id || !type || !title || !message) {
      return res.status(400).json({ error: "Missing required fields: user_id, type, title, message" });
    }

    const validTypes = ['event', 'system', 'ticket_purchase', 'event_reminder'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }

    // Create notification object
    const notification = {
      id: uuidv4(),
      user_id,
      type,
      title,
      message,
      related_id,
      related_type,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    // Store notification in cache (30 days TTL set in cache config)
    const notificationKey = getNotificationKey(notification.id);
    notificationCache.set(notificationKey, notification);

    // Add to user's notification list
    const userKey = getUserNotificationsKey(user_id);
    const userNotifications = getUserNotificationIds(user_id);
    userNotifications.unshift(notification.id); // Add to beginning
    notificationCache.set(userKey, userNotifications);

    res.status(201).json({
      message: "Notification created",
      notification,
    });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ message: "Error creating notification", error: err.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = notificationCache.get(getNotificationKey(notificationId));
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.is_read = true;
    notificationCache.set(getNotificationKey(notificationId), notification);

    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ message: "Error updating notification", error: err.message });
  }
};

// Mark all notifications as read for a user
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    const notificationIds = getUserNotificationIds(userId);
    
    let updatedCount = 0;
    for (const id of notificationIds) {
      const notification = notificationCache.get(getNotificationKey(id));
      if (notification && !notification.is_read) {
        notification.is_read = true;
        notificationCache.set(getNotificationKey(id), notification);
        updatedCount++;
      }
    }

    res.json({
      message: "All notifications marked as read",
      updated_count: updatedCount,
    });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ message: "Error updating notifications", error: err.message });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = notificationCache.get(getNotificationKey(notificationId));
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Remove from user's list
    const userNotifications = getUserNotificationIds(notification.user_id);
    const filtered = userNotifications.filter(id => id !== notificationId);
    notificationCache.set(getUserNotificationsKey(notification.user_id), filtered);

    // Delete notification
    notificationCache.del(getNotificationKey(notificationId));

    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ message: "Error deleting notification", error: err.message });
  }
};

// Delete all read notifications for a user
exports.clearReadNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notificationIds = getUserNotificationIds(userId);
    
    let deletedCount = 0;
    const remainingIds = [];
    
    for (const id of notificationIds) {
      const notification = notificationCache.get(getNotificationKey(id));
      if (notification && notification.is_read) {
        notificationCache.del(getNotificationKey(id));
        deletedCount++;
      } else if (notification) {
        remainingIds.push(id);
      }
    }

    // Update user's notification list
    notificationCache.set(getUserNotificationsKey(userId), remainingIds);

    res.json({
      message: "Read notifications cleared",
      deleted_count: deletedCount,
    });
  } catch (err) {
    console.error("Error clearing notifications:", err);
    res.status(500).json({ message: "Error clearing notifications", error: err.message });
  }
};
