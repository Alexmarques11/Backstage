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

const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { background-color: #1a1a2e; }
    .swagger-ui .info .title { color: #e94560; }
    .swagger-ui .opblock.opblock-post { border-color: #49cc90; background: rgba(73, 204, 144, 0.1); }
    .swagger-ui .opblock.opblock-get { border-color: #61affe; background: rgba(97, 175, 254, 0.1); }
    .swagger-ui .opblock.opblock-put { border-color: #fca130; background: rgba(252, 161, 48, 0.1); }
    .swagger-ui .opblock.opblock-delete { border-color: #f93e3e; background: rgba(249, 62, 62, 0.1); }
    .swagger-ui .btn.authorize { border-color: #e94560; color: #e94560; }
    .swagger-ui .btn.authorize svg { fill: #e94560; }
  `,
  customSiteTitle: "Backstage Publications API",
};

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
};

module.exports = setupSwagger;
