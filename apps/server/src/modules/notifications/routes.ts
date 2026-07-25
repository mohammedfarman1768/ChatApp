import { Router } from 'express';
import { notificationController } from './controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { csrfMiddleware } from '../../middleware/csrf.js';
import { apiRateLimiter } from '../../middleware/rateLimiter.js';
import { validateData } from '../../middleware/validation.js';
import { 
  UpdateNotificationPreferenceSchema, 
  NotificationPaginationSchema 
} from '@repo/shared-validation';

const router = Router();

// All notification routes require authentication and rate limiting
router.use(requireAuth);
router.use(apiRateLimiter);

// Preferences
router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', csrfMiddleware, validateData(UpdateNotificationPreferenceSchema), notificationController.updatePreference);

// Unread operations
router.get('/unread', notificationController.getUnreadCount);
router.patch('/read-all', csrfMiddleware, notificationController.markAllAsRead);

// Standard CRUD / listing
router.get('/', validateData(NotificationPaginationSchema, 'query'), notificationController.getNotifications);
router.delete('/', csrfMiddleware, notificationController.deleteAllNotifications);

// Individual notification operations
router.get('/:id', notificationController.getNotificationById);
router.patch('/:id/read', csrfMiddleware, notificationController.markAsRead);
router.delete('/:id', csrfMiddleware, notificationController.deleteNotification);

export { router as notificationsRouter };
