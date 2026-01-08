const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backstage Notifications Service API",
      version: "1.0.0",
      description:
        "API for managing user notifications, concert recommendations, and real-time updates",
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || "http://144.126.227.141:30000/notifications",
        description: "Production Server (Gateway)",
      },
      {
        url: "http://localhost:3003",
        description: "Development Server",
      },
    ],
    components: {
      schemas: {
        Notification: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Unique notification identifier",
            },
            user_id: {
              type: "integer",
              description: "User ID who receives the notification",
            },
            type: {
              type: "string",
              enum: [
                "concert_recommendations",
                "ticket_purchase",
                "event_reminder",
                "system",
              ],
              description: "Type of notification",
            },
            title: {
              type: "string",
              description: "Notification title",
            },
            message: {
              type: "string",
              description: "Notification message content",
            },
            related_id: {
              type: "string",
              nullable: true,
              description: "Related entity ID (concert, ticket, etc.)",
            },
            related_type: {
              type: "string",
              nullable: true,
              description: "Related entity type",
            },
            metadata: {
              type: "object",
              nullable: true,
              description: "Additional notification metadata",
            },
            is_read: {
              type: "boolean",
              description: "Whether notification has been read",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Notification creation timestamp",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Notifications",
        description: "Notification management endpoints",
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
