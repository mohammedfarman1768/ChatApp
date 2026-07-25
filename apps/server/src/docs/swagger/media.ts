export const mediaSwagger = {
  '/api/v1/media/uploads': {
    post: {
      tags: ['Media'],
      summary: 'Create Upload Session',
      description: 'Initiates a new media upload session and returns a presigned URL',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['originalName', 'mimeType', 'sizeBytes'],
              properties: {
                originalName: { type: 'string' },
                mimeType: { type: 'string' },
                sizeBytes: { type: 'number' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Upload session created with presigned URL' },
        400: { description: 'Validation failed' },
        401: { description: 'Unauthorized' },
        413: { description: 'Payload too large (exceeds type limit)' }
      }
    }
  },
  '/api/v1/media/uploads/complete': {
    post: {
      tags: ['Media'],
      summary: 'Complete Upload',
      description: 'Marks an upload session as complete after the client successfully uploads to the presigned URL',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['sessionId'],
              properties: {
                sessionId: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Upload completed, media file created' },
        400: { description: 'Session expired or not pending' },
        403: { description: 'Forbidden' },
        404: { description: 'Session not found' }
      }
    }
  },
  '/api/v1/media/uploads/abort': {
    post: {
      tags: ['Media'],
      summary: 'Abort Upload',
      description: 'Cancels a pending upload session',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['sessionId'],
              properties: {
                sessionId: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Upload aborted' }
      }
    }
  },
  '/api/v1/media/files': {
    get: {
      tags: ['Media'],
      summary: 'List Media Files',
      description: 'Retrieves a paginated list of media files owned by the user',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'cursor', in: 'query', schema: { type: 'string' }, description: 'Pagination cursor' },
        { name: 'limit', in: 'query', schema: { type: 'number', default: 50 }, description: 'Results limit' }
      ],
      responses: {
        200: { description: 'List of media files' }
      }
    }
  },
  '/api/v1/media/files/{fileId}': {
    get: {
      tags: ['Media'],
      summary: 'Get Media File Details',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'fileId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Media file details' }
      }
    },
    delete: {
      tags: ['Media'],
      summary: 'Delete Media File',
      description: 'Soft deletes the file metadata and hard deletes the object from R2',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'fileId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Media file deleted' }
      }
    }
  },
  '/api/v1/media/files/{fileId}/url': {
    get: {
      tags: ['Media'],
      summary: 'Get Presigned Access URL',
      description: 'Returns a short-lived presigned URL to view the media file',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'fileId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Presigned URL generated' }
      }
    }
  }
};
