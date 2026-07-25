import { prisma } from '../../prisma/client.js';
import { CallSession, CallParticipant, CallWithParticipants, CallSessionStatus, CallSignal } from './types.js';

export const callRepository = {
  async createCall(
    data: {
      callerId: string;
      calleeId: string;
      hasAudio: boolean;
      hasVideo: boolean;
      deviceInfo?: string;
      ringExpiresAt: Date;
    }
  ): Promise<CallWithParticipants> {
    return prisma.callSession.create({
      data: {
        callerId: data.callerId,
        calleeId: data.calleeId,
        status: CallSessionStatus.RINGING,
        ringExpiresAt: data.ringExpiresAt,
        participants: {
          create: [
            {
              userId: data.callerId,
              isCaller: true,
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

  async getCallById(callId: string): Promise<CallWithParticipants | null> {
    return prisma.callSession.findUnique({
      where: { id: callId },
      include: {
        participants: true
      }
    });
  },

  async updateCallStatus(
    callId: string, 
    status: CallSessionStatus, 
    updates?: { acceptedAt?: Date; endedAt?: Date; durationSeconds?: number }
  ): Promise<CallSession> {
    return prisma.callSession.update({
      where: { id: callId },
      data: {
        status,
        ...updates
      }
    });
  },

  async getActiveCallForUser(userId: string): Promise<CallSession | null> {
    return prisma.callSession.findFirst({
      where: {
        OR: [
          { callerId: userId },
          { calleeId: userId }
        ],
        status: {
          in: [CallSessionStatus.RINGING, CallSessionStatus.ACCEPTED, CallSessionStatus.ONGOING]
        }
      }
    });
  },

  async addParticipant(
    callId: string,
    data: {
      userId: string;
      isCaller?: boolean;
      hasAudio?: boolean;
      hasVideo?: boolean;
    }
  ): Promise<CallParticipant> {
    return prisma.callParticipant.create({
      data: {
        callSessionId: callId,
        userId: data.userId,
        isCaller: data.isCaller ?? false,
        hasAudio: data.hasAudio ?? true,
        hasVideo: data.hasVideo ?? false,
      }
    });
  },

  async getRecentCalls(userId: string, limit: number, cursor?: string): Promise<CallSession[]> {
    return prisma.callSession.findMany({
      where: {
        OR: [
          { callerId: userId },
          { calleeId: userId }
        ],
        deletedAt: null
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { startedAt: 'desc' },
      include: {
        participants: true
      }
    });
  },

  async getActiveRingingCalls(): Promise<CallSession[]> {
    return prisma.callSession.findMany({
      where: {
        status: CallSessionStatus.RINGING,
        ringExpiresAt: {
          lt: new Date()
        }
      }
    });
  },

  async createSignal(
    callId: string,
    senderId: string,
    type: string,
    payload: any
  ): Promise<CallSignal> {
    return prisma.callSignal.create({
      data: {
        callSessionId: callId,
        senderId,
        type,
        payload
      }
    });
  }
};
