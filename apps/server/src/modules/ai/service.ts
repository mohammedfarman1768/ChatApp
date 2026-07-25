import { getAIProvider } from './provider.js';
import { aiRepository } from './repository.js';
import { 
  AIUsageRecord, 
  ConversationSummaryResult,
  ModerationResult 
} from './types.js';
import { AIFeature, AIRequestStatus, AIProvider } from '@prisma/client';
import { chatService } from '../chat/service.js';
import { groupMessageService } from '../group-messages/service.js';
import { eventEmitter } from '../../events/emitter.js';
import { AppEvent } from '../../events/types.js';
import { AppError } from '../../shared/errors/index.js';
import { randomUUID } from 'crypto';

import { 
  summaryPrompt, 
  rewritePrompt, 
  translatePrompt, 
  smartReplyPrompt, 
  moderationPrompt,
  groupDescriptionPrompt,
  groupRulesPrompt,
  grammarPrompt
} from './prompts/index.js';

const AI_MAX_CONTEXT_MESSAGES = parseInt(process.env.AI_MAX_CONTEXT_MESSAGES || '100', 10);
const AI_MAX_INPUT_CHARS = parseInt(process.env.AI_MAX_INPUT_CHARS || '40000', 10);
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '10000', 10);

export class AIService {
  private async checkPreferences(userId: string, feature: keyof import('@prisma/client').AIUserPreference) {
    const prefs = await aiRepository.getOrCreatePreferences(userId);
    if (!prefs.aiEnabled || !prefs[feature as keyof typeof prefs]) {
      throw new AppError('AI feature is disabled in user preferences', 403);
    }
  }

