require("dotenv").config();
const express = require("express");
const notificationRouter = require("./routes/notificationRoute");
const notificationCache = require("./notificationCache");
const { initializeEventBus } = require("./services/notificationEventHandler");

const app = express();
const port = process.env.NOTIFICATION_PORT || 3003;

app.use(express.json());

// Initialize event bus for receiving notification events
initializeEventBus().catch(err => {
  console.error("Failed to initialize event bus:", err);
});

// Health check
app.get("/health", (req, res) => {
  const stats = notificationCache.getStats();
  res.json({ 
    status: "healthy", 
    service: "backstage-notifications",
    version: "1.0.1",
    cache: "in-memory",
    cache_keys: stats.keys,
    cache_hits: stats.hits,
    cache_misses: stats.misses,
    timestamp: new Date().toISOString()
  });
});

// Setup route - no database needed, using in-memory cache
app.get("/setup", (req, res) => {
  const stats = notificationCache.getStats();
  res.status(200).json({ 
    message: "Notifications service ready (In-Memory Cache)",
    cache_status: "active",
    cache_stats: stats
  });
});

// Notification routes
app.use("/notifications", notificationRouter);

app.listen(port, "0.0.0.0", () =>
  console.log(`Notifications server running on port http://0.0.0.0:${port}`)
);
