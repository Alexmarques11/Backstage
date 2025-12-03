const notificationPool = require("../notificationDb");

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { unread_only } = req.query;

    let query = `
      SELECT id, user_id, type, title, message, related_id, related_type, is_read, created_at
      FROM notifications
      WHERE user_id = $1
    `;

    if (unread_only === "true") {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await notificationPool.query(query, [userId]);

    res.json({
      count: result.rows.length,
      notifications: result.rows,
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

    const result = await notificationPool.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({ unread_count: parseInt(result.rows[0].count) });
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

    const validTypes = ['like', 'comment', 'event', 'system', 'ticket_purchase', 'event_reminder'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }

    const result = await notificationPool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, type, title, message, related_id, related_type]
    );

    res.status(201).json({
      message: "Notification created",
      notification: result.rows[0],
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

    const result = await notificationPool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1
       RETURNING *`,
      [notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      message: "Notification marked as read",
      notification: result.rows[0],
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

    const result = await notificationPool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1 AND is_read = false
       RETURNING id`,
      [userId]
    );

    res.json({
      message: "All notifications marked as read",
      updated_count: result.rows.length,
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

    const result = await notificationPool.query(
      `DELETE FROM notifications WHERE id = $1 RETURNING id`,
      [notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

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

    const result = await notificationPool.query(
      `DELETE FROM notifications WHERE user_id = $1 AND is_read = true RETURNING id`,
      [userId]
    );

    res.json({
      message: "Read notifications cleared",
      deleted_count: result.rows.length,
    });
  } catch (err) {
    console.error("Error clearing notifications:", err);
    res.status(500).json({ message: "Error clearing notifications", error: err.message });
  }
};
