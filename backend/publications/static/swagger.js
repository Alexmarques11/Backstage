const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backstage Publications API",
      version: "1.0.0",
      description:
        "API para gestão de publicações de concertos",
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || "http://144.126.227.141:30000/publications",
        description: "Production Server (Gateway)",
      },
      {
        url: "http://localhost:13000",
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
