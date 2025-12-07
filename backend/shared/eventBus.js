const rabbitmqClient = require("./rabbitmqClient");

// Event types for the system
const EventTypes = {
  // User events
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",

  // Event (concert) events
  EVENT_CREATED: "event.created",
  EVENT_UPDATED: "event.updated",
  EVENT_REMINDER: "event.reminder",

  // Ticket events
  TICKET_PURCHASED: "ticket.purchased",
  TICKET_TRANSFERRED: "ticket.transferred",

  // Market events
  LISTING_CREATED: "listing.created",
  LISTING_SOLD: "listing.sold",

  // Notification events
  NOTIFICATION_SEND: "notification.send",
};

// Exchange names
const Exchanges = {
  EVENTS: "backstage.events",
  NOTIFICATIONS: "backstage.notifications",
};

// Queue names
const Queues = {
  NOTIFICATIONS: "notifications.queue",
  EMAIL: "email.queue",
  ANALYTICS: "analytics.queue",
};

class EventBus {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    await rabbitmqClient.connect();

    // Create exchanges
    await rabbitmqClient.assertExchange(Exchanges.EVENTS, "topic");
    await rabbitmqClient.assertExchange(Exchanges.NOTIFICATIONS, "topic");

    // Create queues
    await rabbitmqClient.assertQueue(Queues.NOTIFICATIONS);
    await rabbitmqClient.assertQueue(Queues.EMAIL);
    await rabbitmqClient.assertQueue(Queues.ANALYTICS);

    this.isInitialized = true;
    console.log("✅ Event Bus initialized");
  }

  // Publish an event to the event bus
  async publishEvent(eventType, data, options = {}) {
    try {
      const event = {
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
        service: process.env.SERVICE_NAME || "unknown",
      };

      await rabbitmqClient.publish(Exchanges.EVENTS, eventType, event, options);
      console.log(`📤 Published event: ${eventType}`);
    } catch (err) {
      console.error(`Failed to publish event ${eventType}:`, err);
      throw err;
    }
  }

  // Subscribe to specific event types
  async subscribeToEvents(eventPatterns, callback) {
    const queueName = `${process.env.SERVICE_NAME || "service"}.events`;
    await rabbitmqClient.assertQueue(queueName, { exclusive: false, durable: true });

    // Bind queue to exchange with patterns
    for (const pattern of eventPatterns) {
      await rabbitmqClient.channel.bindQueue(queueName, Exchanges.EVENTS, pattern);
      console.log(`📥 Subscribed to event pattern: ${pattern}`);
    }

    // Start consuming
    await rabbitmqClient.consume(queueName, callback);
  }

  // Send notification event
  async sendNotification(userId, type, title, message, relatedData = {}) {
    const notificationEvent = {
      user_id: userId,
      type,
      title,
      message,
      related_id: relatedData.related_id,
      related_type: relatedData.related_type,
      timestamp: new Date().toISOString(),
    };

    await rabbitmqClient.sendToQueue(Queues.NOTIFICATIONS, notificationEvent);
    console.log(`🔔 Notification queued for user ${userId}`);
  }

  async close() {
    await rabbitmqClient.close();
  }
}

// Export singleton instance
const eventBus = new EventBus();

module.exports = {
  eventBus,
  EventTypes,
  Exchanges,
  Queues,
};
