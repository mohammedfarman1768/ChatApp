import { prisma } from '../../prisma/client.js';
import { GroupCallSession, GroupCallParticipant, GroupCallWithParticipants, GroupCallSessionStatus, GroupCallSignal } from './types.js';

export const groupCallRepository = {
  async createCall(
    data: {
      groupId: string;
      startedBy: string;
      hasAudio: boolean;
      hasVideo: boolean;
      deviceInfo?: string;
      ringExpiresAt?: Date;
    }
  ): Promise<GroupCallWithParticipants> {
    return prisma.groupCallSession.create({
      data: {
        groupId: data.groupId,
        startedBy: data.startedBy,
        status: GroupCallSessionStatus.RINGING,
        ringExpiresAt: data.ringExpiresAt,
        participants: {
          create: [
            {
              userId: data.startedBy,
              hasAudio: data.hasAudio,
              hasVideo: data.hasVideo,
              deviceInfo: data.deviceInfo,
            }
          ]
        }
      },
      include: {
        participants: true
      }
    });
  },

  async getCallById(callId: string): Promise<GroupCallWithParticipants | null> {
    return prisma.groupCallSession.findUnique({
      where: { id: callId },
      include: {
        participants: true
      }
    });
  },

  async getActiveCallForGroup(groupId: string): Promise<GroupCallSession | null> {
    return prisma.groupCallSession.findFirst({
      where: {
        groupId,
        status: {
          in: [GroupCallSessionStatus.RINGING, GroupCallSessionStatus.ACTIVE]
        },
        deletedAt: null
      }
    });
  },

  async updateCallStatus(
    callId: string,
    status: GroupCallSessionStatus,
    updates?: { endedAt?: Date; durationSeconds?: number }
  ): Promise<GroupCallSession> {
    return prisma.groupCallSession.update({
      where: { id: callId },
      data: {
        status,
        ...updates
      }
    });
  },

  async addParticipant(
    callId: string,
    data: {
      userId: string;
      hasAudio?: boolean;
      hasVideo?: boolean;
      deviceInfo?: string;
    }
  ): Promise<GroupCallParticipant> {
    return prisma.groupCallParticipant.create({
      data: {
        groupCallSessionId: callId,
        userId: data.userId,
        hasAudio: data.hasAudio ?? true,
        hasVideo: data.hasVideo ?? false,
        deviceInfo: data.deviceInfo,
      }
    });
  },

  async getParticipant(callId: string, userId: string): Promise<GroupCallParticipant | null> {
    return prisma.groupCallParticipant.findFirst({
      where: {
        groupCallSessionId: callId,
        userId,
        leftAt: null
      }
    });
  },

  async markParticipantLeft(participantId: string): Promise<GroupCallParticipant> {
    return prisma.groupCallParticipant.update({
      where: { id: participantId },
      data: { leftAt: new Date() }
    });
  },

  async getRecentCalls(groupId: string, limit: number, cursor?: string) {
    const take = limit + 1;
    const calls = await prisma.groupCallSession.findMany({
      where: {
        groupId,
        deletedAt: null
      },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { startedAt: 'desc' },
      include: {
        participants: true
      }
    });

    let nextCursor: string | undefined;
    if (calls.length > limit) {
      const lastItem = calls.pop();
      nextCursor = lastItem?.id;
    }

    return { calls, nextCursor };
  },

  async getActiveParticipantsCount(callId: string): Promise<number> {
    return prisma.groupCallParticipant.count({
      where: {
        groupCallSessionId: callId,
        leftAt: null
      }
    });
  },

  async createSignal(
    callId: string,
    senderId: string,
    type: string,
    payload: any
  ): Promise<GroupCallSignal> {
    return prisma.groupCallSignal.create({
      data: {
        groupCallSessionId: callId,
        senderId,
        type,
        payload
      }
    });
  }
};
