const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backstage Passport API",
      version: "1.0.0",
      description:
        "API para gestão de passaportes de concertos (check-in/check-out)",
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || "http://159.65.95.83:30003",
        description: "Production Server (Direct)",
      },
      {
        url: "http://159.65.95.83:30000/passport",
        description: "Production Server (Gateway)",
      },
      {
        url: "http://localhost:5000",
        description: "Development Server",
      },
    ],
    tags: [
      {
        name: "Passport",
        description: "Concert passport management (check-in/check-out)",
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
  console.log("Swagger documentation available at http://localhost:5000/api-docs");
};

module.exports = setupSwagger;
