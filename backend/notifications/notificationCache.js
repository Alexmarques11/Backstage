const NodeCache = require("node-cache");

// In-memory cache for notifications
// stdTTL: 30 days in seconds
// checkperiod: Check for expired keys every hour
const notificationCache = new NodeCache({
  stdTTL: 30 * 24 * 60 * 60, // 30 days
  checkperiod: 3600, // 1 hour
  useClones: false,
});

// Helper: Get user notifications key
const getUserNotificationsKey = (userId) => `notifications:user:${userId}`;

// Get all notification IDs for a user
function getUserNotificationIds(userId) {
  const key = getUserNotificationsKey(userId);
  return notificationCache.get(key) || [];
}

// Add notification ID to user's list
function addNotificationToUser(userId, notificationId) {
  const key = getUserNotificationsKey(userId);
  const notifications = getUserNotificationIds(userId);
  notifications.unshift(notificationId); // Add to beginning
  notificationCache.set(key, notifications);
}

// Remove notification ID from user's list
function removeNotificationFromUser(userId, notificationId) {
  const key = getUserNotificationsKey(userId);
  const notifications = getUserNotificationIds(userId);
  const filtered = notifications.filter((id) => id !== notificationId);
  notificationCache.set(key, filtered);
}

// Event listeners for debugging
notificationCache.on("expired", (key, value) => {
  console.log(`Cache expired: ${key}`);
});

notificationCache.on("set", (key, value) => {
  console.log(`Cache set: ${key}`);
});

module.exports = notificationCache;
