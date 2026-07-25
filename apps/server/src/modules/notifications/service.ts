import { notificationRepository } from './repository.js';
import { CreateNotificationDTO, NotificationError } from './types.js';
import { eventEmitter } from '../../events/emitter.js';
import { NotificationCategory, NotificationChannel, NotificationPreference } from '@prisma/client';
import { NotificationPaginationData, UpdateNotificationPreferenceData } from '@repo/shared-validation';

export const notificationService = {
  async processEvent(data: CreateNotificationDTO) {
    // 1. Fetch user preferences
    const preferences = await notificationRepository.getUserPreferences(data.userId);

    // 2. Check if IN_APP is disabled for this category/type
    const inAppPref = this.resolvePreference(preferences, data.category as NotificationCategory, data.type, 'IN_APP');
    
    let notificationId: string | null = null;
    
    // 3. Create Notification if IN_APP is enabled (default is true)
    if (inAppPref) {
      const notification = await notificationRepository.createNotification(data);
      notificationId = notification.id;
      
      // Emit real-time socket event
      eventEmitter.emitEvent('NOTIFICATION_CREATED', {
        eventId: crypto.randomUUID(),
        eventType: 'NOTIFICATION_CREATED',
        timestamp: new Date().toISOString(),
        version: 1,
        source: 'notifications-module',
        correlationId: crypto.randomUUID(),
        payload: {
          notificationId: notification.id,
          userId: data.userId,
          category: data.category,
          type: data.type
        }
      });
    }

    // 4. Model EMAIL delivery (but don't send)
    const emailPref = this.resolvePreference(preferences, data.category as NotificationCategory, data.type, 'EMAIL');
    if (emailPref && notificationId) {
      await notificationRepository.createDelivery(notificationId, 'EMAIL');
      // In future: queue email worker job
    }

    // 5. Model PUSH delivery (but don't send)
    const pushPref = this.resolvePreference(preferences, data.category as NotificationCategory, data.type, 'PUSH');
    if (pushPref && notificationId) {
      await notificationRepository.createDelivery(notificationId, 'PUSH');
      // In future: queue push worker job
    }
  },

  resolvePreference(preferences: NotificationPreference[], category: NotificationCategory, type: string, channel: NotificationChannel): boolean {
    // 1. Check specific type + channel
    const specificPref = preferences.find(p => p.type === type && p.channel === channel);
    if (specificPref) return specificPref.isEnabled;

    // 2. Check category + channel fallback
    const categoryPref = preferences.find(p => p.category === category && p.type === null && p.channel === channel);
    if (categoryPref) return categoryPref.isEnabled;

    // Default is always enabled
    return true;
  },

  async getNotifications(userId: string, pagination: NotificationPaginationData) {
    return notificationRepository.getNotifications(userId, pagination);
  },

  async getNotificationById(id: string, userId: string) {
    const notification = await notificationRepository.getNotificationById(id);
    if (!notification || notification.userId !== userId) {
      throw new NotificationError('Notification not found', 404);
    }
    return notification;
  },

  async getUnreadCount(userId: string) {
    return notificationRepository.getUnreadCount(userId);
  },

  async markAsRead(id: string, userId: string) {
    const res = await notificationRepository.markAsRead(id, userId);
    if (res.count === 0) {
      throw new NotificationError('Notification not found or already read', 404);
    }
    
    eventEmitter.emitEvent('NOTIFICATION_READ', {
      eventId: crypto.randomUUID(),
      eventType: 'NOTIFICATION_READ',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'notifications-module',
      correlationId: crypto.randomUUID(),
      payload: {
        notificationId: id,
        userId
      }
    });
  },

  async markAllAsRead(userId: string) {
    await notificationRepository.markAllAsRead(userId);
  },

  async deleteNotification(id: string, userId: string) {
    const res = await notificationRepository.deleteNotification(id, userId);
    if (res.count === 0) {
      throw new NotificationError('Notification not found', 404);
    }

    eventEmitter.emitEvent('NOTIFICATION_DELETED', {
      eventId: crypto.randomUUID(),
      eventType: 'NOTIFICATION_DELETED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'notifications-module',
      correlationId: crypto.randomUUID(),
      payload: {
        notificationId: id,
        userId
      }
    });
  },

  async deleteAllNotifications(userId: string) {
    await notificationRepository.deleteAllNotifications(userId);
  },

  async getUserPreferences(userId: string) {
    return notificationRepository.getUserPreferences(userId);
  },

  async updatePreference(userId: string, data: UpdateNotificationPreferenceData) {
    const updated = await notificationRepository.upsertPreference(
      userId,
      data.category as NotificationCategory,
      data.channel as NotificationChannel,
      data.type || null,
      data.isEnabled
    );

    eventEmitter.emitEvent('NOTIFICATION_PREFERENCE_UPDATED', {
      eventId: crypto.randomUUID(),
      eventType: 'NOTIFICATION_PREFERENCE_UPDATED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'notifications-module',
      correlationId: crypto.randomUUID(),
      payload: {
        userId,
        category: updated.category,
        channel: updated.channel,
        isEnabled: updated.isEnabled
      }
    });

    return updated;
  },

  async cleanupExpiredNotifications() {
    // This can be triggered by a cron job periodically
    return notificationRepository.cleanupExpiredNotifications();
  }
};
