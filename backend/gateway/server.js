const express = require("express");
const cors = require("cors");
const proxy = require("express-http-proxy");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", proxy("http://127.0.0.1:4000"));
app.use("/publications", proxy("http://127.0.0.1:3000"));
app.use("/users", proxy("http://127.0.0.1:4000"));
app.use("/passport", proxy("http://127.0.0.1:5000"));
app.use("/market", proxy("http://127.0.0.1:6000"));
app.use("/events", proxy("http://127.0.0.1:7000"));
app.use("/notifications", proxy("http://127.0.0.1:4000"));

app.listen(8000, () => {
  console.log("Gateway is Listening to Port 8000");
});
