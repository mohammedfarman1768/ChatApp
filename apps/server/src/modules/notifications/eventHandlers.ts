import { eventEmitter } from '../../events/emitter.js';
import { notificationService } from './service.js';

export const registerNotificationEventHandlers = () => {
  // Listen to DM Messages
  eventEmitter.onEvent('MESSAGE_SENT', async (event) => {
    try {
      const payload = event.payload as any;
      await notificationService.processEvent({
        userId: payload.receiverId,
        actorId: payload.senderId,
        category: 'CHAT',
        type: 'MESSAGE_SENT',
        priority: 'HIGH',
        title: 'New Direct Message',
        body: 'You have received a new direct message.',
        entityId: payload.messageId,
        entityType: 'DirectMessage'
      });
    } catch (e) {
      console.error('Failed to process MESSAGE_SENT notification:', e);
    }
  });

  // Listen to Group Messages
  eventEmitter.onEvent('GROUP_MESSAGE_SENT', async () => {
    try {
      // In a real scenario, we'd need to look up all participants in the group
      // and fan-out a notification to each one (except the sender).
      // For this phase, we'll demonstrate the event interception block:
      // (Requires cross-module event or querying to get participants)
    } catch (e) {
      console.error('Failed to process GROUP_MESSAGE_SENT notification:', e);
    }
  });
};
