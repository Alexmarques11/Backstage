require("dotenv").config();
const express = require("express");
const notificationRouter = require("./src/routes/notificationRoute");
const notificationCache = require("./notificationCache");
const setupSwagger = require("./static/swagger");
const { connectRabbitMQ } = require("./src/utils/rabbitmq");
const {
  startConcertRecommendationsConsumer,
} = require("./src/services/concertRecommendationHandler");
const {
  startPublicationNotificationConsumer,
} = require("./src/services/publicationNotificationHandler");

const app = express();
const PORT = process.env.NOTIFICATION_PORT || 3003;

app.use(express.json());

//Health check
app.get("/health", (req, res) => {
  const stats = notificationCache.getStats();
  res.json({
    status: "healthy",
    service: "backstage-notifications",
    cache_stats: stats,
    timestamp: new Date().toISOString(),
  });
});

//Notification routes
app.use("/notifications", notificationRouter);

//Swagger
setupSwagger(app);

//Connect to RabbitMQ and start consumers
async function initializeRabbitMQ() {
  await connectRabbitMQ();
  setTimeout(() => {
    startConcertRecommendationsConsumer();
    startPublicationNotificationConsumer();
  }, 1000);
}

initializeRabbitMQ();

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Notifications service running at http://0.0.0.0:${PORT}`)
);
