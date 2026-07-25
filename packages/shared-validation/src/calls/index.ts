import { z } from 'zod';

export const CreateCallSchema = z.object({
  calleeId: z.string().uuid('Invalid callee ID'),
  hasAudio: z.boolean().optional().default(true),
  hasVideo: z.boolean().optional().default(false),
  deviceInfo: z.string().max(255).optional(),
});

export type CreateCallInput = z.infer<typeof CreateCallSchema>;

// Use this for /calls/:callId/:action (accept, reject, cancel, end)
export const CallActionSchema = z.object({
  callId: z.string().uuid('Invalid call ID'),
});

export type CallActionInput = z.infer<typeof CallActionSchema>;

export const CallSignalSchema = z.object({
  callId: z.string().uuid('Invalid call ID'),
  type: z.string().min(1).max(50),
  payload: z.record(z.any()),
});

export type CallSignalInput = z.infer<typeof CallSignalSchema>;

export const CallPaginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CallPaginationInput = z.infer<typeof CallPaginationSchema>;
