import { SearchRepository } from './repository.js';
import { SearchFilters } from './types.js';
import { eventEmitter as eventBus } from '../../events/emitter.js';
import { usersService } from '../users/service.js';

export class SearchService {
  constructor(private readonly searchRepository: SearchRepository) {}

  async search(userId: string, filters: SearchFilters) {
    // 1. Save history
    if (filters.query && filters.query.trim().length > 0) {
      await this.searchRepository.saveSearchHistory(userId, filters.query, filters.category).catch(console.error);
    }
    
    // 2. Perform search
    const blockedIds = await usersService.getBlockedUserIds(userId);
    const results = await this.searchRepository.search(filters.query, filters.category, userId, blockedIds, filters.cursor, filters.limit);
    
    // 3. Emit Event
    if (eventBus) {
      eventBus.emitEvent('SEARCH_COMPLETED', {
        eventId: crypto.randomUUID(),
        eventType: 'SEARCH_COMPLETED',
        timestamp: new Date().toISOString(),
        version: 1,
        source: 'SearchModule',
        correlationId: crypto.randomUUID(),
        payload: {
          userId,
          query: filters.query,
          category: filters.category,
          resultCount: results.length
        }
      });
    }
    
    return {
      data: results,
      pagination: {
        nextCursor: results.length === filters.limit ? results[results.length - 1].id : null,
      }
    };
  }

  async getHistory(userId: string) {
    return this.searchRepository.getSearchHistory(userId);
  }

  async clearHistory(userId: string) {
    await this.searchRepository.clearSearchHistory(userId);
    
    if (eventBus) {
      eventBus.emitEvent('SEARCH_HISTORY_CLEARED', {
        eventId: crypto.randomUUID(),
        eventType: 'SEARCH_HISTORY_CLEARED',
        timestamp: new Date().toISOString(),
        version: 1,
        source: 'SearchModule',
        correlationId: crypto.randomUUID(),
        payload: { userId }
      });
    }
  }

  async getSuggestions(userId: string, query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.searchRepository.getSuggestions(userId, query);
  }

  async requestReindex(_requestedBy: string, _entityType?: string) {
    // Basic stub, real background job system skipped per user feedback for Phase 11
    return { status: 'acknowledged', message: 'Reindex job system skipped for Phase 11' };
  }
}
