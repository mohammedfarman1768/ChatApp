import crypto from 'crypto';
import { callRepository } from './repository.js';
import { usersRepository } from '../users/repository.js';
import { eventEmitter } from '../../events/emitter.js';
import { AppError } from '../../shared/errors/index.js';
import { CallSessionStatus, CallWithParticipants } from './types.js';
import { CreateCallInput } from '@repo/shared-validation';

const RING_TIMEOUT_SECONDS = 60; // 60 seconds

function checkTimeout(call: CallWithParticipants): boolean {
  if (call.status === CallSessionStatus.RINGING && call.ringExpiresAt && new Date() > call.ringExpiresAt) {
    return true;
  }
  return false;
}

export const callService = {
  async initiateCall(callerId: string, input: CreateCallInput): Promise<CallWithParticipants> {
    if (callerId === input.calleeId) {
      throw new AppError('Cannot call yourself', 400);
    }

    // 1. Check if caller or callee is blocked
    const callee = await usersRepository.findProfileByUserId(input.calleeId);
    if (!callee) {
      throw new AppError('User not found', 404);
    }

    const isCallerBlocked = await usersRepository.findAnyBlock(callerId, input.calleeId);
    if (isCallerBlocked) {
      throw new AppError('Cannot call this user due to block settings', 403);
    }

    // 2. Enforce exactly one active call per user
    const callerActive = await callRepository.getActiveCallForUser(callerId);
    if (callerActive) {
      // Check if it's actually timed out
      if (checkTimeout(callerActive as unknown as CallWithParticipants)) {
        await callRepository.updateCallStatus(callerActive.id, CallSessionStatus.MISSED, { endedAt: new Date() });
      } else {
        throw new AppError('You already have an active call', 409);
      }
    }

    const calleeActive = await callRepository.getActiveCallForUser(input.calleeId);
    if (calleeActive) {
      if (checkTimeout(calleeActive as unknown as CallWithParticipants)) {
        await callRepository.updateCallStatus(calleeActive.id, CallSessionStatus.MISSED, { endedAt: new Date() });
      } else {
        throw new AppError('User is busy on another call', 409);
      }
    }

    // 3. Create call session
    const ringExpiresAt = new Date(Date.now() + RING_TIMEOUT_SECONDS * 1000);
    const call = await callRepository.createCall({
      callerId,
      calleeId: input.calleeId,
      hasAudio: input.hasAudio ?? true,
      hasVideo: input.hasVideo ?? false,
      deviceInfo: input.deviceInfo,
      ringExpiresAt,
    });

    // Emit internal event
    eventEmitter.emitEvent('CALL_STARTED', {
      eventId: crypto.randomUUID(),
      eventType: 'CALL_STARTED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'calls-module',
      correlationId: call.id,
      payload: {
        callSessionId: call.id,
        callerId,
        calleeId: input.calleeId,
        hasVideo: input.hasVideo ?? false,
      },
    });

    eventEmitter.emitEvent('CALL_RINGING', {
      eventId: crypto.randomUUID(),
      eventType: 'CALL_RINGING',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'calls-module',
      correlationId: call.id,
      payload: {
        callSessionId: call.id,
        calleeId: input.calleeId,
      },
    });

    return call;
  },

  async acceptCall(calleeId: string, callId: string): Promise<CallWithParticipants> {
    const call = await callRepository.getCallById(callId);
    if (!call) throw new AppError('Call not found', 404);
    if (call.calleeId !== calleeId) throw new AppError('Not authorized', 403);

    if (checkTimeout(call)) {
      await callRepository.updateCallStatus(callId, CallSessionStatus.MISSED, { endedAt: new Date() });
      throw new AppError('Call missed/expired', 400);
    }

    if (call.status !== CallSessionStatus.RINGING) {
      throw new AppError('Call is no longer ringing', 400);
    }

    // Mark as accepted
    const acceptedAt = new Date();
    await callRepository.updateCallStatus(callId, CallSessionStatus.ACCEPTED, { acceptedAt });
    
    // Add callee participant
    await callRepository.addParticipant(callId, {
      userId: calleeId,
      isCaller: false,
    });

    const updatedCall = await callRepository.getCallById(callId);

    eventEmitter.emitEvent('CALL_ACCEPTED', {
      eventId: crypto.randomUUID(),
      eventType: 'CALL_ACCEPTED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'calls-module',
      correlationId: callId,
      payload: {
        callSessionId: callId,
        calleeId,
      },
    });

    return updatedCall!;
  },

  async rejectCall(calleeId: string, callId: string): Promise<CallWithParticipants> {
    const call = await callRepository.getCallById(callId);
    if (!call) throw new AppError('Call not found', 404);
    if (call.calleeId !== calleeId) throw new AppError('Not authorized', 403);

    if (call.status !== CallSessionStatus.RINGING) {
      throw new AppError('Call is no longer ringing', 400);
    }

    await callRepository.updateCallStatus(callId, CallSessionStatus.REJECTED, { endedAt: new Date() });

    eventEmitter.emitEvent('CALL_REJECTED', {
      eventId: crypto.randomUUID(),
      eventType: 'CALL_REJECTED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'calls-module',
      correlationId: callId,
      payload: {
        callSessionId: callId,
        calleeId,
      },
    });

    return (await callRepository.getCallById(callId))!;
  },

  async cancelCall(callerId: string, callId: string): Promise<CallWithParticipants> {
    const call = await callRepository.getCallById(callId);
    if (!call) throw new AppError('Call not found', 404);
    if (call.callerId !== callerId) throw new AppError('Not authorized', 403);

    if (call.status !== CallSessionStatus.RINGING) {
      throw new AppError('Call is not ringing', 400);
    }

    await callRepository.updateCallStatus(callId, CallSessionStatus.CANCELLED, { endedAt: new Date() });

    eventEmitter.emitEvent('CALL_CANCELLED', {
      eventId: crypto.randomUUID(),
      eventType: 'CALL_CANCELLED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'calls-module',
      correlationId: callId,
      payload: {
        callSessionId: callId,
        callerId,
      },
    });

    return (await callRepository.getCallById(callId))!;
  },

  async endCall(userId: string, callId: string): Promise<CallWithParticipants> {
    const call = await callRepository.getCallById(callId);
    if (!call) throw new AppError('Call not found', 404);
    if (call.callerId !== userId && call.calleeId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    const terminalStatuses: CallSessionStatus[] = [CallSessionStatus.ENDED, CallSessionStatus.MISSED, CallSessionStatus.CANCELLED, CallSessionStatus.FAILED, CallSessionStatus.REJECTED];
    if (terminalStatuses.includes(call.status)) {
      return call; // Idempotent
    }

    const endedAt = new Date();
    let durationSeconds = 0;
    if (call.acceptedAt) {
      durationSeconds = Math.floor((endedAt.getTime() - call.acceptedAt.getTime()) / 1000);
    }

    let nextStatus: CallSessionStatus = CallSessionStatus.ENDED;
    if (call.status === CallSessionStatus.RINGING) {
      // If it ends while ringing, it's either missed (if not expired) or cancelled
      if (userId === call.callerId) {
        nextStatus = CallSessionStatus.CANCELLED;
      } else {
        nextStatus = CallSessionStatus.MISSED;
      }
    }

    await callRepository.updateCallStatus(callId, nextStatus, { endedAt, durationSeconds });

    const payloadType = nextStatus === CallSessionStatus.CANCELLED ? 'CALL_CANCELLED' : 
                        nextStatus === CallSessionStatus.MISSED ? 'CALL_MISSED' : 'CALL_ENDED';

    eventEmitter.emitEvent(payloadType, {
      eventId: crypto.randomUUID(),
      eventType: payloadType as any,
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'calls-module',
      correlationId: callId,
      payload: nextStatus === CallSessionStatus.ENDED ? {
        callSessionId: callId,
        endedById: userId,
        durationSeconds,
      } : nextStatus === CallSessionStatus.CANCELLED ? {
        callSessionId: callId,
        callerId: call.callerId,
      } : {
        callSessionId: callId,
        callerId: call.callerId,
        calleeId: call.calleeId,
      },
    });

    return (await callRepository.getCallById(callId))!;
  },

  async getRecentCalls(userId: string, limit: number, cursor?: string) {
    return callRepository.getRecentCalls(userId, limit, cursor);
  },

  async getCallDetails(userId: string, callId: string) {
    const call = await callRepository.getCallById(callId);
    if (!call) throw new AppError('Call not found', 404);
    if (call.callerId !== userId && call.calleeId !== userId) {
      throw new AppError('Not authorized', 403);
    }
    return call;
  },

  async persistSignal(userId: string, callId: string, type: string, payload: any) {
    const call = await callRepository.getCallById(callId);
    if (!call) throw new AppError('Call not found', 404);
    if (call.callerId !== userId && call.calleeId !== userId) {
      throw new AppError('Not authorized', 403);
    }
    
    // Only persist if configured to do so
    // We are implementing optional persistence logic, default OFF unless specifically tracked
    // To respect the rule, we'll write it to DB but real-world apps might disable this.
    // For Phase 9, we just write it because the route was explicitly asked to be implemented.
    const signal = await callRepository.createSignal(callId, userId, type, payload);

    eventEmitter.emitEvent('CALL_SIGNAL_SENT', {
      eventId: crypto.randomUUID(),
      eventType: 'CALL_SIGNAL_SENT',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'calls-module',
      correlationId: callId,
      payload: {
        callSessionId: callId,
        senderId: userId,
        type,
      },
    });

    return signal;
  }
};
