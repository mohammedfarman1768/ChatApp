import { z } from 'zod';

export const SendGroupMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(4000, 'Message is too long'),
  replyToMessageId: z.string().uuid('Invalid reply message ID').optional(),
});

export const EditGroupMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(4000, 'Message is too long'),
});

export const DeleteGroupMessageSchema = z.object({
  deleteForEveryone: z.boolean().default(false),
});

export const GroupMessageReactionSchema = z.object({
  emoji: z.string().min(1).max(10, 'Invalid emoji length'),
});

export const GroupMessagePaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export const PinMessageSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
});

export const AnnouncementSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
});
