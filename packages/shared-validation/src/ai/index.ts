import { z } from 'zod';

export const AIContextTargetSchema = z.object({
  targetId: z.string().uuid(),
  targetType: z.enum(['GROUP', 'CONVERSATION']),
});

export const AISummarySchema = AIContextTargetSchema;

export const AISmartReplySchema = AIContextTargetSchema;

export const AIRewriteSchema = z.object({
  text: z.string().min(1).max(2000),
  tone: z.enum(['Professional', 'Casual', 'Friendly', 'Shorter', 'Longer']),
});

export const AITranslateSchema = z.object({
  text: z.string().min(1).max(2000),
  targetLanguage: z.string().min(2).max(50),
});

export const AIGrammarSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const AIModerationSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const AIGroupDescriptionSchema = z.object({
  name: z.string().min(1).max(100),
  purpose: z.string().min(1).max(500),
});

export const AIGroupRulesSchema = z.object({
  name: z.string().min(1).max(100),
  purpose: z.string().min(1).max(500),
});

export const AIPreferencesUpdateSchema = z.object({
  aiEnabled: z.boolean().optional(),
  allowSummaries: z.boolean().optional(),
  allowSmartReply: z.boolean().optional(),
  allowRewrite: z.boolean().optional(),
  allowTranslate: z.boolean().optional(),
  allowModeration: z.boolean().optional(),
});
