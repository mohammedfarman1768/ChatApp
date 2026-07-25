import { AIService } from '../service.js';
import { aiRepository } from '../repository.js';
import { getAIProvider } from '../provider.js';
import { chatService } from '../../chat/service.js';
import { eventEmitter } from '../../../events/emitter.js';

jest.mock('../repository.js', () => ({
  aiRepository: {
    getOrCreatePreferences: jest.fn(),
    logUsage: jest.fn(),
  }
}));

jest.mock('../provider.js', () => ({
  getAIProvider: jest.fn()
}));

jest.mock('../../chat/service.js', () => ({
  chatService: {
    getMessages: jest.fn()
  }
}));

jest.mock('../../../events/emitter.js', () => ({
  eventEmitter: {
    emitEvent: jest.fn()
  }
}));

describe('AIService Unit Tests', () => {
  let aiService: AIService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();
    
    (aiRepository.getOrCreatePreferences as jest.Mock).mockResolvedValue({
      aiEnabled: true,
      allowSummaries: true,
      allowSmartReply: true,
      allowRewrite: true,
      allowTranslate: true,
      allowModeration: true
    });
    (aiRepository.logUsage as jest.Mock).mockResolvedValue(true);
  });

  describe('rewriteMessage', () => {
    it('should rewrite message and emit event', async () => {
      const mockProvider = {
        generateContent: jest.fn().mockResolvedValue('Rewritten text')
      };
      (getAIProvider as jest.Mock).mockReturnValue(mockProvider);

      const result = await aiService.rewriteMessage('user1', 'Original text', 'Professional');

      expect(result).toBe('Rewritten text');
      expect(mockProvider.generateContent).toHaveBeenCalled();
      expect(aiRepository.logUsage).toHaveBeenCalled();
      expect(eventEmitter.emitEvent).toHaveBeenCalledWith('AI_REWRITE_CREATED', expect.any(Object));
    });
  });

  describe('generateSummary', () => {
    it('should truncate context correctly', async () => {
      const mockProvider = {
        generateStructuredContent: jest.fn().mockResolvedValue({ summary: 'test' })
      };
      (getAIProvider as jest.Mock).mockReturnValue(mockProvider);

      (chatService.getMessages as jest.Mock).mockResolvedValue({
        messages: [
          { senderId: 'user1', content: 'Message 1' },
          { senderId: 'user2', content: 'Message 2' }
        ]
      });

      const result = await aiService.generateSummary('user1', 'chat1', 'CONVERSATION');

      expect(result.summary).toBe('test');
      expect(chatService.getMessages).toHaveBeenCalledWith('chat1', 'user1', 100);
    });
  });
});
