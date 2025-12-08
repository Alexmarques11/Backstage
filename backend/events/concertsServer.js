require("dotenv").config();
const express = require("express");
const concertsRoutes = require("./src/routes/concertsRoutes");
const setupSwagger = require("./static/swagger");
const pool = require("./src/db/concertsDb");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "backstage-events",
    timestamp: new Date().toISOString(),
  });
});

// Concerts public routes
app.use("/concerts", concertsRoutes);

// Swagger
setupSwagger(app);

app.listen(PORT, "0.0.0.0", () =>
  console.log(`🎵 Concert service running at http://0.0.0.0:${PORT}`)
);
