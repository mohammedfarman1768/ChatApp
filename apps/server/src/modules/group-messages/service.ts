import { groupMessageRepository } from './repository.js';
import { groupRepository } from '../groups/repository.js';
import { eventEmitter } from '../../events/emitter.js';
import { ISendGroupMessageData, IEditGroupMessageData, IGroupMessagePagination, GroupMessageError } from './types.js';

export const groupMessageService = {
  async getMember(groupId: string, userId: string) {
    const member = await groupRepository.getMember(groupId, userId);
    if (!member) {
      throw new GroupMessageError(403, 'You must be a member of this group');
    }
    const ban = await groupRepository.getBan(groupId, userId);
    if (ban) {
      throw new GroupMessageError(403, 'You are banned from this group');
    }
    return member;
  },

  async getSettings(groupId: string) {
    const group = await groupRepository.getGroupById(groupId);
    if (!group) throw new GroupMessageError(404, 'Group not found');
    return group.settings;
  },

  async sendMessage(data: ISendGroupMessageData) {
    await this.getMember(data.groupId, data.senderId);

    const message = await groupMessageRepository.createMessage(data);

    eventEmitter.emitEvent('GROUP_MESSAGE_SENT', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_MESSAGE_SENT',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-messages-service',
      correlationId: message.id,
      payload: {
        messageId: message.id,
        conversationId: message.conversationId,
        groupId: data.groupId,
        senderId: data.senderId,
        content: message.content,
        messageType: message.messageType,
      }
    });

    return message;
  },

  async editMessage(groupId: string, userId: string, data: IEditGroupMessageData) {
    await this.getMember(groupId, userId);
    
    const message = await groupMessageRepository.getMessageById(data.messageId);
    if (!message) throw new GroupMessageError(404, 'Message not found');
    if (message.conversation.groupId !== groupId) throw new GroupMessageError(400, 'Message does not belong to this group');
    if (message.senderId !== userId) throw new GroupMessageError(403, 'You can only edit your own messages');
    
    // 15 minute edit window
    const fifteenMins = 15 * 60 * 1000;
    if (new Date().getTime() - message.createdAt.getTime() > fifteenMins) {
      throw new GroupMessageError(403, 'Edit window has expired');
    }

    const updated = await groupMessageRepository.editMessage(data.messageId, data.content);

    eventEmitter.emitEvent('GROUP_MESSAGE_EDITED', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_MESSAGE_EDITED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-messages-service',
      correlationId: updated.id,
      payload: {
        messageId: updated.id,
        conversationId: updated.conversationId,
        groupId,
        content: updated.content,
      }
    });

    return updated;
  },

  async deleteMessage(groupId: string, userId: string, messageId: string, deleteForEveryone: boolean) {
    const member = await this.getMember(groupId, userId);
    
    const message = await groupMessageRepository.getMessageById(messageId);
    if (!message) throw new GroupMessageError(404, 'Message not found');
    if (message.conversation.groupId !== groupId) throw new GroupMessageError(400, 'Message does not belong to this group');
    
    if (deleteForEveryone) {
      if (message.senderId !== userId) {
        // Moderators and admins can delete for everyone at any time
        if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) {
          throw new GroupMessageError(403, 'You do not have permission to delete this message');
        }
      } else {
        // Sender deletion window (15 mins)
        const fifteenMins = 15 * 60 * 1000;
        if (new Date().getTime() - message.createdAt.getTime() > fifteenMins) {
          throw new GroupMessageError(403, 'Delete window has expired');
        }
      }

      await groupMessageRepository.deleteMessageForEveryone(messageId);

      eventEmitter.emitEvent('GROUP_MESSAGE_DELETED', {
        eventId: crypto.randomUUID(),
        eventType: 'GROUP_MESSAGE_DELETED',
        timestamp: new Date().toISOString(),
        version: 1,
        source: 'group-messages-service',
        correlationId: message.id,
        payload: {
          messageId: message.id,
          conversationId: message.conversationId,
          groupId,
          deletedForEveryone: true,
        }
      });
    } else {
      await groupMessageRepository.hideMessageForUser(messageId, userId);
      // Delete for me doesn't emit an event to others, just a success response
    }
  },

  async getMessages(groupId: string, userId: string, pagination: IGroupMessagePagination) {
    await this.getMember(groupId, userId);
    return groupMessageRepository.getMessages(groupId, userId, pagination);
  },

  async markAsRead(groupId: string, userId: string, messageId: string) {
    await this.getMember(groupId, userId);
    
    const message = await groupMessageRepository.getMessageById(messageId);
    if (!message) throw new GroupMessageError(404, 'Message not found');
    
    await groupMessageRepository.markAsRead(messageId, userId);

    eventEmitter.emitEvent('GROUP_MESSAGE_READ', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_MESSAGE_READ',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-messages-service',
      correlationId: message.id,
      payload: {
        messageId: message.id,
        conversationId: message.conversationId,
        groupId,
        userId,
      }
    });
  },

  async addReaction(groupId: string, userId: string, messageId: string, emoji: string) {
    await this.getMember(groupId, userId);
    
    const message = await groupMessageRepository.getMessageById(messageId);
    if (!message) throw new GroupMessageError(404, 'Message not found');
    if (message.deletedForEveryone) throw new GroupMessageError(400, 'Cannot react to a deleted message');

    await groupMessageRepository.addReaction(messageId, userId, emoji);

    eventEmitter.emitEvent('GROUP_MESSAGE_REACTION_ADDED', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_MESSAGE_REACTION_ADDED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-messages-service',
      correlationId: message.id,
      payload: {
        messageId: message.id,
        conversationId: message.conversationId,
        groupId,
        userId,
        emoji,
      }
    });
  },

  async removeReaction(groupId: string, userId: string, messageId: string, emoji: string) {
    await this.getMember(groupId, userId);
    
    const message = await groupMessageRepository.getMessageById(messageId);
    if (!message) throw new GroupMessageError(404, 'Message not found');

    await groupMessageRepository.removeReaction(messageId, userId, emoji);

    eventEmitter.emitEvent('GROUP_MESSAGE_REACTION_REMOVED', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_MESSAGE_REACTION_REMOVED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-messages-service',
      correlationId: message.id,
      payload: {
        messageId: message.id,
        conversationId: message.conversationId,
        groupId,
        userId,
        emoji,
      }
    });
  },

  async getPins(groupId: string, userId: string) {
    await this.getMember(groupId, userId);
    return groupMessageRepository.getPinnedMessages(groupId);
  },

  async pinMessage(groupId: string, userId: string, messageId: string) {
    const member = await this.getMember(groupId, userId);
    if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) {
      throw new GroupMessageError(403, 'You do not have permission to pin messages');
    }

    const message = await groupMessageRepository.getMessageById(messageId);
    if (!message || message.conversation.groupId !== groupId) throw new GroupMessageError(404, 'Message not found in group');

    const currentPins = await groupMessageRepository.getPinnedMessages(groupId);
    if (currentPins.length >= 50) {
      // Unpin the oldest
      const oldestPin = currentPins[currentPins.length - 1];
      await groupMessageRepository.unpinMessage(oldestPin.messageId);
    }

    await groupMessageRepository.pinMessage(groupId, messageId, userId);

    eventEmitter.emitEvent('GROUP_MESSAGE_PINNED', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_MESSAGE_PINNED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-messages-service',
      correlationId: message.id,
      payload: {
        messageId: message.id,
        groupId,
        pinnedBy: userId,
      }
    });
  },

  async unpinMessage(groupId: string, userId: string, messageId: string) {
    const member = await this.getMember(groupId, userId);
    if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) {
      throw new GroupMessageError(403, 'You do not have permission to unpin messages');
    }

    await groupMessageRepository.unpinMessage(messageId);

    eventEmitter.emitEvent('GROUP_MESSAGE_UNPINNED', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_MESSAGE_UNPINNED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-messages-service',
      correlationId: messageId,
      payload: {
        messageId: messageId,
        groupId,
        unpinnedBy: userId,
      }
    });
  },

  async getAnnouncements(groupId: string, userId: string, pagination: IGroupMessagePagination) {
    await this.getMember(groupId, userId);
    return groupMessageRepository.getAnnouncements(groupId, pagination);
  },

  async createAnnouncement(groupId: string, userId: string, messageId: string) {
    const member = await this.getMember(groupId, userId);
    const settings = await this.getSettings(groupId);

    if (member.role === 'MEMBER') {
      throw new GroupMessageError(403, 'You do not have permission to create announcements');
    }

    if (member.role === 'MODERATOR' && !settings?.allowModeratorAnnouncements) {
      throw new GroupMessageError(403, 'Moderators are not allowed to create announcements in this group');
    }

    const message = await groupMessageRepository.getMessageById(messageId);
    if (!message || message.conversation.groupId !== groupId) throw new GroupMessageError(404, 'Message not found in group');

    const announcement = await groupMessageRepository.createAnnouncement(groupId, messageId, userId);

    eventEmitter.emitEvent('GROUP_ANNOUNCEMENT_CREATED', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_ANNOUNCEMENT_CREATED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-messages-service',
      correlationId: message.id,
      payload: {
        messageId: message.id,
        groupId,
        createdBy: userId,
      }
    });

    return announcement;
  },

  async getMeta(groupId: string, userId: string) {
    await this.getMember(groupId, userId);
    
    // In a real app we'd fetch unread counts based on participants.unreadCount, 
    // pinned message count, etc.
    const conversation = await groupMessageRepository.getOrCreateConversation(groupId);
    const participant = await groupMessageRepository.getParticipant(conversation.id, userId);
    
    return {
      unreadCount: participant.unreadCount,
      lastReadMessageId: participant.lastReadMessageId,
      mutedUntil: participant.mutedUntil,
    };
  }
};
