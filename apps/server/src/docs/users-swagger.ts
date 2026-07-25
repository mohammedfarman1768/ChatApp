export const usersSwaggerPaths = {
  '/users/me': {
    get: {
      summary: 'Get current user profile',
      tags: ['Users'],
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: 'Profile retrieved' },
      },
    },
    patch: {
      summary: 'Update current user profile',
      tags: ['Users'],
      security: [{ cookieAuth: [], csrfAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileInput' } } },
      },
      responses: {
        200: { description: 'Profile updated' },
      },
    },
  },
  '/users/me/privacy': {
    patch: {
      summary: 'Update privacy settings',
      tags: ['Users'],
      security: [{ cookieAuth: [], csrfAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdatePrivacyInput' } } },
      },
      responses: {
        200: { description: 'Privacy settings updated' },
      },
    },
  },
  '/users/search': {
    get: {
      summary: 'Search users',
      tags: ['Users'],
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: 'query', in: 'query', required: true, schema: { type: 'string' } },
        { name: 'cursor', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Search results' },
      },
    },
  },
  '/users/{username}': {
    get: {
      summary: 'Get user profile by username',
      tags: ['Users'],
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: 'username', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Profile retrieved' },
        404: { description: 'User not found' },
      },
    },
  },
};

export const usersSwaggerSchemas = {
  UpdateProfileInput: {
    type: 'object',
    properties: {
      username: { type: 'string' },
      bio: { type: 'string', nullable: true },
      avatarUrl: { type: 'string', nullable: true },
      customStatus: { type: 'string', nullable: true },
    },
  },
  UpdatePrivacyInput: {
    type: 'object',
    properties: {
      profileVisibility: { type: 'string', enum: ['PUBLIC', 'FRIENDS', 'PRIVATE'] },
      statusVisibility: { type: 'string', enum: ['PUBLIC', 'FRIENDS', 'PRIVATE'] },
    },
  },
};
