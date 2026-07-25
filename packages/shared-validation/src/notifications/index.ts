import { z } from 'zod';

export const UpdateNotificationPreferenceSchema = z.object({
  category: z.enum(['SYSTEM', 'SOCIAL', 'CHAT', 'GROUP', 'SECURITY', 'MEDIA']),
  type: z.string().nullable().optional(),
  channel: z.enum(['IN_APP', 'EMAIL', 'PUSH']),
  isEnabled: z.boolean()
});

export type UpdateNotificationPreferenceData = z.infer<typeof UpdateNotificationPreferenceSchema>;

export const NotificationPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  includeRead: z.coerce.boolean().default(true)
});

export type NotificationPaginationData = z.infer<typeof NotificationPaginationSchema>;

export const ReadNotificationsSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1)
});

export type ReadNotificationsData = z.infer<typeof ReadNotificationsSchema>;
