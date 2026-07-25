export const groupsSwaggerPaths = {
  '/groups': {
    post: {
      tags: ['Groups'],
      summary: 'Create a new group',
      security: [{ cookieAuth: [] }, { csrfAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateGroup',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Group created successfully',
        },
      },
    },
  },
  '/groups/{groupId}': {
    get: {
      tags: ['Groups'],
      summary: 'Get group details',
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Group details retrieved successfully',
        },
      },
    },
    patch: {
      tags: ['Groups'],
      summary: 'Update group details',
      security: [{ cookieAuth: [] }, { csrfAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Group updated successfully',
        },
      },
    },
    delete: {
      tags: ['Groups'],
      summary: 'Delete a group',
      security: [{ cookieAuth: [] }, { csrfAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Group deleted successfully',
        },
      },
    },
  },
  '/groups/{groupId}/members': {
    get: {
      tags: ['Groups'],
      summary: 'Get group members',
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Group members retrieved successfully',
        },
      },
    },
  },
  '/groups/{groupId}/join': {
    post: {
      tags: ['Groups'],
      summary: 'Join a group',
      security: [{ cookieAuth: [] }, { csrfAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Joined group successfully',
        },
      },
    },
  },
  '/groups/{groupId}/leave': {
    post: {
      tags: ['Groups'],
      summary: 'Leave a group',
      security: [{ cookieAuth: [] }, { csrfAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Left group successfully',
        },
      },
    },
  },
};

export const groupsSwaggerSchemas = {
  CreateGroup: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      avatarUrl: { type: 'string' },
    },
    required: ['name'],
  },
};
