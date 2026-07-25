export const callsSwagger = {
  paths: {
    '/calls': {
      post: {
        summary: 'Initiate a new 1-to-1 call',
        tags: ['Calls'],
        security: [{ cookieAuth: [] }, { csrfAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['calleeId'],
                properties: {
                  calleeId: { type: 'string', format: 'uuid' },
                  hasAudio: { type: 'boolean', default: true },
                  hasVideo: { type: 'boolean', default: false },
                  deviceInfo: { type: 'string' },
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Call initiated (RINGING)' }
        }
      },
      get: {
        summary: 'Get recent calls',
        tags: ['Calls'],
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'cursor', in: 'query', schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Recent calls list' }
        }
      }
    },
    '/calls/{callId}': {
      get: {
        summary: 'Get call details',
        tags: ['Calls'],
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'callId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Call details' }
        }
      }
    },
    '/calls/{callId}/accept': {
      post: {
        summary: 'Accept an incoming call',
        tags: ['Calls'],
        security: [{ cookieAuth: [] }, { csrfAuth: [] }],
        parameters: [
          { name: 'callId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Call accepted' }
        }
      }
    },
    '/calls/{callId}/reject': {
      post: {
        summary: 'Reject an incoming call',
        tags: ['Calls'],
        security: [{ cookieAuth: [] }, { csrfAuth: [] }],
        parameters: [
          { name: 'callId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Call rejected' }
        }
      }
    },
    '/calls/{callId}/cancel': {
      post: {
        summary: 'Cancel an outgoing ringing call',
        tags: ['Calls'],
        security: [{ cookieAuth: [] }, { csrfAuth: [] }],
        parameters: [
          { name: 'callId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Call cancelled' }
        }
      }
    },
    '/calls/{callId}/end': {
      post: {
        summary: 'End an ongoing call',
        tags: ['Calls'],
        security: [{ cookieAuth: [] }, { csrfAuth: [] }],
        parameters: [
          { name: 'callId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Call ended' }
        }
      }
    },
    '/calls/{callId}/signals': {
      post: {
        summary: 'Persist call signal metadata (Optional)',
        tags: ['Calls'],
        security: [{ cookieAuth: [] }, { csrfAuth: [] }],
        parameters: [
          { name: 'callId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'payload'],
                properties: {
                  type: { type: 'string' },
                  payload: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Signal persisted' }
        }
      }
    }
  }
};
