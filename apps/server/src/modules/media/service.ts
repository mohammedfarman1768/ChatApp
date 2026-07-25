import { MediaType } from '@prisma/client';
import { mediaRepository } from './repository.js';
import { storage } from './storage.js';
import { eventEmitter } from '../../events/emitter.js';
import { 
  MediaError, 
  ICreateUploadSession, 
  ICompleteUploadSession, 
  IUpdateMediaMetadata, 
  IMediaPagination 
} from './types.js';
import crypto from 'crypto';

// 10MB Images/Audio/Documents, 50MB Videos
const LIMITS = {
  IMAGE: 10 * 1024 * 1024,
  VIDEO: 50 * 1024 * 1024,
  AUDIO: 10 * 1024 * 1024,
  DOCUMENT: 10 * 1024 * 1024,
  OTHER: 5 * 1024 * 1024,
};

function getFileType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  if (
    mimeType.includes('pdf') || 
    mimeType.includes('msword') || 
    mimeType.includes('officedocument') || 
    mimeType.includes('text/')
  ) return 'DOCUMENT';
  return 'OTHER';
}

export const mediaService = {
  async createUploadSession(data: ICreateUploadSession) {
    const fileType = getFileType(data.mimeType);
    const limit = LIMITS[fileType];

    if (data.sizeBytes > limit) {
      throw new MediaError(413, `File exceeds size limit of ${limit / (1024 * 1024)}MB for ${fileType}`);
    }

    const storageKey = storage.generateStorageKey(data.ownerId, data.originalName);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const session = await mediaRepository.createUploadSession({
      ownerId: data.ownerId,
      fileName: data.originalName,
      storageKey,
      mimeType: data.mimeType,
      fileType,
      sizeBytes: data.sizeBytes,
      expiresAt,
    });

    const uploadUrl = await storage.generatePresignedUploadUrl(storageKey, data.mimeType, data.sizeBytes);

    eventEmitter.emitEvent('FILE_UPLOAD_REQUESTED', {
      eventId: crypto.randomUUID(),
      eventType: 'FILE_UPLOAD_REQUESTED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'media-module',
      correlationId: session.id,
      payload: {
        sessionId: session.id,
        ownerId: data.ownerId,
        originalName: data.originalName,
        sizeBytes: data.sizeBytes
      }
    });

    return { session, uploadUrl };
  },

  async completeUpload(data: ICompleteUploadSession) {
    const session = await mediaRepository.getUploadSession(data.sessionId);
    if (!session) throw new MediaError(404, 'Upload session not found');
    if (session.ownerId !== data.ownerId) throw new MediaError(403, 'Not authorized');
    if (session.status !== 'PENDING') throw new MediaError(400, 'Session is not pending');
    if (session.expiresAt < new Date()) {
      await mediaRepository.markUploadSessionFailed(session.id);
      throw new MediaError(400, 'Upload session expired');
    }

    await mediaRepository.markUploadSessionCompleted(session.id);

    const file = await mediaRepository.createMediaFile({
      ownerId: session.ownerId,
      originalName: session.fileName,
      storageKey: session.storageKey,
      mimeType: session.mimeType,
      fileType: session.fileType,
      sizeBytes: session.sizeBytes,
    });

    eventEmitter.emitEvent('FILE_UPLOADED', {
      eventId: crypto.randomUUID(),
      eventType: 'FILE_UPLOADED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'media-module',
      correlationId: file.id,
      payload: {
        fileId: file.id,
        ownerId: file.ownerId,
        storageKey: file.storageKey,
        sizeBytes: file.sizeBytes,
        mimeType: file.mimeType,
        fileType: file.fileType
      }
    });

    return file;
  },

  async abortUpload(ownerId: string, sessionId: string) {
    const session = await mediaRepository.getUploadSession(sessionId);
    if (!session) throw new MediaError(404, 'Upload session not found');
    if (session.ownerId !== ownerId) throw new MediaError(403, 'Not authorized');
    
    await mediaRepository.markUploadSessionFailed(session.id);

    eventEmitter.emitEvent('FILE_UPLOAD_FAILED', {
      eventId: crypto.randomUUID(),
      eventType: 'FILE_UPLOAD_FAILED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'media-module',
      correlationId: session.id,
      payload: {
        sessionId: session.id,
        ownerId,
        reason: 'aborted_by_user'
      }
    });
  },

  async getFile(ownerId: string, fileId: string) {
    const file = await mediaRepository.getMediaFile(fileId);
    if (!file || file.deletedAt) throw new MediaError(404, 'File not found');
    if (file.ownerId !== ownerId) throw new MediaError(403, 'Not authorized');
    return file;
  },

  async getFiles(ownerId: string, pagination: IMediaPagination) {
    return mediaRepository.getFilesByOwner(ownerId, pagination);
  },

  async updateMetadata(ownerId: string, fileId: string, data: IUpdateMediaMetadata) {
    const file = await this.getFile(ownerId, fileId);
    
    const updated = await mediaRepository.updateMediaMetadata(file.id, data);

    eventEmitter.emitEvent('FILE_METADATA_UPDATED', {
      eventId: crypto.randomUUID(),
      eventType: 'FILE_METADATA_UPDATED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'media-module',
      correlationId: file.id,
      payload: {
        fileId: file.id,
        ownerId: file.ownerId
      }
    });

    return updated;
  },

  async deleteFile(ownerId: string, fileId: string) {
    const file = await this.getFile(ownerId, fileId);
    
    await storage.deleteObject(file.storageKey);
    await mediaRepository.deleteMediaFile(file.id);

    eventEmitter.emitEvent('FILE_DELETED', {
      eventId: crypto.randomUUID(),
      eventType: 'FILE_DELETED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'media-module',
      correlationId: file.id,
      payload: {
        fileId: file.id,
        ownerId: file.ownerId,
        storageKey: file.storageKey
      }
    });
  },

  async getFileAccessUrl(ownerId: string, fileId: string) {
    const file = await this.getFile(ownerId, fileId);
    return storage.generatePresignedDownloadUrl(file.storageKey);
  },

  async getFileDownloadUrl(ownerId: string, fileId: string) {
    const file = await this.getFile(ownerId, fileId);
    return storage.generatePresignedDownloadUrl(file.storageKey, file.originalName);
  }
};
