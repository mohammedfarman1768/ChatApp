import { OpenAPIV3 } from 'openapi-types';

export const groupMessagesSwaggerPaths: OpenAPIV3.PathsObject = {
  '/api/v1/group-messages/{groupId}/messages': {
    get: {
      tags: ['Group Messages'],
      summary: 'Get messages for a group',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
        { name: 'cursor', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        '200': { description: 'Success' },
      }
    },
    post: {
      tags: ['Group Messages'],
      summary: 'Send a group message',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                replyToMessageId: { type: 'string' },
              },
              required: ['content']
            }
          }
        }
      },
      responses: {
        '201': { description: 'Created' },
      }
    }
  },
  '/api/v1/group-messages/{groupId}/messages/{messageId}': {
    patch: {
      tags: ['Group Messages'],
      summary: 'Edit a group message',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'messageId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                content: { type: 'string' },
              },
              required: ['content']
            }
          }
        }
      },
      responses: {
        '200': { description: 'Success' },
      }
    },
    delete: {
      tags: ['Group Messages'],
      summary: 'Delete a group message',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'messageId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                deleteForEveryone: { type: 'boolean' },
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Success' },
      }
    }
  },
  '/api/v1/group-messages/{groupId}/messages/{messageId}/read': {
    post: {
      tags: ['Group Messages'],
      summary: 'Mark a group message as read',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'messageId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Success' },
      }
    }
  },
  '/api/v1/group-messages/{groupId}/messages/{messageId}/reactions': {
    post: {
      tags: ['Group Messages'],
      summary: 'Add a reaction',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'messageId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                emoji: { type: 'string' },
              },
              required: ['emoji']
            }
          }
        }
      },
      responses: {
        '200': { description: 'Success' },
      }
    }
  },
  '/api/v1/group-messages/{groupId}/messages/{messageId}/reactions/{emoji}': {
    delete: {
      tags: ['Group Messages'],
      summary: 'Remove a reaction',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'messageId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'emoji', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Success' },
      }
    }
  },
  '/api/v1/group-messages/{groupId}/pins': {
    post: {
      tags: ['Group Messages'],
      summary: 'Pin a message',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                messageId: { type: 'string' },
              },
              required: ['messageId']
            }
          }
        }
      },
      responses: {
        '200': { description: 'Success' },
      }
    },
    get: {
      tags: ['Group Messages'],
      summary: 'Get pinned messages',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Success' },
      }
    }
  },
  '/api/v1/group-messages/{groupId}/pins/{messageId}': {
    delete: {
      tags: ['Group Messages'],
      summary: 'Unpin a message',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'messageId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Success' },
      }
    }
  },
  '/api/v1/group-messages/{groupId}/announcements': {
    post: {
      tags: ['Group Messages'],
      summary: 'Create an announcement',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                messageId: { type: 'string' },
              },
              required: ['messageId']
            }
          }
        }
      },
      responses: {
        '201': { description: 'Created' },
      }
    },
    get: {
      tags: ['Group Messages'],
      summary: 'Get announcements',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
        { name: 'cursor', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        '200': { description: 'Success' },
      }
    }
  },
  '/api/v1/group-messages/{groupId}/messages/meta': {
    get: {
      tags: ['Group Messages'],
      summary: 'Get messaging metadata (unread counts, etc.)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Success' },
      }
    }
  }
};
