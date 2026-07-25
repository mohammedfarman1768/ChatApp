import { z } from 'zod';

export const CreateUploadSessionSchema = z.object({
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

export type CreateUploadSessionData = z.infer<typeof CreateUploadSessionSchema>;

export const CompleteUploadSchema = z.object({
  sessionId: z.string().uuid(),
});

export type CompleteUploadData = z.infer<typeof CompleteUploadSchema>;

export const AbortUploadSchema = z.object({
  sessionId: z.string().uuid(),
});

export type AbortUploadData = z.infer<typeof AbortUploadSchema>;

export const UpdateMediaMetadataSchema = z.object({
  originalName: z.string().min(1).max(255).optional(),
  altText: z.string().max(1024).nullable().optional(),
});

export type UpdateMediaMetadataData = z.infer<typeof UpdateMediaMetadataSchema>;

export const MediaPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export type MediaPaginationData = z.infer<typeof MediaPaginationSchema>;
