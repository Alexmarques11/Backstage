# Notifications Microservice

Handles all notification-related operations for the Backstage platform.

## Quick Start

### Local Development
```bash
# From backend directory
npm run devNotifications

# Or directly
cd notifications
npm install
npm start
```

### Docker
```bash
# From backend directory
docker-compose up notifications
```

## Configuration

The service runs on **port 3003** (18000 when exposed via Docker).

### Environment Variables
```env
NOTIFICATION_DB_HOST=localhost
NOTIFICATION_DB_USER=postgres
NOTIFICATION_DB_PASSWORD=password
NOTIFICATION_DB_NAME=notification_db
NOTIFICATION_DB_PORT=5432
NOTIFICATION_DB_SSL=false
NOTIFICATION_PORT=3003
```

## Database Setup

Hit the setup endpoint to create the notifications table:
```bash
GET http://localhost:3003/setup
```

## API Endpoints

Base URL: `http://localhost:3003`

### Get Notifications
- **GET** `/notifications/:userId` - Get all notifications for a user
  - Query params: `?unread_only=true` - Filter unread notifications only
  
### Get Unread Count
- **GET** `/notifications/:userId/unread-count` - Get count of unread notifications

### Create Notification
- **POST** `/notifications`
  - Body: `{ user_id, type, title, message, related_id?, related_type? }`
  - Types: `like`, `comment`, `event`, `system`, `ticket_purchase`, `event_reminder`
  - Related types: `post`, `comment`, `event`, `ticket`

### Mark as Read
- **PATCH** `/notifications/:notificationId/read` - Mark single notification as read
- **PATCH** `/notifications/:userId/read-all` - Mark all notifications as read

### Delete Notifications
- **DELETE** `/notifications/:notificationId` - Delete specific notification
- **DELETE** `/notifications/:userId/clear-read` - Clear all read notifications

## Health Check
```bash
GET http://localhost:3003/health
```

## Testing

Use the `testNotifications.rest` file with REST Client extension in VS Code.

## Architecture

```
notifications/
├── controllers/
│   └── notificationController.js  # Business logic
├── routes/
│   └── notificationRoute.js       # Route definitions
├── notificationDb.js              # Database connection
├── notificationServer.js          # Express app
└── package.json                   # Dependencies
```

## Database Schema

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) CHECK (type IN ('like', 'comment', 'event', 'system', 'ticket_purchase', 'event_reminder')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_id INT,
  related_type VARCHAR(50) CHECK (related_type IN ('post', 'comment', 'event', 'ticket')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
