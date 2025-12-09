require("dotenv").config();
const express = require("express");
const marketRoutes = require("./src/routes/marketRoutes");
// const setupSwagger = require("./static/swagger");

const app = express();
const PORT = process.env.PORT || 6000;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "backstage-events" });
});

// Concerts routes
app.use("/market", marketRoutes);

// Swagger
// setupSwagger(app);

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Publication service running at http://0.0.0.0:${PORT}`)
);
