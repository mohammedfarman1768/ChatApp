import { SearchService } from '../service.js';
import { SearchRepository } from '../repository.js';
import { usersService } from '../../users/service.js';
import { eventEmitter } from '../../../events/emitter.js';

jest.mock('../repository.js');
jest.mock('../../users/service.js');
jest.mock('../../../events/emitter.js');

describe('SearchService Unit Tests', () => {
  let searchService: SearchService;
  let mockSearchRepository: jest.Mocked<SearchRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchRepository = new SearchRepository() as jest.Mocked<SearchRepository>;
    searchService = new SearchService(mockSearchRepository);
  });

  describe('search', () => {
    it('should query SearchRepository with blocked users and emit event', async () => {
      const mockUserId = 'user-1';
      const mockQuery = 'test';
      const mockBlockedIds = ['blocked-1', 'blocked-2'];
      const mockResults = [{ id: 'result-1' }];

      (usersService.getBlockedUserIds as jest.Mock).mockResolvedValue(mockBlockedIds);
      mockSearchRepository.saveSearchHistory.mockResolvedValue();
      mockSearchRepository.search.mockResolvedValue(mockResults);

      const response = await searchService.search(mockUserId, { query: mockQuery, category: 'ALL' });

      expect(usersService.getBlockedUserIds).toHaveBeenCalledWith(mockUserId);
      expect(mockSearchRepository.saveSearchHistory).toHaveBeenCalledWith(mockUserId, mockQuery, 'ALL');
      expect(mockSearchRepository.search).toHaveBeenCalledWith(mockQuery, 'ALL', mockUserId, mockBlockedIds, undefined, undefined);
      
      expect(eventEmitter.emitEvent).toHaveBeenCalledWith('SEARCH_COMPLETED', expect.objectContaining({
        eventType: 'SEARCH_COMPLETED',
        payload: expect.objectContaining({
          userId: mockUserId,
          query: mockQuery,
          category: 'ALL',
          resultCount: 1
        })
      }));

      expect(response.data).toEqual(mockResults);
    });

    it('should clear history and emit event', async () => {
      const mockUserId = 'user-1';
      
      await searchService.clearHistory(mockUserId);
      
      expect(mockSearchRepository.clearSearchHistory).toHaveBeenCalledWith(mockUserId);
      expect(eventEmitter.emitEvent).toHaveBeenCalledWith('SEARCH_HISTORY_CLEARED', expect.objectContaining({
        eventType: 'SEARCH_HISTORY_CLEARED',
        payload: { userId: mockUserId }
      }));
    });
  });
});
