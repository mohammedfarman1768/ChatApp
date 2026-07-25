import { IAIProvider } from './types.js';
import { GeminiProvider } from './geminiProvider.js';
import { MockProvider } from './mockProvider.js';

let providerInstance: IAIProvider | null = null;

export const getAIProvider = (): IAIProvider => {
  if (!providerInstance) {
    const providerConfig = process.env.AI_PROVIDER || 'GEMINI';
    
    if (providerConfig === 'MOCK') {
      providerInstance = new MockProvider();
    } else {
      providerInstance = new GeminiProvider();
    }
  }
  return providerInstance;
};
