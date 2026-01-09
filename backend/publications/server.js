require("dotenv").config();
const express = require("express");
const concertsRoutes = require("./src/routes/concertsRoutes");
const setupSwagger = require("./static/swagger");
const { connectRabbitMQ } = require("./src/utils/rabbitmq");
const createTables = require("./src/db/setupTables");

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "backstage-publications",
    timestamp: new Date().toISOString(),
  });
});

// Concerts routes
app.use("/publications", concertsRoutes);

// Swagger
setupSwagger(app);

// Initialize server
async function startServer() {
  try {
    // Create tables if they don't exist
    await createTables();

    // Connect to RabbitMQ
    await connectRabbitMQ();

    // Start the server
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`Publication service running at http://0.0.0.0:${PORT}`)
    );
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
