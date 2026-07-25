export const notificationsSwagger = {
  '/api/v1/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'Get Notifications',
      description: 'Fetch paginated notifications for the authenticated user.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'cursor', in: 'query', schema: { type: 'string' } },
        { name: 'limit', in: 'query', schema: { type: 'number', default: 50 } },
        { name: 'includeRead', in: 'query', schema: { type: 'boolean', default: true } }
      ],
      responses: {
        200: { description: 'List of notifications' }
      }
    },
    delete: {
      tags: ['Notifications'],
      summary: 'Clear Notifications',
      description: 'Soft delete all notifications for the user.',
      security: [{ bearerAuth: [] }, { csrfAuth: [] }],
      responses: {
        200: { description: 'All notifications cleared' }
      }
    }
  },
  '/api/v1/notifications/unread': {
    get: {
      tags: ['Notifications'],
      summary: 'Get Unread Count',
      description: 'Returns the total number of unread notifications for the user.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Unread count' }
      }
    }
  },
  '/api/v1/notifications/read-all': {
    patch: {
      tags: ['Notifications'],
      summary: 'Mark All As Read',
      description: 'Marks all unread notifications as read for the user.',
      security: [{ bearerAuth: [] }, { csrfAuth: [] }],
      responses: {
        200: { description: 'Notifications marked read' }
      }
    }
  },
  '/api/v1/notifications/{id}': {
    get: {
      tags: ['Notifications'],
      summary: 'Get Notification',
      description: 'Fetch a single notification by ID.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Notification data' },
        404: { description: 'Not found' }
      }
    },
    delete: {
      tags: ['Notifications'],
      summary: 'Delete Notification',
      description: 'Soft delete a specific notification.',
      security: [{ bearerAuth: [] }, { csrfAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Notification deleted' },
        404: { description: 'Not found' }
      }
    }
  },
  '/api/v1/notifications/{id}/read': {
    patch: {
      tags: ['Notifications'],
      summary: 'Mark Notification As Read',
      description: 'Marks a specific notification as read.',
      security: [{ bearerAuth: [] }, { csrfAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Notification marked read' },
        404: { description: 'Not found' }
      }
    }
  },
  '/api/v1/notifications/preferences': {
    get: {
      tags: ['Notifications'],
      summary: 'Get Notification Preferences',
      description: 'Returns the user\'s explicit notification preferences.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'User preferences' }
      }
    },
    patch: {
      tags: ['Notifications'],
      summary: 'Update Notification Preference',
      description: 'Enable or disable a specific notification channel and type combination.',
      security: [{ bearerAuth: [] }, { csrfAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['category', 'channel', 'isEnabled'],
              properties: {
                category: { type: 'string' },
                type: { type: 'string' },
                channel: { type: 'string' },
                isEnabled: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Preference updated' }
      }
    }
  }
};
