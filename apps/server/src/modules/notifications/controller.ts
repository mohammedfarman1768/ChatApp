import { Request, Response, NextFunction } from 'express';
import { notificationService } from './service.js';
import { NotificationError } from './types.js';
import { NotificationPaginationData, UpdateNotificationPreferenceData } from '@repo/shared-validation';

export const notificationController = {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const pagination: NotificationPaginationData = {
        cursor: req.query.cursor as string | undefined,
        limit: parseInt(req.query.limit as string) || 50,
        includeRead: req.query.includeRead !== 'false'
      };

      const result = await notificationService.getNotifications(userId, pagination);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async getNotificationById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const { id } = req.params;
      const result = await notificationService.getNotificationById(id, userId);
      res.status(200).json({ data: result });
    } catch (error) {
      if (error instanceof NotificationError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const count = await notificationService.getUnreadCount(userId);
      res.status(200).json({ data: { count } });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const { id } = req.params;
      await notificationService.markAsRead(id, userId);
      res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof NotificationError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      await notificationService.markAllAsRead(userId);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const { id } = req.params;
      await notificationService.deleteNotification(id, userId);
      res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof NotificationError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async deleteAllNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      await notificationService.deleteAllNotifications(userId);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const preferences = await notificationService.getUserPreferences(userId);
      res.status(200).json({ data: preferences });
    } catch (error) {
      next(error);
    }
  },

  async updatePreference(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const data = req.body as UpdateNotificationPreferenceData;
      const result = await notificationService.updatePreference(userId, data);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
};
