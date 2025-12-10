require("dotenv").config();
const express = require("express");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const setupSwagger = require("./static/swagger");
const pool = require("./src/db/authDb");
const createTables = require("./src/db/setupTables");
const { connectRabbitMQ } = require("./src/utils/rabbitmq");
const {
  startPublicationEventListener,
} = require("./src/services/publicationEventHandler");

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "backstage-auth" });
});

// Rotas de autenticação
app.use("/auth", authRoutes);

// Rotas de utilizador
app.use("/user", userRoutes);

// Swagger
setupSwagger(app);

//Initialize database and RabbitMQ
async function initializeServices() {
  await createTables();
  await connectRabbitMQ();
  await startPublicationEventListener();
}

initializeServices().catch((err) => {
  console.error("Failed to initialize services:", err);
  process.exit(1);
});

// Apenas 1 vez
app.listen(port, "0.0.0.0", () =>
  console.log(`Server running at http://0.0.0.0:${port}`)
);
