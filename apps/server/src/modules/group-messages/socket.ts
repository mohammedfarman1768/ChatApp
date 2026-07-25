import { Server, Socket } from 'socket.io';
import { groupMessageService } from './service.js';
import { groupRepository } from '../groups/repository.js';

export function setupGroupMessagingSocket(io: Server, socket: Socket) {
  const userId = socket.data.user?.id;
  if (!userId) return;

  socket.on('group-message:join', async (payload: { groupId: string }) => {
    try {
      if (!payload.groupId) return;
      // verify membership
      const member = await groupRepository.getMember(payload.groupId, userId);
      const ban = await groupRepository.getBan(payload.groupId, userId);
      
      if (member && !ban) {
        socket.join(`group:${payload.groupId}`);
      }
    } catch (err) {
      console.error('Socket group join error:', err);
    }
  });

  socket.on('group-message:leave', (payload: { groupId: string }) => {
    if (payload.groupId) {
      socket.leave(`group:${payload.groupId}`);
    }
  });

  socket.on('group-message:typing', async (payload: { groupId: string; isTyping: boolean }) => {
    try {
      if (!payload.groupId) return;
      // Validate membership briefly via service or assume ok if in room
      // To be safe, rely on room membership
      if (socket.rooms.has(`group:${payload.groupId}`)) {
        socket.to(`group:${payload.groupId}`).emit(
          payload.isTyping ? 'group-message:typing:start' : 'group-message:typing:stop',
          { groupId: payload.groupId, userId }
        );
      }
    } catch (err) {
      console.error('Socket typing error:', err);
    }
  });

  // Most mutations are expected over REST, but if client sends via socket:
  socket.on('group-message:send', async (payload: { groupId: string; content: string; replyToMessageId?: string }) => {
    try {
      await groupMessageService.sendMessage({
        groupId: payload.groupId,
        senderId: userId,
        content: payload.content,
        replyToMessageId: payload.replyToMessageId,
      });
    } catch (err) {
      socket.emit('error', { message: 'Failed to send message via socket' });
    }
  });

  socket.on('group-message:edit', async (payload: { groupId: string; messageId: string; content: string }) => {
    try {
      await groupMessageService.editMessage(payload.groupId, userId, {
        messageId: payload.messageId,
        content: payload.content,
      });
    } catch (err) {
      socket.emit('error', { message: 'Failed to edit message via socket' });
    }
  });

  socket.on('group-message:delete', async (payload: { groupId: string; messageId: string; deleteForEveryone?: boolean }) => {
    try {
      await groupMessageService.deleteMessage(payload.groupId, userId, payload.messageId, payload.deleteForEveryone || false);
    } catch (err) {
      socket.emit('error', { message: 'Failed to delete message via socket' });
    }
  });

  socket.on('group-message:read', async (payload: { groupId: string; messageId: string }) => {
    try {
      await groupMessageService.markAsRead(payload.groupId, userId, payload.messageId);
    } catch (err) {
      socket.emit('error', { message: 'Failed to mark read via socket' });
    }
  });

  socket.on('group-message:reaction:add', async (payload: { groupId: string; messageId: string; emoji: string }) => {
    try {
      await groupMessageService.addReaction(payload.groupId, userId, payload.messageId, payload.emoji);
    } catch (err) {
      socket.emit('error', { message: 'Failed to add reaction via socket' });
    }
  });

  socket.on('group-message:reaction:remove', async (payload: { groupId: string; messageId: string; emoji: string }) => {
    try {
      await groupMessageService.removeReaction(payload.groupId, userId, payload.messageId, payload.emoji);
    } catch (err) {
      socket.emit('error', { message: 'Failed to remove reaction via socket' });
    }
  });

  socket.on('group-message:pin', async (payload: { groupId: string; messageId: string }) => {
    try {
      await groupMessageService.pinMessage(payload.groupId, userId, payload.messageId);
    } catch (err) {
      socket.emit('error', { message: 'Failed to pin via socket' });
    }
  });

  socket.on('group-message:unpin', async (payload: { groupId: string; messageId: string }) => {
    try {
      await groupMessageService.unpinMessage(payload.groupId, userId, payload.messageId);
    } catch (err) {
      socket.emit('error', { message: 'Failed to unpin via socket' });
    }
  });
}
