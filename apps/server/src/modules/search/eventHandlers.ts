import { eventEmitter } from '../../events/emitter.js';
import { SearchRepository } from './repository.js';
import { AppEvent } from '../../events/types.js';

const searchRepository = new SearchRepository();

export const registerSearchEventHandlers = () => {
  eventEmitter.on('USER_REGISTERED', async (event: AppEvent) => {
    try {
      const payload = event.payload as any;
      if (!payload.userId || !payload.email) return;
      
      const searchableText = `${payload.email} ${payload.name || ''}`.trim();
      
      await searchRepository.upsertSearchIndex(
        'USER',
        payload.userId,
        searchableText,
        payload.userId,
        { visibility: 'PUBLIC' } // Example
      );
    } catch (err) {
      console.error('Search event handler error (USER_REGISTERED):', err);
    }
  });

  eventEmitter.on('GROUP_CREATED', async (event: AppEvent) => {
    try {
      const payload = event.payload as any;
      if (!payload.groupId) return;
      
      // We would ideally fetch the group name here, but since this is an event-driven decoupled service,
      // it's better if GROUP_CREATED event payload contains the group name and description.
      // If it doesn't, we can either update the event payload contract or fetch it if allowed (but we want to avoid cross-module direct DB queries).
      // Assuming payload has name/description or we just index the ID.
      // For a real implementation, we should ensure the event contains searchable metadata.
      const searchableText = `${payload.name || ''} ${payload.description || ''}`.trim();
      
      await searchRepository.upsertSearchIndex(
        'GROUP',
        payload.groupId,
        searchableText,
        payload.creatorId,
        { visibility: payload.visibility || 'PRIVATE' }
      );
    } catch (err) {
      console.error('Search event handler error (GROUP_CREATED):', err);
    }
  });

  eventEmitter.on('MESSAGE_SENT', async (event: AppEvent) => {
    try {
      const payload = event.payload as any;
      if (!payload.messageId || !payload.content) return;
      
      await searchRepository.upsertSearchIndex(
        'MESSAGE',
        payload.messageId,
        payload.content,
        payload.senderId,
        { conversationId: payload.conversationId } 
      );
    } catch (err) {
      console.error('Search event handler error (MESSAGE_SENT):', err);
    }
  });

  eventEmitter.on('GROUP_MESSAGE_SENT', async (event: AppEvent) => {
    try {
      const payload = event.payload as any;
      if (!payload.messageId || !payload.content) return;
      
      await searchRepository.upsertSearchIndex(
        'GROUP_MESSAGE',
        payload.messageId,
        payload.content,
        payload.senderId,
        { groupId: payload.groupId }
      );
    } catch (err) {
      console.error('Search event handler error (GROUP_MESSAGE_SENT):', err);
    }
  });
  
  eventEmitter.on('FILE_UPLOADED', async (event: AppEvent) => {
    try {
      const payload = event.payload as any;
      if (!payload.fileId) return;
      
      const searchableText = `${payload.originalName || ''} ${payload.fileType || ''}`.trim();
      
      await searchRepository.upsertSearchIndex(
        'MEDIA',
        payload.fileId,
        searchableText,
        payload.ownerId,
        { visibility: 'PRIVATE' }
      );
    } catch (err) {
      console.error('Search event handler error (FILE_UPLOADED):', err);
    }
  });

  // Handle deletions
  eventEmitter.on('MESSAGE_DELETED', async (event: AppEvent) => {
    try {
      const payload = event.payload as any;
      if (!payload.messageId) return;
      await searchRepository.removeSearchIndex('MESSAGE', payload.messageId);
    } catch (err) {
      console.error('Search event handler error (MESSAGE_DELETED):', err);
    }
  });

  eventEmitter.on('GROUP_MESSAGE_DELETED', async (event: AppEvent) => {
    try {
      const payload = event.payload as any;
      if (!payload.messageId) return;
      await searchRepository.removeSearchIndex('GROUP_MESSAGE', payload.messageId);
    } catch (err) {
      console.error('Search event handler error (GROUP_MESSAGE_DELETED):', err);
    }
  });
  
  eventEmitter.on('GROUP_DELETED', async (event: AppEvent) => {
    try {
      const payload = event.payload as any;
      if (!payload.groupId) return;
      await searchRepository.removeSearchIndex('GROUP', payload.groupId);
    } catch (err) {
      console.error('Search event handler error (GROUP_DELETED):', err);
    }
  });
  
  eventEmitter.on('FILE_DELETED', async (event: AppEvent) => {
    try {
      const payload = event.payload as any;
      if (!payload.fileId) return;
      await searchRepository.removeSearchIndex('MEDIA', payload.fileId);
    } catch (err) {
      console.error('Search event handler error (FILE_DELETED):', err);
    }
  });
};
