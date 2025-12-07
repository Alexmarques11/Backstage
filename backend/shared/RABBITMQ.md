# RabbitMQ Event-Driven Architecture

## Overview
RabbitMQ is used as the message broker for asynchronous communication between microservices.

## Architecture

### Exchanges
- **backstage.events** (topic) - Main event bus for all system events
- **backstage.notifications** (topic) - Notification-specific events

### Queues
- **notifications.queue** - Notification creation events
- **email.queue** - Email sending tasks
- **analytics.queue** - Analytics/tracking events

### Event Types

#### User Events
- `user.created` - New user registered
- `user.updated` - User profile updated
- `user.deleted` - User account deleted

#### Event (Concert) Events
- `event.created` - New concert/event created
- `event.updated` - Event details modified
- `event.reminder` - Event reminder triggered

#### Ticket Events
- `ticket.purchased` - Ticket bought
- `ticket.transferred` - Ticket ownership changed

#### Market Events
- `listing.created` - New ticket listing
- `listing.sold` - Ticket listing sold

## Usage

### Publishing Events

```javascript
const { eventBus, EventTypes } = require("../shared/eventBus");

// Initialize once at startup
await eventBus.initialize();

// Publish an event
await eventBus.publishEvent(EventTypes.POST_CREATED, {
  post_id: 123,
  user_id: 456,
  title: "My Post"
});

// Send notification via event bus
await eventBus.sendNotification(
  userId,
  "like",
  "New Like",
  "Someone liked your post",
  { related_id: postId, related_type: "post" }
);
```

### Subscribing to Events

```javascript
const { eventBus } = require("../shared/eventBus");

await eventBus.initialize();

// Subscribe to specific event patterns
await eventBus.subscribeToEvents(
  ["post.*", "user.created"], 
  async (event) => {
    console.log("Received event:", event);
    // Handle event
  }
);
```

## Environment Variables

```env
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=backstage
RABBITMQ_PASSWORD=rabbitmq123
RABBITMQ_URL=amqp://backstage:rabbitmq123@localhost:5672  # Alternative
SERVICE_NAME=your-service-name  # For queue naming
```

## Local Development

Access RabbitMQ Management UI:
- URL: http://localhost:15672
- Username: backstage
- Password: rabbitmq123 (or from env)

## Kubernetes

RabbitMQ is deployed as a single pod with management UI:
- Service: `backstage-rabbitmq`
- AMQP Port: 5672
- Management Port: 15672

## Integration Examples

### Publications Service

```javascript
// When a concert/event is created
const { eventBus, EventTypes } = require("../shared/eventBus");

await eventBus.publishEvent(EventTypes.EVENT_CREATED, {
  event_id: newEvent.id,
  event_name: newEvent.title,
  user_id: newEvent.user_id
});
```

### Notifications Service

```javascript
// Subscribe to events that need notifications
await eventBus.subscribeToEvents(
  ["ticket.purchased", "event.reminder", "listing.sold"],
  async (event) => {
    // Create notification based on event
    await createNotification(event.data);
  }
);
```

## Benefits

1. **Decoupling** - Services don't need to know about each other
2. **Reliability** - Messages are persisted and guaranteed delivery
3. **Scalability** - Multiple consumers can process messages in parallel
4. **Flexibility** - Easy to add new event consumers without changing publishers
5. **Async Processing** - Non-blocking operations improve performance
