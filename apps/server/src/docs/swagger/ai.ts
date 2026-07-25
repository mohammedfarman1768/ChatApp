export const aiSwaggerPaths = {
  '/ai/capabilities': {
    get: {
      summary: 'Get AI Capabilities',
      tags: ['AI'],
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: 'Returns available AI features' },
      },
    },
  },
  '/ai/usage': {
    get: {
      summary: 'Get AI Usage Logs',
      tags: ['AI'],
      security: [{ cookieAuth: [] }],
      parameters: [
        { name: 'cursor', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'limit', in: 'query', required: false, schema: { type: 'number' } }
      ],
      responses: {
        200: { description: 'Paginated AI usage logs' },
        401: { description: 'Unauthorized' }
      },
    },
  },
  '/ai/preferences': {
    get: {
      summary: 'Get AI Preferences',
      tags: ['AI'],
      security: [{ cookieAuth: [] }],
      responses: {
        200: { description: 'User AI preferences' },
        401: { description: 'Unauthorized' }
      },
    },
    patch: {
      summary: 'Update AI Preferences',
      tags: ['AI'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                aiEnabled: { type: 'boolean' },
                allowSummaries: { type: 'boolean' },
                allowSmartReply: { type: 'boolean' },
                allowRewrite: { type: 'boolean' },
                allowTranslate: { type: 'boolean' },
                allowModeration: { type: 'boolean' },
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Updated preferences' },
        401: { description: 'Unauthorized' }
      },
    }
  },
  '/ai/summaries': {
    post: {
      summary: 'Generate Conversation Summary',
      tags: ['AI'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                targetId: { type: 'string' },
                targetType: { type: 'string', enum: ['GROUP', 'CONVERSATION'] }
              },
              required: ['targetId', 'targetType']
            }
          }
        }
      },
      responses: {
        200: { description: 'Summary result' },
        400: { description: 'Bad request or not enough context' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (feature disabled)' },
        429: { description: 'Too many requests' },
        503: { description: 'Provider unavailable' },
      }
    }
  },
  '/ai/smart-replies': {
    post: {
      summary: 'Generate Smart Replies',
      tags: ['AI'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                targetId: { type: 'string' },
                targetType: { type: 'string', enum: ['GROUP', 'CONVERSATION'] }
              },
              required: ['targetId', 'targetType']
            }
          }
        }
      },
      responses: {
        200: { description: 'Array of replies' },
        429: { description: 'Too many requests' },
        503: { description: 'Provider unavailable' },
      }
    }
  },
  '/ai/rewrite': {
    post: {
      summary: 'Rewrite Message',
      tags: ['AI'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                tone: { type: 'string', enum: ['Professional', 'Casual', 'Friendly', 'Shorter', 'Longer'] }
              },
              required: ['text', 'tone']
            }
          }
        }
      },
      responses: {
        200: { description: 'Rewritten text' },
        429: { description: 'Too many requests' },
        503: { description: 'Provider unavailable' },
      }
    }
  },
  '/ai/translate': {
    post: {
      summary: 'Translate Message',
      tags: ['AI'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                targetLanguage: { type: 'string' }
              },
              required: ['text', 'targetLanguage']
            }
          }
        }
      },
      responses: {
        200: { description: 'Translated text' },
        429: { description: 'Too many requests' },
        503: { description: 'Provider unavailable' },
      }
    }
  },
  '/ai/grammar': {
    post: {
      summary: 'Fix Grammar',
      tags: ['AI'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                text: { type: 'string' }
              },
              required: ['text']
            }
          }
        }
      },
      responses: {
        200: { description: 'Corrected text' },
        429: { description: 'Too many requests' },
        503: { description: 'Provider unavailable' },
      }
    }
  },
  '/ai/moderation': {
    post: {
      summary: 'Run Moderation',
      tags: ['AI'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                text: { type: 'string' }
              },
              required: ['text']
            }
          }
        }
      },
      responses: {
        200: { description: 'Moderation assessment' },
        429: { description: 'Too many requests' },
        503: { description: 'Provider unavailable' },
      }
    }
  },
  '/ai/group-description': {
    post: {
      summary: 'Generate Group Description',
      tags: ['AI'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                purpose: { type: 'string' }
              },
              required: ['name', 'purpose']
            }
          }
        }
      },
      responses: {
        200: { description: 'Generated description' },
        429: { description: 'Too many requests' },
        503: { description: 'Provider unavailable' },
      }
    }
  },
  '/ai/group-rules': {
    post: {
      summary: 'Generate Group Rules',
      tags: ['AI'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                purpose: { type: 'string' }
              },
              required: ['name', 'purpose']
            }
          }
        }
      },
      responses: {
        200: { description: 'Generated rules array' },
        429: { description: 'Too many requests' },
        503: { description: 'Provider unavailable' },
      }
    }
  }
};
