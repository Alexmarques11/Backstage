const { eventBus, EventTypes } = require("../shared/eventBus");

// Initialize event bus when notifications service starts
async function initializeEventBus() {
  try {
    await eventBus.initialize();

    // Subscribe to events that should trigger notifications
    await eventBus.subscribeToEvents(
      ["ticket.purchased", "event.reminder", "listing.sold"],
      handleNotificationEvent
    );

    console.log("Notifications service subscribed to events");
  } catch (err) {
    console.error("Failed to initialize event bus:", err);
  }
}

// Handle incoming notification events
async function handleNotificationEvent(event) {
  console.log(`📬 Received event: ${event.type}`, event.data);

  try {
    switch (event.type) {
      case EventTypes.TICKET_PURCHASED:
        await createNotificationFromEvent(
          event.data.user_id,
          "ticket_purchase",
          "Ticket Purchased",
          `You bought a ticket for ${event.data.event_name}`,
          { related_id: event.data.ticket_id, related_type: "ticket" }
        );
        break;

      case EventTypes.EVENT_REMINDER:
        await createNotificationFromEvent(
          event.data.user_id,
          "event_reminder",
          "Event Reminder",
          `${event.data.event_name} is coming up soon!`,
          { related_id: event.data.event_id, related_type: "event" }
        );
        break;

      case EventTypes.LISTING_SOLD:
        await createNotificationFromEvent(
          event.data.seller_id,
          "system",
          "Ticket Sold",
          `Your ticket listing for ${event.data.event_name} was sold`,
          { related_id: event.data.listing_id, related_type: "ticket" }
        );
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error handling notification event ${event.type}:`, err);
    throw err; // Will cause message to be requeued or dead-lettered
  }
}

// Helper to create notification from event data
async function createNotificationFromEvent(
  userId,
  type,
  title,
  message,
  relatedData
) {
  const notificationCache = require("../../notificationCache");
  const { v4: uuidv4 } = require("uuid");

  const notification = {
    id: uuidv4(),
    user_id: userId,
    type,
    title,
    message,
    related_id: relatedData.related_id,
    related_type: relatedData.related_type,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  // Store in cache
  const notificationKey = `notification:${notification.id}`;
  notificationCache.set(notificationKey, notification);

  // Add to user's notification list
  const userKey = `notifications:user:${userId}`;
  const userNotifications = notificationCache.get(userKey) || [];
  userNotifications.unshift(notification.id);
  notificationCache.set(userKey, userNotifications);

  console.log(`Created notification for user ${userId}: ${title}`);

  // TODO: Send push notification here if enabled

  return notification;
}

module.exports = {
  initializeEventBus,
  handleNotificationEvent,
};
