import { PrismaClient, MediaType, UploadStatus } from '@prisma/client';
import { IMediaPagination } from './types.js';

const prisma = new PrismaClient();

export const mediaRepository = {
  async createUploadSession(data: { ownerId: string; fileName: string; storageKey: string; mimeType: string; fileType: MediaType; sizeBytes: number; expiresAt: Date }) {
    return prisma.mediaUploadSession.create({
      data: {
        ...data,
        status: UploadStatus.PENDING
      }
    });
  },

  async getUploadSession(sessionId: string) {
    return prisma.mediaUploadSession.findUnique({
      where: { id: sessionId }
    });
  },

  async markUploadSessionCompleted(sessionId: string) {
    return prisma.mediaUploadSession.update({
      where: { id: sessionId },
      data: {
        status: UploadStatus.COMPLETED,
        completedAt: new Date()
      }
    });
  },

  async markUploadSessionFailed(sessionId: string) {
    return prisma.mediaUploadSession.update({
      where: { id: sessionId },
      data: {
        status: UploadStatus.FAILED
      }
    });
  },

  async createMediaFile(data: { ownerId: string; originalName: string; storageKey: string; mimeType: string; fileType: MediaType; sizeBytes: number }) {
    return prisma.mediaFile.create({
      data
    });
  },

  async getMediaFile(fileId: string) {
    return prisma.mediaFile.findUnique({
      where: { id: fileId }
    });
  },

  async getFilesByOwner(ownerId: string, pagination: IMediaPagination) {
    const limit = pagination.limit;
    const cursor = pagination.cursor ? { id: pagination.cursor } : undefined;

    const files = await prisma.mediaFile.findMany({
      where: { ownerId, deletedAt: null },
      take: limit + 1,
      cursor,
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | undefined = undefined;
    if (files.length > limit) {
      const nextItem = files.pop();
      nextCursor = nextItem?.id;
    }

    return {
      files,
      nextCursor
    };
  },

  async updateMediaMetadata(fileId: string, data: { originalName?: string; altText?: string | null }) {
    return prisma.mediaFile.update({
      where: { id: fileId },
      data
    });
  },

  async deleteMediaFile(fileId: string) {
    return prisma.mediaFile.update({
      where: { id: fileId },
      data: {
        deletedAt: new Date(),
        storageUrl: null // invalidate immediately if it was stored
      }
    });
  }
};
