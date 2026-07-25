import { Server } from 'socket.io';
import { eventEmitter } from '../../events/emitter.js';

let ioInstance: Server | null = null;

export const initNotificationSocket = (io: Server) => {
  ioInstance = io;

  // We do not need a custom namespace for notifications.
  // The global Socket.IO setup maps users into `user:${userId}` rooms.
  // We just emit to those rooms.
};

// Event bindings for real-time delivery
eventEmitter.onEvent('NOTIFICATION_CREATED', (event) => {
  if (ioInstance) {
    const payload = event.payload as any;
    ioInstance.to(`user:${payload.userId}`).emit('notification:new', payload);
  }
});

eventEmitter.onEvent('NOTIFICATION_READ', (event) => {
  if (ioInstance) {
    const payload = event.payload as any;
    ioInstance.to(`user:${payload.userId}`).emit('notification:read', { notificationId: payload.notificationId });
  }
});

eventEmitter.onEvent('NOTIFICATION_DELETED', (event) => {
  if (ioInstance) {
    const payload = event.payload as any;
    ioInstance.to(`user:${payload.userId}`).emit('notification:deleted', { notificationId: payload.notificationId });
  }
});

// For keeping counts in sync
eventEmitter.onEvent('NOTIFICATION_CREATED', async () => {
  // Can broadcast generic refresh or trigger count updates on the client side
});
