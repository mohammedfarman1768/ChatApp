import { z } from 'zod';

export const CreateGroupCallSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  hasAudio: z.boolean().optional().default(true),
  hasVideo: z.boolean().optional().default(false),
  deviceInfo: z.string().max(255).optional(),
});
export type CreateGroupCallInput = z.infer<typeof CreateGroupCallSchema>;

export const GroupCallActionSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  callId: z.string().uuid('Invalid call ID'),
});
export type GroupCallActionInput = z.infer<typeof GroupCallActionSchema>;

export const GroupCallJoinSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  callId: z.string().uuid('Invalid call ID'),
  hasAudio: z.boolean().optional().default(true),
  hasVideo: z.boolean().optional().default(false),
  deviceInfo: z.string().max(255).optional(),
});
export type GroupCallJoinInput = z.infer<typeof GroupCallJoinSchema>;

export const GroupCallSignalSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  callId: z.string().uuid('Invalid call ID'),
  type: z.string().min(1).max(50),
  payload: z.record(z.any()),
});
export type GroupCallSignalInput = z.infer<typeof GroupCallSignalSchema>;

export const GroupCallPaginationSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});
export type GroupCallPaginationInput = z.infer<typeof GroupCallPaginationSchema>;
