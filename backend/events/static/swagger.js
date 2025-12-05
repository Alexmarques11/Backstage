const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backstage Events Service API",
      version: "1.0.0",
      description:
        "API para gerenciar eventos e sincronização com Ticketmaster",
    },
    servers: [
      {
        url: "http://localhost:5001",
        description: "Development Server",
      },
    ],
    tags: [
      {
        name: "Concerts",
        description: "Concert management and synchronization",
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
