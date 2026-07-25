import { AIProvider, AIFeature, AIRequestStatus } from '@prisma/client';

export interface IAIProvider {
  generateContent(prompt: string): Promise<string>;
  generateStructuredContent<T>(prompt: string, schema?: unknown): Promise<T>;
}

export interface AIUsageRecord {
  userId: string;
  feature: AIFeature;
  provider: AIProvider;
  status: AIRequestStatus;
  promptTokens?: number;
  completionTokens?: number;
  durationMs: number;
  errorMessage?: string;
}

export interface ConversationSummaryResult {
  title: string;
  summary: string;
  bulletPoints: string[];
  actionItems: string[];
}

export interface ModerationResult {
  safe: boolean;
  categories: {
    spam: boolean;
    toxicity: boolean;
    violence: boolean;
    adult: boolean;
    selfHarm: boolean;
  };
  confidence: number;
  reason?: string;
}
