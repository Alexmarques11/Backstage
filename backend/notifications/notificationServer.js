require("dotenv").config();
const express = require("express");
const notificationRouter = require("./routes/notificationRoute");
const notificationPool = require("./notificationDb");

const app = express();
const port = process.env.NOTIFICATION_PORT || 3003;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    service: "backstage-notifications",
    timestamp: new Date().toISOString()
  });
});

// Setup route for notifications database
app.get("/setup", async (req, res) => {
  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('like', 'comment', 'event', 'system', 'ticket_purchase', 'event_reminder')),
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      related_id INT,
      related_type VARCHAR(50) CHECK (related_type IN ('post', 'comment', 'event', 'ticket')),
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
  `;

  try {
    await notificationPool.query(createTablesQuery);
    res.status(200).json({ message: "Notification tables created successfully" });
  } catch (err) {
    console.error("Error creating notification tables:", err);
    res.status(500).json({ message: "Error creating tables", error: err.message });
  }
});

// Notification routes
app.use("/notifications", notificationRouter);

app.listen(port, "0.0.0.0", () =>
  console.log(`Notifications server running on port http://0.0.0.0:${port}`)
);
