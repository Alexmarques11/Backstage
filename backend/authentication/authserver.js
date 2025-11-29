require("dotenv").config();
const express = require("express");
const userRouter = require("./routes/userRoute");
const setupSwagger = require("./static/swagger");
const app = express();
const port = 4000;

app.use(express.json());

// health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "backstage-auth" });
});

app.use("/users", userRouter);

setupSwagger(app);
app.listen(4000, () => console.log("Server running on port 4000"));

app.listen(port, "0.0.0.0", () =>
  console.log(`Server running at http://0.0.0.0:${port}`)
);
