require("dotenv").config();
const express = require("express");
const userRouter = require("./routes/userRoute");
const userProfileRouter = require("./routes/userProfileRoute");
const app = express();
const port = 4000;

app.use(express.json());

// health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "backstage-auth" });
});

// Authentication routes
app.use("/auth", userRouter);

// User profile routes
app.use("/users", userProfileRouter);

app.listen(port, "0.0.0.0", () =>
  console.log(`Server running at http://0.0.0.0:${port}`)
);
