export const groupCallsSwagger = {
  '/api/v1/groups/{groupId}/calls': {
    post: {
      tags: ['Group Calls'],
      summary: 'Initiate a group call',
      description: 'Starts a new group call session. Requires group membership, group calls must be enabled via allowGroupCalls setting. Only one active call per group is allowed at a time. The call starts in RINGING state and will automatically expire after 60 seconds if unanswered.',
      security: [{ cookieAuth: [] }, { csrfAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                hasAudio: { type: 'boolean', default: true },
                hasVideo: { type: 'boolean', default: false },
                deviceInfo: { type: 'string', maxLength: 255 }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Call initiated successfully' },
        400: { description: 'Bad request' },
        403: { description: 'Forbidden (Not a member, banned, or group calls disabled)' },
        409: { description: 'An active call already exists in this group' }
      }
    },
    get: {
      tags: ['Group Calls'],
      summary: 'Get recent group calls (paginated)',
      description: 'Returns a paginated list of past group calls. Requires group membership.',
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 }
        },
        {
          name: 'cursor',
          in: 'query',
          description: 'UUID of the last call from a previous page',
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  calls: { type: 'array', items: { type: 'object' } },
                  nextCursor: { type: 'string', format: 'uuid', nullable: true }
                }
              }
            }
          }
        },
        403: { description: 'Forbidden (Not a member)' }
      }
    }
  },
  '/api/v1/groups/{groupId}/calls/current': {
    get: {
      tags: ['Group Calls'],
      summary: 'Get active group call',
      description: 'Returns the currently active call for the group, or null if none exists.',
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      responses: {
        200: { description: 'Active call or null' },
        403: { description: 'Forbidden (Not a member)' }
      }
    }
  },
  '/api/v1/groups/{groupId}/calls/{callId}': {
    get: {
      tags: ['Group Calls'],
      summary: 'Get group call details',
      description: 'Returns detailed information about a specific group call. Requires membership and must not be banned.',
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        },
        {
          name: 'callId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      responses: {
        200: { description: 'Success' },
        403: { description: 'Forbidden (Not a member or banned)' },
        404: { description: 'Call not found' }
      }
    }
  },
  '/api/v1/groups/{groupId}/calls/{callId}/join': {
    post: {
      tags: ['Group Calls'],
      summary: 'Join a group call',
      description: 'Join an active or ringing group call. Backend enforces a maximum of 25 participants. Idempotent if already joined.',
      security: [{ cookieAuth: [] }, { csrfAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        },
        {
          name: 'callId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                hasAudio: { type: 'boolean', default: true },
                hasVideo: { type: 'boolean', default: false },
                deviceInfo: { type: 'string', maxLength: 255 }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Joined successfully' },
        400: { description: 'Call is not active or ringing' },
        403: { description: 'Forbidden (Not a member, banned, or participant limit of 25 reached)' },
        404: { description: 'Call not found' }
      }
    }
  },
  '/api/v1/groups/{groupId}/calls/{callId}/leave': {
    post: {
      tags: ['Group Calls'],
      summary: 'Leave a group call',
      description: 'Leave a group call. Idempotent. If the last participant leaves, the call is automatically marked ENDED.',
      security: [{ cookieAuth: [] }, { csrfAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        },
        {
          name: 'callId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      responses: {
        200: { description: 'Left call successfully' }
      }
    }
  },
  '/api/v1/groups/{groupId}/calls/{callId}/end': {
    post: {
      tags: ['Group Calls'],
      summary: 'End a group call',
      description: 'Forcibly end an active group call. Restricted to the call creator, group admins, owners, or moderators. Computes durationSeconds and records endedAt.',
      security: [{ cookieAuth: [] }, { csrfAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        },
        {
          name: 'callId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      responses: {
        200: { description: 'Call ended' },
        403: { description: 'Forbidden — must be call creator, admin, owner, or moderator' },
        404: { description: 'Call not found' }
      }
    }
  },
  '/api/v1/groups/{groupId}/calls/{callId}/cancel': {
    post: {
      tags: ['Group Calls'],
      summary: 'Cancel a ringing group call',
      description: 'Cancel a call still in RINGING state. Only the creator, admins, owners, or moderators can cancel. Transitions: RINGING -> CANCELLED.',
      security: [{ cookieAuth: [] }, { csrfAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        },
        {
          name: 'callId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      responses: {
        200: { description: 'Cancelled' },
        400: { description: 'Call is no longer in RINGING state' },
        403: { description: 'Forbidden — not authorized' }
      }
    }
  },
  '/api/v1/groups/{groupId}/calls/{callId}/signals': {
    post: {
      tags: ['Group Calls'],
      summary: 'Persist WebRTC signal (optional)',
      description: 'Persists a WebRTC signal for debugging. Only active call participants can persist signals. Prefer ephemeral Socket.IO for ICE candidates to avoid DB bloat.',
      security: [{ cookieAuth: [] }, { csrfAuth: [] }],
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        },
        {
          name: 'callId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'payload'],
              properties: {
                type: { type: 'string', minLength: 1, maxLength: 50 },
                payload: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Signal persisted' },
        403: { description: 'Forbidden — not an active participant in this call' },
        404: { description: 'Call not found' }
      }
    }
  }
};
