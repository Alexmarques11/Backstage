require("dotenv").config();
const express = require("express");
const concertsRoutes = require("./src/routes/concertsRoutes");
const setupSwagger = require("./static/swagger");
const createTables = require("./src/db/setupTables");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "backstage-passport" });
});

// Passport routes
app.use("/passport", concertsRoutes);

// Swagger
setupSwagger(app);

// Initialize server
async function startServer() {
  try {
    // Create tables if they don't exist
    await createTables();

    // Start the server
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`Passport service running at http://0.0.0.0:${PORT}`)
    );
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
