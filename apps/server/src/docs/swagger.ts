import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { usersSwaggerPaths, usersSwaggerSchemas } from './users-swagger.js';
import { groupsSwaggerPaths, groupsSwaggerSchemas } from './groups-swagger.js';
import { groupMessagesSwaggerPaths } from './group-messages-swagger.js';
import { mediaSwagger } from './swagger/media.js';
import { notificationsSwagger } from './swagger/notifications.js';
import { callsSwagger } from './swagger/calls.js';
import { groupCallsSwagger } from './swagger/group-calls.js';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Communication Platform API',
    version: '1.0.0',
    description: 'API documentation for the Modular Monolith Communication Platform.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
      },
      csrfAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-csrf-token',
        description: 'CSRF token required for all state-changing endpoints (POST, DELETE, PUT, PATCH)',
      },
    },
    schemas: {
      ...usersSwaggerSchemas,
      ...groupsSwaggerSchemas,
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string', nullable: true },
          avatarUrl: { type: 'string', nullable: true },
          isEmailVerified: { type: 'boolean' },
        },
      },
      SessionResponse: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          deviceId: { type: 'string', nullable: true },
          userAgent: { type: 'string', nullable: true },
          ipAddress: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    ...groupsSwaggerPaths,
    ...groupMessagesSwaggerPaths,
    ...callsSwagger.paths,
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        description: 'Creates a new user and sends an email verification link. Requires CSRF.',
        tags: ['Auth'],
        security: [{ csrfAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered' },
          400: { description: 'Validation error' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        description: 'Authenticates user and returns HttpOnly cookies (accessToken and refreshToken). Requires CSRF.',
        tags: ['Auth'],
        security: [{ csrfAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Logged in',
            headers: {
              'Set-Cookie': {
                description: 'accessToken and refreshToken cookies',
                schema: { type: 'string' },
              },
            },
          },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        description: 'Uses the HttpOnly refreshToken to issue a new accessToken and rotates the refreshToken. Requires CSRF.',
        tags: ['Auth'],
        security: [{ cookieAuth: [] }, { csrfAuth: [] }],
        responses: {
          200: { description: 'Token refreshed' },
          401: { description: 'Refresh token missing, invalid, or revoked' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout current session',
        description: 'Revokes the current session and clears cookies. Requires CSRF and Auth.',
        tags: ['Auth'],
        security: [{ cookieAuth: [] }, { csrfAuth: [] }],
        responses: {
          200: { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/logout-all': {
      post: {
        summary: 'Logout all sessions',
        description: 'Revokes all active sessions for the user and clears cookies. Requires CSRF and Auth.',
        tags: ['Auth'],
        security: [{ cookieAuth: [] }, { csrfAuth: [] }],
        responses: {
          200: { description: 'Logged out of all devices' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user profile',
        description: 'Returns the currently authenticated user profile. Requires Auth.',
        tags: ['Auth'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'User profile',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } },
          },
          401: { description: 'Unauthorized' },
          404: { description: 'User not found' },
        },
      },
    },
    '/auth/sessions': {
      get: {
        summary: 'Get all active sessions',
        description: 'Returns all active device sessions for the authenticated user. Requires Auth.',
        tags: ['Auth'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of sessions',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/SessionResponse' } },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/sessions/{sessionId}': {
      delete: {
        summary: 'Revoke a specific session',
        description: 'Revokes an active session by its ID. Requires CSRF and Auth.',
        tags: ['Auth'],
        security: [{ cookieAuth: [] }, { csrfAuth: [] }],
        parameters: [
          {
            name: 'sessionId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Session revoked' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Request password reset',
        description: 'Generates a password reset token and sends it via email if the account exists. Requires CSRF.',
        tags: ['Auth'],
        security: [{ csrfAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Email sent if account exists' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        summary: 'Reset password',
        description: 'Consumes a password reset token to set a new password. Requires CSRF.',
        tags: ['Auth'],
        security: [{ csrfAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset successfully' },
          400: { description: 'Invalid or expired token' },
        },
      },
    },
    '/auth/verify-email': {
      post: {
        summary: 'Verify email',
        description: 'Consumes an email verification token. Requires CSRF.',
        tags: ['Auth'],
        security: [{ csrfAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: { token: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Email verified' },
          400: { description: 'Invalid or expired token' },
        },
      },
    },
    '/auth/csrf': {
      get: {
        summary: 'Get CSRF token',
        description: 'Fetches the double-submit CSRF token that must be attached to the `x-csrf-token` header for state-changing endpoints.',
        tags: ['Auth'],
        responses: {
          200: {
            description: 'CSRF token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { csrfToken: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    ...groupsSwaggerPaths,
    ...groupMessagesSwaggerPaths,
    ...mediaSwagger,
    ...notificationsSwagger,
    ...groupCallsSwagger,
  },
};

Object.assign(swaggerDocument.paths, usersSwaggerPaths);
Object.assign(swaggerDocument.components.schemas, usersSwaggerSchemas);

export function setupSwagger(app: Application) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
