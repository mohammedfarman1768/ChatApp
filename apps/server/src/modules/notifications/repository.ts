import { prisma } from '../../prisma/client.js';
import { CreateNotificationDTO } from './types.js';
import { NotificationCategory, NotificationChannel, NotificationPriority } from '@prisma/client';
import { NotificationPaginationData } from '@repo/shared-validation';

export const notificationRepository = {
  async createNotification(data: CreateNotificationDTO) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId,
        category: data.category as NotificationCategory,
        type: data.type,
        priority: (data.priority || 'NORMAL') as NotificationPriority,
        title: data.title,
        body: data.body,
        actionUrl: data.actionUrl,
        entityId: data.entityId,
        entityType: data.entityType,
        metadata: data.metadata || {},
        expiresAt: data.expiresAt
      }
    });
  },

  async createDelivery(notificationId: string, channel: NotificationChannel) {
    return prisma.notificationDelivery.create({
      data: {
        notificationId,
        channel
      }
    });
  },

  async getUserPreferences(userId: string) {
    return prisma.notificationPreference.findMany({
      where: { userId }
    });
  },

  async upsertPreference(userId: string, category: NotificationCategory, channel: NotificationChannel, type: string | null, isEnabled: boolean) {
    const existing = await prisma.notificationPreference.findFirst({
      where: { userId, category, channel, type }
    });

    if (existing) {
      return prisma.notificationPreference.update({
        where: { id: existing.id },
        data: { isEnabled }
      });
    }

    return prisma.notificationPreference.create({
      data: {
        userId,
        category,
        type,
        channel,
        isEnabled
      }
    });
  },

  async getNotifications(userId: string, pagination: NotificationPaginationData) {
    const { cursor, limit, includeRead } = pagination;
    const where: any = {
      userId,
      deletedAt: null
    };

    if (!includeRead) {
      where.isRead = false;
    }

    const items = await prisma.notification.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    let nextCursor: string | undefined = undefined;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id;
    }

    return { items, nextCursor };
  },

  async getNotificationById(id: string) {
    return prisma.notification.findUnique({
      where: { id, deletedAt: null }
    });
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false, deletedAt: null }
    });
  },

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId, deletedAt: null },
      data: { isRead: true }
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false, deletedAt: null },
      data: { isRead: true }
    });
  },

  async deleteNotification(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  },

  async deleteAllNotifications(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  },

  async cleanupExpiredNotifications() {
    return prisma.notification.updateMany({
      where: { 
        deletedAt: null,
        expiresAt: { lt: new Date() } 
      },
      data: { deletedAt: new Date() }
    });
  }
};
