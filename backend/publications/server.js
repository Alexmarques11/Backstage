require("dotenv").config();
const express = require("express");
const concertsRoutes = require("./src/routes/concertsRoutes");
// const setupSwagger = require("./static/swagger");
const { connectRabbitMQ } = require("./src/utils/rabbitmq");

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
// setupSwagger(app);

//Connect to RabbitMQ
connectRabbitMQ();

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Publication service running at http://0.0.0.0:${PORT}`)
);
