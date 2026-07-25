import { chatRepository } from './repository.js';
import { usersRepository } from '../users/repository.js';
import { 
  ISendMessageData, 
  IEditMessageData, 
  IDeleteMessageData, 
  IMarkMessageReadData,
  IAddReactionData,
  IRemoveReactionData
} from './types.js';
import { eventEmitter } from '../../events/emitter.js';
import crypto from 'crypto';

export class ChatError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ChatError';
  }
}

export const chatService = {
  async getOrCreateConversation(participantAId: string, participantBId: string) {
    if (participantAId === participantBId) {
      throw new ChatError(400, 'Cannot create a conversation with yourself');
    }

    // Check if blocked
    const hasBlock = await usersRepository.findAnyBlock(participantAId, participantBId);

    if (hasBlock) {
      throw new ChatError(403, 'Cannot message this user');
    }

    let conversation = await chatRepository.findConversationByParticipants(participantAId, participantBId);

    if (!conversation) {
      conversation = await chatRepository.createConversation(participantAId, participantBId);
    }

    return conversation;
  },

  async getConversations(userId: string, limit?: number, cursor?: string) {
    return chatRepository.getConversationsForUser(userId, limit, cursor);
  },

  async getConversation(conversationId: string, userId: string) {
    const conversation = await chatRepository.getConversationById(conversationId);
    if (!conversation) {
      throw new ChatError(404, 'Conversation not found');
    }

    const isParticipant = conversation.participants.some((p: any) => p.userId === userId);
    if (!isParticipant) {
      throw new ChatError(403, 'Not a participant in this conversation');
    }

    return conversation;
  },

  async sendMessage(data: ISendMessageData, correlationId?: string) {
    // Validate conversation exists and user is a participant
    const conversation = await chatRepository.getConversationById(data.conversationId);
    if (!conversation) {
      throw new ChatError(404, 'Conversation not found');
    }

    const isParticipant = conversation.participants.some((p: any) => p.userId === data.senderId);
    if (!isParticipant) {
      throw new ChatError(403, 'Not a participant in this conversation');
    }

    // Check blocks between all participants
    const otherParticipant = conversation.participants.find((p: any) => p.userId !== data.senderId);
    if (otherParticipant) {
       const hasBlock = await usersRepository.findAnyBlock(data.senderId, otherParticipant.userId);
       if (hasBlock) {
          throw new ChatError(403, 'Cannot message this user due to block');
       }
    }

    const message = await chatRepository.sendMessage(data);

    eventEmitter.emit('MESSAGE_SENT', {
      eventId: crypto.randomUUID(),
      eventType: 'MESSAGE_SENT',
      timestamp: new Date(),
      version: '1',
      source: 'chat-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        messageId: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        messageType: message.messageType
      }
    });

    return message;
  },

  async getMessages(conversationId: string, userId: string, limit?: number, cursor?: string) {
    const conversation = await chatRepository.getConversationById(conversationId);
    if (!conversation) {
      throw new ChatError(404, 'Conversation not found');
    }

    const isParticipant = conversation.participants.some((p: any) => p.userId === userId);
    if (!isParticipant) {
      throw new ChatError(403, 'Not a participant in this conversation');
    }

    return chatRepository.getMessages(conversationId, limit, cursor);
  },

  async editMessage(data: IEditMessageData, correlationId?: string) {
    const message = await chatRepository.getMessageById(data.messageId);
    if (!message) {
      throw new ChatError(404, 'Message not found');
    }
    if (message.senderId !== data.userId) {
      throw new ChatError(403, 'Can only edit your own messages');
    }
    
    // Configurable edit window (e.g. 15 mins) could go here
    const timeSinceCreation = Date.now() - message.createdAt.getTime();
    if (timeSinceCreation > 15 * 60 * 1000) {
      throw new ChatError(400, 'Edit window has expired');
    }

    const updated = await chatRepository.editMessage(data);

    eventEmitter.emit('MESSAGE_EDITED', {
      eventId: crypto.randomUUID(),
      eventType: 'MESSAGE_EDITED',
      timestamp: new Date(),
      version: '1',
      source: 'chat-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        messageId: updated.id,
        conversationId: updated.conversationId,
        content: updated.content
      }
    });

    return updated;
  },

  async deleteMessage(data: IDeleteMessageData, correlationId?: string) {
    const message = await chatRepository.getMessageById(data.messageId);
    if (!message) {
      throw new ChatError(404, 'Message not found');
    }
    if (message.senderId !== data.userId) {
      throw new ChatError(403, 'Can only delete your own messages');
    }

    // Configurable delete window (e.g. 1 hour)
    const timeSinceCreation = Date.now() - message.createdAt.getTime();
    if (data.deleteForEveryone && timeSinceCreation > 60 * 60 * 1000) {
      throw new ChatError(400, 'Delete-for-everyone window has expired');
    }

    const updated = await chatRepository.deleteMessage(data);

    eventEmitter.emit('MESSAGE_DELETED', {
      eventId: crypto.randomUUID(),
      eventType: 'MESSAGE_DELETED',
      timestamp: new Date(),
      version: '1',
      source: 'chat-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        messageId: updated.id,
        conversationId: updated.conversationId,
        deletedForEveryone: updated.deletedForEveryone
      }
    });

    return updated;
  },

  async markMessageRead(data: IMarkMessageReadData, correlationId?: string) {
    const message = await chatRepository.getMessageById(data.messageId);
    if (!message) {
      throw new ChatError(404, 'Message not found');
    }

    const isParticipant = message.conversation.participants.some((p: any) => p.userId === data.userId);
    if (!isParticipant) {
      throw new ChatError(403, 'Not a participant in this conversation');
    }

    const status = await chatRepository.markMessageRead(data);

    eventEmitter.emit('MESSAGE_READ', {
      eventId: crypto.randomUUID(),
      eventType: 'MESSAGE_READ',
      timestamp: new Date(),
      version: '1',
      source: 'chat-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        messageId: data.messageId,
        conversationId: message.conversationId,
        userId: data.userId
      }
    });

    return status;
  },

  async addReaction(data: IAddReactionData, correlationId?: string) {
    const message = await chatRepository.getMessageById(data.messageId);
    if (!message) {
      throw new ChatError(404, 'Message not found');
    }

    const isParticipant = message.conversation.participants.some((p: any) => p.userId === data.userId);
    if (!isParticipant) {
      throw new ChatError(403, 'Not a participant in this conversation');
    }

    try {
      const reaction = await chatRepository.addReaction(data);
      eventEmitter.emit('MESSAGE_REACTION_ADDED', {
        eventId: crypto.randomUUID(),
        eventType: 'MESSAGE_REACTION_ADDED',
        timestamp: new Date(),
        version: '1',
        source: 'chat-module',
        correlationId: correlationId || crypto.randomUUID(),
        payload: {
          messageId: data.messageId,
          conversationId: message.conversationId,
          userId: data.userId,
          emoji: data.emoji
        }
      });
      return reaction;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ChatError(400, 'Reaction already exists');
      }
      throw e;
    }
  },

  async removeReaction(data: IRemoveReactionData, correlationId?: string) {
    const message = await chatRepository.getMessageById(data.messageId);
    if (!message) {
      throw new ChatError(404, 'Message not found');
    }

    const isParticipant = message.conversation.participants.some((p: any) => p.userId === data.userId);
    if (!isParticipant) {
      throw new ChatError(403, 'Not a participant in this conversation');
    }

    await chatRepository.removeReaction(data);

    eventEmitter.emit('MESSAGE_REACTION_REMOVED', {
      eventId: crypto.randomUUID(),
      eventType: 'MESSAGE_REACTION_REMOVED',
      timestamp: new Date(),
      version: '1',
      source: 'chat-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        messageId: data.messageId,
        conversationId: message.conversationId,
        userId: data.userId,
        emoji: data.emoji
      }
    });
  }
};
