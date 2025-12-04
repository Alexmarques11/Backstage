require("dotenv").config();
const express = require("express");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const setupSwagger = require("./static/swagger");

const app = express();
const port = 4000;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "backstage-auth" });
});

// Rotas de autenticação
app.use("/auth", authRoutes);

// Rotas de utilizador
app.use("/user", userRoutes);

// Rotas de administrador
app.use("/admin", adminRoutes);

// Swagger
setupSwagger(app);

// Apenas 1 vez
app.listen(port, "0.0.0.0", () =>
  console.log(`Server running at http://0.0.0.0:${port}`)
);
