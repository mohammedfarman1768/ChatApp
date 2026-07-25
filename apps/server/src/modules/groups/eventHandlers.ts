import { eventEmitter } from '../../events/emitter.js';
import { logger } from '../../shared/logger/index.js';
import { getSocketServer } from '../../realtime/socket.js';

export const registerGroupEventHandlers = () => {
  eventEmitter.on('MEMBER_JOINED', (event) => {
    logger.info({ eventId: event.eventId }, 'Handling MEMBER_JOINED event in groups module');
    const io = getSocketServer();
    io.to(`group:${event.payload.groupId}`).emit('member:joined', event.payload);
  });

  eventEmitter.on('MEMBER_LEFT', (event) => {
    const io = getSocketServer();
    io.to(`group:${event.payload.groupId}`).emit('member:left', event.payload);
  });

  eventEmitter.on('MEMBER_KICKED', (event) => {
    const io = getSocketServer();
    io.to(`group:${event.payload.groupId}`).emit('member:kicked', event.payload);
  });

  eventEmitter.on('MEMBER_BANNED', (event) => {
    const io = getSocketServer();
    io.to(`group:${event.payload.groupId}`).emit('member:banned', event.payload);
  });

  eventEmitter.on('MEMBER_UNBANNED', (event) => {
    const io = getSocketServer();
    io.to(`group:${event.payload.groupId}`).emit('member:unbanned', event.payload);
  });

  eventEmitter.on('MEMBER_PROMOTED', (event) => {
    const io = getSocketServer();
    io.to(`group:${event.payload.groupId}`).emit('role:updated', event.payload);
  });

  eventEmitter.on('MEMBER_DEMOTED', (event) => {
    const io = getSocketServer();
    io.to(`group:${event.payload.groupId}`).emit('role:updated', event.payload);
  });

  eventEmitter.on('GROUP_UPDATED', (event) => {
    const io = getSocketServer();
    io.to(`group:${event.payload.groupId}`).emit('group:updated', event.payload);
  });
};