  private async fetchContext(userId: string, targetId: string, targetType: 'CONVERSATION' | 'GROUP', limit: number) {
    let rawMessages: any[] = [];
    
    if (targetType === 'CONVERSATION') {
      const res = await chatService.getMessages(targetId, userId, limit);
      rawMessages = res.messages;
    } else {
      const res = await groupMessageService.getMessages(targetId, userId, { limit });
      rawMessages = res.messages;
    }

    rawMessages = rawMessages.reverse();

    const formattedMessages = rawMessages.map((m: any) => 
      `${m.senderId === userId ? 'Me' : 'Other'}: ${m.content}`
    ).join('\n');

    if (formattedMessages.length > AI_MAX_INPUT_CHARS) {
      return formattedMessages.slice(0, AI_MAX_INPUT_CHARS) + '\n...[TRUNCATED]';
    }
    
    return formattedMessages;
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>, 
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new AppError('AI Provider Timeout', 503)), timeoutMs)
      )
    ]);
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>, 
    retries: number = 1
  ): Promise<T> {
    try {
      return await this.executeWithTimeout(operation, AI_TIMEOUT_MS);
    } catch (error) {
      if (retries > 0) {
        return this.executeWithRetry(operation, retries - 1);
      }
      throw error;
    }
  }

  private async recordUsage(
    userId: string, 
    feature: AIFeature, 
    status: AIRequestStatus, 
    startTime: number, 
    errorMessage?: string
  ) {
    const providerStr = process.env.AI_PROVIDER || 'GEMINI';
    const provider = providerStr === 'MOCK' ? AIProvider.MOCK : AIProvider.GEMINI;
    
    const record: AIUsageRecord = {
      userId,
      feature,
      provider,
      status,
      durationMs: Date.now() - startTime,
      errorMessage: errorMessage?.substring(0, 255)
    };

    await aiRepository.logUsage(record).catch(console.error); // Fire and forget
  }

  private createEvent<T>(eventType: string, payload: T): AppEvent {
    return {
      eventId: randomUUID(),
      eventType,
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'ai-service',
      correlationId: randomUUID(),
      payload
    } as AppEvent;
  }

  private emitFailureEvent(userId: string, feature: string, errorMessage: string) {
    eventEmitter.emitEvent('AI_REQUEST_FAILED', this.createEvent('AI_REQUEST_FAILED', {
      userId, feature, errorMessage
    }));
  }

  async generateSummary(userId: string, targetId: string, targetType: 'CONVERSATION' | 'GROUP') {
    await this.checkPreferences(userId, 'allowSummaries');
    const startTime = Date.now();
    
    eventEmitter.emitEvent('AI_SUMMARY_REQUESTED', this.createEvent('AI_SUMMARY_REQUESTED', {
      userId, targetId, targetType
    }));

    try {
      const messages = await this.fetchContext(userId, targetId, targetType, AI_MAX_CONTEXT_MESSAGES);
      if (!messages.trim()) throw new AppError('Not enough context', 400);

      const prompt = summaryPrompt(messages);
      const provider = getAIProvider();
      
      const result = await this.executeWithRetry(() => 
        provider.generateStructuredContent<ConversationSummaryResult>(prompt)
      );

      await this.recordUsage(userId, AIFeature.SUMMARY, AIRequestStatus.SUCCESS, startTime);
      
      eventEmitter.emitEvent('AI_SUMMARY_CREATED', this.createEvent('AI_SUMMARY_CREATED', {
        userId, targetId, targetType, summary: result
      }));

      return result;
    } catch (error: any) {
      await this.recordUsage(userId, AIFeature.SUMMARY, AIRequestStatus.FAILED, startTime, error.message);
      this.emitFailureEvent(userId, AIFeature.SUMMARY, error.message);
      throw error;
    }
  }

  async generateSmartReplies(userId: string, targetId: string, targetType: 'CONVERSATION' | 'GROUP') {
    await this.checkPreferences(userId, 'allowSmartReply');
    const startTime = Date.now();
    
    try {
      const messages = await this.fetchContext(userId, targetId, targetType, 10);
      if (!messages.trim()) throw new AppError('Not enough context', 400);

      const prompt = smartReplyPrompt(messages);
      const provider = getAIProvider();
      
      const result = await this.executeWithRetry(() => 
        provider.generateStructuredContent<string[]>(prompt)
      );

      await this.recordUsage(userId, AIFeature.SMART_REPLY, AIRequestStatus.SUCCESS, startTime);
      
      eventEmitter.emitEvent('AI_SMART_REPLY_CREATED', this.createEvent('AI_SMART_REPLY_CREATED', {
        userId, targetId, targetType, replies: result
      }));

      return result;
    } catch (error: any) {
      await this.recordUsage(userId, AIFeature.SMART_REPLY, AIRequestStatus.FAILED, startTime, error.message);
      this.emitFailureEvent(userId, AIFeature.SMART_REPLY, error.message);
      throw error;
    }
  }

  async rewriteMessage(userId: string, text: string, tone: string) {
    await this.checkPreferences(userId, 'allowRewrite');
    const startTime = Date.now();
    
    try {
      const prompt = rewritePrompt(text, tone);
      const provider = getAIProvider();
      
      const result = await this.executeWithRetry(() => 
        provider.generateContent(prompt)
      );

      await this.recordUsage(userId, AIFeature.REWRITE, AIRequestStatus.SUCCESS, startTime);
      
      eventEmitter.emitEvent('AI_REWRITE_CREATED', this.createEvent('AI_REWRITE_CREATED', {
        userId, originalText: text, rewrittenText: result, tone
      }));

      return result;
    } catch (error: any) {
      await this.recordUsage(userId, AIFeature.REWRITE, AIRequestStatus.FAILED, startTime, error.message);
      this.emitFailureEvent(userId, AIFeature.REWRITE, error.message);
      throw error;
    }
  }

  async translateMessage(userId: string, text: string, targetLanguage: string) {
    await this.checkPreferences(userId, 'allowTranslate');
    const startTime = Date.now();
    
    try {
      const prompt = translatePrompt(text, targetLanguage);
      const provider = getAIProvider();
      
      const result = await this.executeWithRetry(() => 
        provider.generateContent(prompt)
      );

      await this.recordUsage(userId, AIFeature.TRANSLATE, AIRequestStatus.SUCCESS, startTime);
      
      eventEmitter.emitEvent('AI_TRANSLATION_CREATED', this.createEvent('AI_TRANSLATION_CREATED', {
        userId, originalText: text, translatedText: result, targetLanguage
      }));

      return result;
    } catch (error: any) {
      await this.recordUsage(userId, AIFeature.TRANSLATE, AIRequestStatus.FAILED, startTime, error.message);
      this.emitFailureEvent(userId, AIFeature.TRANSLATE, error.message);
      throw error;
    }
  }

  async fixGrammar(userId: string, text: string) {
    await this.checkPreferences(userId, 'allowRewrite');
    const startTime = Date.now();
    
    try {
      const prompt = grammarPrompt(text);
      const provider = getAIProvider();
      
      const result = await this.executeWithRetry(() => 
        provider.generateContent(prompt)
      );

      await this.recordUsage(userId, AIFeature.GRAMMAR, AIRequestStatus.SUCCESS, startTime);
      
      eventEmitter.emitEvent('AI_GRAMMAR_FIXED', this.createEvent('AI_GRAMMAR_FIXED', {
        userId, originalText: text, correctedText: result
      }));

      return result;
    } catch (error: any) {
      await this.recordUsage(userId, AIFeature.GRAMMAR, AIRequestStatus.FAILED, startTime, error.message);
      this.emitFailureEvent(userId, AIFeature.GRAMMAR, error.message);
      throw error;
    }
  }

  async runModeration(userId: string, text: string) {
    await this.checkPreferences(userId, 'allowModeration');
    const startTime = Date.now();
    
    try {
      const prompt = moderationPrompt(text);
      const provider = getAIProvider();
      
      const result = await this.executeWithRetry(() => 
        provider.generateStructuredContent<ModerationResult>(prompt)
      );

      await this.recordUsage(userId, AIFeature.MODERATION, AIRequestStatus.SUCCESS, startTime);
      
      eventEmitter.emitEvent('AI_MODERATION_COMPLETED', this.createEvent('AI_MODERATION_COMPLETED', {
        userId, targetText: text, ...result
      }));

      return result;
    } catch (error: any) {
      await this.recordUsage(userId, AIFeature.MODERATION, AIRequestStatus.FAILED, startTime, error.message);
      this.emitFailureEvent(userId, AIFeature.MODERATION, error.message);
      throw error;
    }
  }

  async generateGroupDescription(userId: string, name: string, purpose: string) {
    await this.checkPreferences(userId, 'allowRewrite');
    const startTime = Date.now();
    
    try {
      const prompt = groupDescriptionPrompt(name, purpose);
      const provider = getAIProvider();
      
      const result = await this.executeWithRetry(() => 
        provider.generateContent(prompt)
      );

      await this.recordUsage(userId, AIFeature.GROUP_DESCRIPTION, AIRequestStatus.SUCCESS, startTime);
      
      eventEmitter.emitEvent('AI_GROUP_DESCRIPTION_CREATED', this.createEvent('AI_GROUP_DESCRIPTION_CREATED', {
        userId, groupName: name, purpose, description: result
      }));

      return result;
    } catch (error: any) {
      await this.recordUsage(userId, AIFeature.GROUP_DESCRIPTION, AIRequestStatus.FAILED, startTime, error.message);
      this.emitFailureEvent(userId, AIFeature.GROUP_DESCRIPTION, error.message);
      throw error;
    }
  }

  async generateGroupRules(userId: string, name: string, purpose: string) {
    await this.checkPreferences(userId, 'allowRewrite');
    const startTime = Date.now();
    
    try {
      const prompt = groupRulesPrompt(name, purpose);
      const provider = getAIProvider();
      
      const result = await this.executeWithRetry(() => 
        provider.generateStructuredContent<string[]>(prompt)
      );

      await this.recordUsage(userId, AIFeature.GROUP_RULES, AIRequestStatus.SUCCESS, startTime);
      
      eventEmitter.emitEvent('AI_GROUP_RULES_CREATED', this.createEvent('AI_GROUP_RULES_CREATED', {
        userId, groupName: name, rules: result
      }));

      return result;
    } catch (error: any) {
      await this.recordUsage(userId, AIFeature.GROUP_RULES, AIRequestStatus.FAILED, startTime, error.message);
      this.emitFailureEvent(userId, AIFeature.GROUP_RULES, error.message);
      throw error;
    }
  }

  getCapabilities() {
    return {
      summaries: true,
      smartReply: true,
      rewrite: true,
      translate: true,
      grammar: true,
      moderation: true,
      groupDescription: true,
      groupRules: true
    };
  }

  getUsage(userId: string, cursor?: string, limit?: number) {
    return aiRepository.getUsage(userId, cursor, limit);
  }

  getPreferences(userId: string) {
    return aiRepository.getOrCreatePreferences(userId);
  }

  updatePreferences(userId: string, data: any) {
    return aiRepository.updatePreferences(userId, data);
  }
}

export const aiService = new AIService();
