const express = require("express");
const cors = require("cors");
const proxy = require("express-http-proxy");  

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "backstage-gateway",
    timestamp: new Date().toISOString(),
  });
});

// Routes - Using Kubernetes service DNS names
// Each route proxies ALL requests (GET, POST, PUT, DELETE, etc.) to the respective service
app.use("/auth", proxy("http://backstage-auth-service"));
app.use("/user", proxy("http://backstage-auth-service"));
app.use("/publications", proxy("http://backstage-server-service"));
app.use("/passport", proxy("http://backstage-passport-service"));
app.use("/market", proxy("http://backstage-market-service"));
app.use("/concerts", proxy("http://backstage-events-service"));
app.use("/events", proxy("http://backstage-events-service"));
app.use("/notifications", proxy("http://backstage-notifications-service"));

const PORT = process.env.PORT || 8000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚪 Gateway is listening on port ${PORT}`);
  console.log(`📡 Proxying to internal Kubernetes services:`);
  console.log(`   - /auth → backstage-auth-service`);
  console.log(`   - /user → backstage-auth-service`);
  console.log(`   - /publications → backstage-server-service`);
  console.log(`   - /passport → backstage-passport-service`);
  console.log(`   - /market → backstage-market-service`);
  console.log(`   - /concerts → backstage-events-service`);
  console.log(`   - /events → backstage-events-service`);
  console.log(`   - /notifications → backstage-notifications-service`);
});
