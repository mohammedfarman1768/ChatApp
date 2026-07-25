import { eventEmitter } from '../../events/emitter.js';
import { getSocketServer } from '../../realtime/socket.js';

export function registerGroupMessageEventHandlers() {
  eventEmitter.on('GROUP_MESSAGE_SENT', (event: any) => {
    const io = getSocketServer();
    const { groupId } = event.payload;
    io.to(`group:${groupId}`).emit('group-message:new', event.payload);
  });

  eventEmitter.on('GROUP_MESSAGE_EDITED', (event: any) => {
    const io = getSocketServer();
    const { groupId } = event.payload;
    io.to(`group:${groupId}`).emit('group-message:edited', event.payload);
  });

  eventEmitter.on('GROUP_MESSAGE_DELETED', (event: any) => {
    const io = getSocketServer();
    const { groupId } = event.payload;
    io.to(`group:${groupId}`).emit('group-message:deleted', event.payload);
  });

  eventEmitter.on('GROUP_MESSAGE_READ', (event: any) => {
    const io = getSocketServer();
    const { groupId } = event.payload;
    io.to(`group:${groupId}`).emit('group-message:read', event.payload);
  });

  eventEmitter.on('GROUP_MESSAGE_REACTION_ADDED', (event: any) => {
    const io = getSocketServer();
    const { groupId } = event.payload;
    io.to(`group:${groupId}`).emit('group-message:reaction:update', event.payload);
  });

  eventEmitter.on('GROUP_MESSAGE_REACTION_REMOVED', (event: any) => {
    const io = getSocketServer();
    const { groupId } = event.payload;
    io.to(`group:${groupId}`).emit('group-message:reaction:update', event.payload);
  });

  eventEmitter.on('GROUP_MESSAGE_PINNED', (event: any) => {
    const io = getSocketServer();
    const { groupId } = event.payload;
    io.to(`group:${groupId}`).emit('group-message:pinned', event.payload);
  });

  eventEmitter.on('GROUP_MESSAGE_UNPINNED', (event: any) => {
    const io = getSocketServer();
    const { groupId } = event.payload;
    io.to(`group:${groupId}`).emit('group-message:unpinned', event.payload);
  });

  eventEmitter.on('GROUP_ANNOUNCEMENT_CREATED', (event: any) => {
    const io = getSocketServer();
    const { groupId } = event.payload;
    io.to(`group:${groupId}`).emit('group-message:announcement', event.payload);
  });
}
