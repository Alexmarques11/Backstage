const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backstage Market API",
      version: "1.0.0",
      description:
        "API para marketplace de bilhetes de concertos",
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || "http://159.65.95.83:30004",
        description: "Production Server (Direct)",
      },
      {
        url: "http://159.65.95.83:30000/market",
        description: "Production Server (Gateway)",
      },
      {
        url: "http://localhost:6000",
        description: "Development Server",
      },
    ],
    tags: [
      {
        name: "Market",
        description: "Concert ticket marketplace",
      },
    ],
    components: {
      securitySchemes: {
        Bearer: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsDoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("Swagger documentation available at http://localhost:6000/api-docs");
};

module.exports = setupSwagger;
