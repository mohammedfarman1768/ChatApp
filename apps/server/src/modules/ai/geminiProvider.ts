import { GoogleGenAI } from '@google/genai';
import { IAIProvider } from './types.js';
import { AppError } from '../../shared/errors/index.js';

export class GeminiProvider implements IAIProvider {
  private ai: GoogleGenAI;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || '';
    } catch (error) {
      throw new AppError('AI Provider failed', 503);
    }
  }

  async generateStructuredContent<T>(prompt: string, schema?: unknown): Promise<T> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          // If responseSchema is provided via gemini types, it goes here, 
          // but for now we instruct the prompt to return JSON.
        }
      });
      
      const text = response.text || '{}';
      return JSON.parse(text) as T;
    } catch (error) {
      throw new AppError('AI Provider failed or returned invalid format', 503);
    }
  }
}
