import { IAIProvider } from './types.js';

export class MockProvider implements IAIProvider {
  async generateContent(prompt: string): Promise<string> {
    if (prompt.includes('rewrite')) {
      return 'This is a mocked rewritten message.';
    }
    if (prompt.includes('translate')) {
      return 'This is a mocked translation.';
    }
    if (prompt.includes('grammar')) {
      return 'This is a mocked grammar correction.';
    }
    if (prompt.includes('group description')) {
      return 'This is a mocked engaging group description.';
    }
    return 'Mocked AI response.';
  }

  async generateStructuredContent<T>(prompt: string, schema?: unknown): Promise<T> {
    if (prompt.includes('summarize')) {
      return {
        title: 'Mocked Summary',
        summary: 'This is a mocked summary of the conversation.',
        bulletPoints: ['Mock point 1', 'Mock point 2'],
        actionItems: ['Mock action 1']
      } as unknown as T;
    }
    if (prompt.includes('smartReply')) {
      return ['Mock reply 1', 'Mock reply 2'] as unknown as T;
    }
    if (prompt.includes('moderation')) {
      return {
        safe: true,
        categories: {
          spam: false,
          toxicity: false,
          violence: false,
          adult: false,
          selfHarm: false
        },
        confidence: 0.99,
        reason: ''
      } as unknown as T;
    }
    if (prompt.includes('rules')) {
      return ['Mock Rule 1', 'Mock Rule 2', 'Mock Rule 3'] as unknown as T;
    }
    
    return {} as T;
  }
}
