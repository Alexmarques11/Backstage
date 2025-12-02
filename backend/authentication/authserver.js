require("dotenv").config();
const express = require("express");
const userRouter = require("./routes/userRoute");
const setupSwagger = require("./static/swagger");

const app = express();
const port = 4000;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "backstage-auth" });
});

// Rotas de utilizadores
app.use("/users", userRouter);

// Swagger
setupSwagger(app);

// Apenas 1 vez
app.listen(port, "0.0.0.0", () =>
  console.log(`Server running at http://0.0.0.0:${port}`)
);
