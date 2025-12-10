require("dotenv").config();
const express = require("express");
const marketRoutes = require("./src/routes/marketRoutes");
const setupSwagger = require("./static/swagger");
const createTables = require("./src/db/setupTables");

const app = express();
const PORT = process.env.PORT || 6000;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "backstage-market" });
});

// Market routes
app.use("/market", marketRoutes);

// Swagger
setupSwagger(app);

async function initializeServices() {
  await createTables();
}

initializeServices().catch((err) => {
  console.error("Failed to initialize services:", err);
  process.exit(1);
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Market service running at http://0.0.0.0:${PORT}`)
);
