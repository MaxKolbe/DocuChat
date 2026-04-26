import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DocuChat API",
      version: "1.0.0",
      description: "AI-Powered Document Q&A System",
    },
    servers: [{ url: "/api/v1", description: "Version 1" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    "./src/modules/auth/*.ts",
    "./src/modules/document/*.ts",
    "./src/modules/conversation/*.ts",
    "./src/modules/admin/*.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
