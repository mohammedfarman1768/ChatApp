import { prisma } from '../../prisma/client.js';
import { AIUsageRecord } from './types.js';
import { AIUserPreference } from '@prisma/client';

export class AIRepository {
  async logUsage(record: AIUsageRecord) {
    return prisma.aIUsageLog.create({
      data: {
        userId: record.userId,
        feature: record.feature,
        provider: record.provider,
        status: record.status,
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        durationMs: record.durationMs,
        errorMessage: record.errorMessage,
      }
    });
  }

  async getUsage(userId: string, cursor?: string, limit: number = 20) {
    return prisma.aIUsageLog.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPreferences(userId: string) {
    return prisma.aIUserPreference.findUnique({
      where: { userId }
    });
  }

  async getOrCreatePreferences(userId: string) {
    const prefs = await this.getPreferences(userId);
    if (prefs) return prefs;
    
    return prisma.aIUserPreference.create({
      data: { userId }
    });
  }

  async updatePreferences(userId: string, data: Partial<AIUserPreference>) {
    return prisma.aIUserPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data
    });
  }
}

export const aiRepository = new AIRepository();
