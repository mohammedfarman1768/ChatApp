import { z } from 'zod';

export const ChatPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const ConversationSchema = z.object({
  participantId: z.string().uuid('Invalid user ID'),
});

export const SendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  messageType: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'FILE', 'AUDIO', 'SYSTEM']).default('TEXT'),
});

export const EditMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
});

export const DeleteMessageSchema = z.object({
  deleteForEveryone: z.boolean().default(false),
});

export const ReactionSchema = z.object({
  emoji: z.string().min(1).max(10), // Emojis can be a few characters due to modifiers, but we keep it reasonable
});

export type ChatPaginationParams = z.infer<typeof ChatPaginationSchema>;
export type CreateConversationDto = z.infer<typeof ConversationSchema>;
export type SendMessageDto = z.infer<typeof SendMessageSchema>;
export type EditMessageDto = z.infer<typeof EditMessageSchema>;
export type DeleteMessageDto = z.infer<typeof DeleteMessageSchema>;
export type ReactionDto = z.infer<typeof ReactionSchema>;
