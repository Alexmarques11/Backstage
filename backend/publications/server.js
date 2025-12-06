require("dotenv").config();
const express = require("express");
const concertsRoutes = require("./src/routes/concertsRoutes");
const adminRoutes = require("./src/routes/concertsAdminRoutes");
const setupSwagger = require("./static/swagger");

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "backstage-events" });
});

// Concerts routes
app.use("/publications", concertsRoutes);
app.use("/publications-admin", adminRoutes);

// Swagger
setupSwagger(app);

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Publication service running at http://0.0.0.0:${PORT}`)
);
