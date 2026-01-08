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
        url: process.env.SWAGGER_SERVER_URL || "http://144.126.227.141:30000/market",
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
  customSiteTitle: "Backstage Market API",
};

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
};

module.exports = setupSwagger;
