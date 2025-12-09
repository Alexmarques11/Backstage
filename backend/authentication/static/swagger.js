const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backstage Authentication Service API",
      version: "1.0.0",
      description:
        "API para gerir utilizadores, autenticação, preferências musicais e administração",
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || "http://159.65.95.83:30002",
        description: "Production Server (Direct)",
      },
      {
        url: "http://159.65.95.83:30000/auth",
        description: "Production Server (Gateway)",
      },
      {
        url: "http://localhost:4000",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    tags: [
      {
        name: "Auth",
        description: "Authentication endpoints and token management",
      },
      {
        name: "User",
        description: "User profile and preferences management",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsDoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
