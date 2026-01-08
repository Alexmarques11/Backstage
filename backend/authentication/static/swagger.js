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
        url: process.env.SWAGGER_SERVER_URL || "http://144.126.227.141:30000/auth",
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

const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { background-color: #1a1a2e; }
    .swagger-ui .topbar .download-url-wrapper .select-label { color: #fff; }
    .swagger-ui .info .title { color: #e94560; }
    .swagger-ui .info .description { color: #333; }
    .swagger-ui .opblock.opblock-post { border-color: #49cc90; background: rgba(73, 204, 144, 0.1); }
    .swagger-ui .opblock.opblock-get { border-color: #61affe; background: rgba(97, 175, 254, 0.1); }
    .swagger-ui .opblock.opblock-put { border-color: #fca130; background: rgba(252, 161, 48, 0.1); }
    .swagger-ui .opblock.opblock-delete { border-color: #f93e3e; background: rgba(249, 62, 62, 0.1); }
    .swagger-ui .opblock.opblock-patch { border-color: #50e3c2; background: rgba(80, 227, 194, 0.1); }
    .swagger-ui .btn.authorize { border-color: #e94560; color: #e94560; }
    .swagger-ui .btn.authorize svg { fill: #e94560; }
    .swagger-ui section.models { border-color: #1a1a2e; }
    .swagger-ui section.models h4 { color: #1a1a2e; }
  `,
  customSiteTitle: "Backstage Auth API",
  customfavIcon: "https://cdn-icons-png.flaticon.com/512/3844/3844724.png",
};

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
};

module.exports = setupSwagger;
