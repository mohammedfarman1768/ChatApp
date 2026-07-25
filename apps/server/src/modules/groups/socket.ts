import { Socket } from 'socket.io';
import { logger } from '../../shared/logger/index.js';
import { groupRepository } from './repository.js';

export const registerGroupSocketHandlers = (socket: Socket) => {
  // Join a specific group room for updates
  socket.on('group:join', async ({ groupId, userId }: { groupId: string; userId: string }) => {
    try {
      const member = await groupRepository.getMember(groupId, userId);
      if (member) {
        socket.join(`group:${groupId}`);
        logger.debug({ socketId: socket.id, groupId, userId }, 'User joined group room');
      } else {
        logger.warn({ socketId: socket.id, groupId, userId }, 'Unauthorized attempt to join group room');
      }
    } catch (e: any) {
      logger.error({ err: e.message }, 'Error joining group room');
    }
  });

  // Leave a specific group room
  socket.on('group:leave', ({ groupId, userId }: { groupId: string; userId: string }) => {
    socket.leave(`group:${groupId}`);
    logger.debug({ socketId: socket.id, groupId, userId }, 'User left group room');
  });
};
