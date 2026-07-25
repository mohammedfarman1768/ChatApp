export const searchSwagger = {
  '/search': {
    get: {
      summary: 'Search across platform',
      description: 'Search users, groups, messages, media with permission-aware filtering. Requires Auth.',
      tags: ['Search'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: 'query',
          in: 'query',
          required: true,
          schema: { type: 'string' },
        },
        {
          name: 'category',
          in: 'query',
          required: false,
          schema: { type: 'string', enum: ['ALL', 'USERS', 'GROUPS', 'MESSAGES', 'MEDIA'], default: 'ALL' },
        },
        {
          name: 'cursor',
          in: 'query',
          required: false,
          schema: { type: 'string' },
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', default: 20 },
        },
      ],
      responses: {
        200: { description: 'Search results' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/search/messages': {
    get: {
      summary: 'Search messages',
      tags: ['Search'],
      security: [{ cookieAuth: [] }],
      parameters: [{ name: 'query', in: 'query', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Message search results' }, 401: { description: 'Unauthorized' } },
    },
  },
  '/search/groups': {
    get: {
      summary: 'Search groups',
      tags: ['Search'],
      security: [{ cookieAuth: [] }],
      parameters: [{ name: 'query', in: 'query', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Group search results' }, 401: { description: 'Unauthorized' } },
    },
  },
  '/search/users': {
    get: {
      summary: 'Search users',
      tags: ['Search'],
      security: [{ cookieAuth: [] }],
      parameters: [{ name: 'query', in: 'query', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'User search results' }, 401: { description: 'Unauthorized' } },
    },
  },
  '/search/media': {
    get: {
      summary: 'Search media',
      tags: ['Search'],
      security: [{ cookieAuth: [] }],
      parameters: [{ name: 'query', in: 'query', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Media search results' }, 401: { description: 'Unauthorized' } },
    },
  },
  '/search/history': {
    get: {
      summary: 'Get search history',
      description: 'Returns the recent search history for the authenticated user. Requires Auth.',
      tags: ['Search'],
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: 'List of search history entries' },
        401: { description: 'Unauthorized' },
      },
    },
    delete: {
      summary: 'Clear search history',
      description: 'Clears the search history for the authenticated user. Requires Auth and CSRF.',
      tags: ['Search'],
      security: [{ cookieAuth: [] }, { csrfAuth: [] }],
      responses: {
        200: { description: 'Search history cleared' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/search/suggestions': {
    get: {
      summary: 'Get search suggestions',
      description: 'Returns search suggestions based on past queries. Requires Auth.',
      tags: ['Search'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: 'query',
          in: 'query',
          required: false,
          schema: { type: 'string' },
        }
      ],
      responses: {
        200: { description: 'List of suggestions' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/search/reindex': {
    post: {
      summary: 'Request manual reindex',
      description: 'Requests a reindex of searchable entities. Requires Auth and CSRF.',
      tags: ['Search'],
      security: [{ cookieAuth: [] }, { csrfAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                entityType: { type: 'string', enum: ['USER', 'GROUP', 'MESSAGE', 'GROUP_MESSAGE', 'MEDIA'] }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Reindex requested' },
        401: { description: 'Unauthorized' },
      },
    }
  }
};
