import { eventEmitter } from '../../events/emitter.js';
import { broadcastToConversation } from './socket.js';
import { logger } from '../../shared/logger/index.js';

export const registerChatEventHandlers = () => {
  eventEmitter.on('MESSAGE_SENT', (event) => {
    logger.debug({ eventId: event.eventId }, 'Handling MESSAGE_SENT event');
    if (event.payload && 'conversationId' in event.payload) {
      broadcastToConversation(event.payload.conversationId as string, 'message:new', event.payload);
    }
  });

  eventEmitter.on('MESSAGE_EDITED', (event) => {
    logger.debug({ eventId: event.eventId }, 'Handling MESSAGE_EDITED event');
    if (event.payload && 'conversationId' in event.payload) {
      broadcastToConversation(event.payload.conversationId as string, 'message:edited', event.payload);
    }
  });

  eventEmitter.on('MESSAGE_DELETED', (event) => {
    logger.debug({ eventId: event.eventId }, 'Handling MESSAGE_DELETED event');
    if (event.payload && 'conversationId' in event.payload) {
      broadcastToConversation(event.payload.conversationId as string, 'message:deleted', event.payload);
    }
  });

  eventEmitter.on('MESSAGE_READ', (event) => {
    logger.debug({ eventId: event.eventId }, 'Handling MESSAGE_READ event');
    if (event.payload && 'conversationId' in event.payload) {
      broadcastToConversation(event.payload.conversationId as string, 'message:read', event.payload);
    }
  });

  eventEmitter.on('MESSAGE_REACTION_ADDED', (event) => {
    logger.debug({ eventId: event.eventId }, 'Handling MESSAGE_REACTION_ADDED event');
    if (event.payload && 'conversationId' in event.payload) {
      broadcastToConversation(event.payload.conversationId as string, 'reaction:update', {
        type: 'added',
        ...event.payload as object
      });
    }
  });

  eventEmitter.on('MESSAGE_REACTION_REMOVED', (event) => {
    logger.debug({ eventId: event.eventId }, 'Handling MESSAGE_REACTION_REMOVED event');
    if (event.payload && 'conversationId' in event.payload) {
      broadcastToConversation(event.payload.conversationId as string, 'reaction:update', {
        type: 'removed',
        ...event.payload as object
      });
    }
  });
};
