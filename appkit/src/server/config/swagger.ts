import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AppKit API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for AppKit family management platform',
      contact: {
        name: 'API Support',
        email: 'support@appkit.com',
        url: 'https://appkit.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.appkit.com' 
          : 'http://localhost:4000',
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server'
      },
      {
        url: 'https://staging-api.appkit.com',
        description: 'Staging server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from /api/auth/login'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for service-to-service communication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'email', 'firstName', 'lastName'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            phoneNumber: {
              type: 'string',
              description: 'User phone number'
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
              description: 'Profile picture URL'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user account is active'
            },
            isVerified: {
              type: 'boolean',
              description: 'Whether the user email is verified'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'User password'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Login success status'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                accessToken: {
                  type: 'string',
                  description: 'JWT access token'
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT refresh token'
                },
                expiresIn: {
                  type: 'integer',
                  description: 'Token expiration time in seconds'
                }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code'
                },
                message: {
                  type: 'string',
                  description: 'Error message'
                },
                details: {
                  type: 'object',
                  description: 'Additional error details'
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object'
                  },
                  description: 'Array of items'
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'integer',
                      description: 'Current page number'
                    },
                    limit: {
                      type: 'integer',
                      description: 'Items per page'
                    },
                    total: {
                      type: 'integer',
                      description: 'Total number of items'
                    },
                    totalPages: {
                      type: 'integer',
                      description: 'Total number of pages'
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Circles',
        description: 'Family circle management'
      },
      {
        name: 'Safety',
        description: 'Safety and emergency features'
      },
      {
        name: 'Files',
        description: 'File upload and management'
      },
      {
        name: 'Notifications',
        description: 'Push notifications management'
      },
      {
        name: 'Admin',
        description: 'Administrative operations'
      }
    ]
  },
  apis: [
    './src/server/routes/*.ts',
    './src/server/routes/**/*.ts',
    './src/server/controllers/*.ts',
    './src/server/controllers/**/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Application): void {
  // Swagger UI configuration
  const swaggerUiOptions = {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .scheme-container { margin: 20px 0 }
    `,
    customSiteTitle: 'AppKit API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      tryItOutEnabled: process.env.NODE_ENV !== 'production'
    }
  };

  // Serve swagger documentation
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(specs, swaggerUiOptions));

  // Serve OpenAPI JSON specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Add security metadata to all routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') && req.path !== '/api/health') {
      res.setHeader('X-API-Documentation', '/api-docs');
    }
    next();
  });

  console.log('ðŸ“š Swagger documentation available at /api-docs');
}

export { specs, options };
export default { setupSwagger, specs, options };
