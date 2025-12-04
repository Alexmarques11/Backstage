const express = require("express");
require("dotenv").config();

const concertsRoutes = require("./src/routes/concertsRoutes");

const app = express();
app.use(express.json());

app.use("/concerts", concertsRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`Concert service running on port http://0.0.0.0:${PORT}`)
);
