/**
 * Group Calls Service
 * 
 * Manages the lifecycle and business logic of group voice and video calls.
 * Enforces a 60-second ring timeout, a strict 25 participant limit, and allows only one active call per group.
 * Role restrictions apply for cancelling or ending calls (Creator, Owner, Admin, Moderator).
 * Note: Extreme concurrency during creation could bypass the 1-active-call limit until distributed locking (Phase 12) is implemented.
 */
import crypto from 'crypto';
import { groupCallRepository } from './repository.js';
import { groupRepository } from '../groups/repository.js';
import { eventEmitter } from '../../events/emitter.js';
import { AppError } from '../../shared/errors/index.js';
import { GroupCallSessionStatus, GroupCallWithParticipants } from './types.js';
import { CreateGroupCallInput, GroupCallJoinInput } from '@repo/shared-validation';

const MAX_PARTICIPANTS = 25;

async function checkTimeout<T extends { id: string; status: GroupCallSessionStatus; ringExpiresAt: Date | null; groupId: string }>(call: T | null): Promise<T | null> {
  if (!call || call.status !== GroupCallSessionStatus.RINGING) return call;
  if (!call.ringExpiresAt || call.ringExpiresAt.getTime() > Date.now()) return call;

  // It's expired and ringing. Transition to MISSED.
  const updated = await groupCallRepository.updateCallStatus(call.id, GroupCallSessionStatus.MISSED, { endedAt: new Date() });
  
  eventEmitter.emitEvent('GROUP_CALL_MISSED', {
    eventId: crypto.randomUUID(),
    eventType: 'GROUP_CALL_MISSED',
    timestamp: new Date().toISOString(),
    version: 1,
    source: 'group-calls-module',
    correlationId: call.id,
    payload: {
      groupCallSessionId: call.id,
      groupId: call.groupId,
    },
  });

  return { ...call, ...updated };
}

export const groupCallService = {
  async initiateCall(userId: string, input: CreateGroupCallInput): Promise<GroupCallWithParticipants> {
    // 1. Verify membership and ban
    const member = await groupRepository.getMember(input.groupId, userId);
    if (!member) {
      throw new AppError('Not a member of this group', 403);
    }
    
    const ban = await groupRepository.getBan(input.groupId, userId);
    if (ban) {
      throw new AppError('You are banned from this group', 403);
    }

    const group = await groupRepository.getGroupById(input.groupId);
    if (!group) throw new AppError('Group not found', 404);
    if (!group.settings?.allowGroupCalls) {
      throw new AppError('Group calls are disabled for this group', 403);
    }

    // 2. Enforce exactly one active call per group
    let activeCall = await groupCallRepository.getActiveCallForGroup(input.groupId);
    activeCall = await checkTimeout(activeCall);
    if (activeCall && (activeCall.status === GroupCallSessionStatus.ACTIVE || activeCall.status === GroupCallSessionStatus.RINGING)) {
      throw new AppError('An active call already exists in this group', 409);
    }

    // 3. Create call session
    const call = await groupCallRepository.createCall({
      groupId: input.groupId,
      startedBy: userId,
      hasAudio: input.hasAudio ?? true,
      hasVideo: input.hasVideo ?? false,
      deviceInfo: input.deviceInfo,
      ringExpiresAt: new Date(Date.now() + 60 * 1000)
    });

    // 4. Emit events
    eventEmitter.emitEvent('GROUP_CALL_STARTED', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_CALL_STARTED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-calls-module',
      correlationId: call.id,
      payload: {
        groupCallSessionId: call.id,
        groupId: input.groupId,
        startedBy: userId,
      },
    });

    eventEmitter.emitEvent('GROUP_CALL_RINGING', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_CALL_RINGING',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-calls-module',
      correlationId: call.id,
      payload: {
        groupCallSessionId: call.id,
        groupId: input.groupId,
      },
    });

    return call;
  },

  async joinCall(userId: string, input: GroupCallJoinInput): Promise<GroupCallWithParticipants> {
    const member = await groupRepository.getMember(input.groupId, userId);
    if (!member) throw new AppError('Not a member of this group', 403);
    const ban = await groupRepository.getBan(input.groupId, userId);
    if (ban) throw new AppError('You are banned from this group', 403);

    let call = await groupCallRepository.getCallById(input.callId);
    call = await checkTimeout(call);
    
    if (!call) throw new AppError('Call not found', 404);
    if (call.groupId !== input.groupId) throw new AppError('Group mismatch', 400);

    if (call.status !== GroupCallSessionStatus.RINGING && call.status !== GroupCallSessionStatus.ACTIVE) {
      throw new AppError('Call is not active', 400);
    }

    const participantCount = await groupCallRepository.getActiveParticipantsCount(input.callId);
    
    // Check if already in call
    let participant = await groupCallRepository.getParticipant(input.callId, userId);
    if (!participant) {
      if (participantCount >= MAX_PARTICIPANTS) {
        throw new AppError(`Participant limit reached (${MAX_PARTICIPANTS})`, 403);
      }
      participant = await groupCallRepository.addParticipant(input.callId, {
        userId,
        hasAudio: input.hasAudio,
        hasVideo: input.hasVideo,
        deviceInfo: input.deviceInfo
      });

      // Transition to ACTIVE if it was ringing
      if (call.status === GroupCallSessionStatus.RINGING) {
        await groupCallRepository.updateCallStatus(input.callId, GroupCallSessionStatus.ACTIVE);
      }
    }

    const updatedCall = await groupCallRepository.getCallById(input.callId);

    eventEmitter.emitEvent('GROUP_CALL_JOINED', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_CALL_JOINED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-calls-module',
      correlationId: input.callId,
      payload: {
        groupCallSessionId: input.callId,
        groupId: input.groupId,
        userId,
      },
    });

    return updatedCall!;
  },

  async leaveCall(userId: string, groupId: string, callId: string): Promise<GroupCallWithParticipants> {
    const call = await groupCallRepository.getCallById(callId);
    if (!call) throw new AppError('Call not found', 404);
    if (call.groupId !== groupId) throw new AppError('Group mismatch', 400);

    const participant = await groupCallRepository.getParticipant(callId, userId);
    if (!participant) {
      return call; // Idempotent
    }

    await groupCallRepository.markParticipantLeft(participant.id);

    eventEmitter.emitEvent('GROUP_CALL_LEFT', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_CALL_LEFT',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-calls-module',
      correlationId: callId,
      payload: {
        groupCallSessionId: callId,
        groupId,
        userId,
      },
    });

    // Check if call should end
    const activeCount = await groupCallRepository.getActiveParticipantsCount(callId);
    if (activeCount === 0 && (call.status === GroupCallSessionStatus.ACTIVE || call.status === GroupCallSessionStatus.RINGING)) {
      // Auto-end the call
      await this.endCallInternal(userId, groupId, callId, call, true);
    }

    return (await groupCallRepository.getCallById(callId))!;
  },

  async endCall(userId: string, groupId: string, callId: string): Promise<GroupCallWithParticipants> {
    const call = await groupCallRepository.getCallById(callId);
    if (!call) throw new AppError('Call not found', 404);
    if (call.groupId !== groupId) throw new AppError('Group mismatch', 400);

    // Verify roles: creator, admin, moderator
    const member = await groupRepository.getMember(groupId, userId);
    if (!member) throw new AppError('Not a member', 403);
    
    const isCreator = call.startedBy === userId;
    const isMod = member.role === 'ADMIN' || member.role === 'OWNER' || member.role === 'MODERATOR';
    if (!isCreator && !isMod) {
      throw new AppError('Not authorized to end this call', 403);
    }

    return this.endCallInternal(userId, groupId, callId, call, false);
  },

  async cancelCall(userId: string, groupId: string, callId: string): Promise<GroupCallWithParticipants> {
    const call = await groupCallRepository.getCallById(callId);
    if (!call) throw new AppError('Call not found', 404);
    if (call.groupId !== groupId) throw new AppError('Group mismatch', 400);

    const member = await groupRepository.getMember(groupId, userId);
    if (!member) throw new AppError('Not a member', 403);
    
    const isCreator = call.startedBy === userId;
    const isMod = member.role === 'ADMIN' || member.role === 'OWNER' || member.role === 'MODERATOR';
    if (!isCreator && !isMod) {
      throw new AppError('Not authorized to cancel this call', 403);
    }

    if (call.status !== GroupCallSessionStatus.RINGING) {
      throw new AppError('Call is no longer ringing', 400);
    }

    await groupCallRepository.updateCallStatus(callId, GroupCallSessionStatus.CANCELLED, { endedAt: new Date() });

    eventEmitter.emitEvent('GROUP_CALL_CANCELLED', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_CALL_CANCELLED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-calls-module',
      correlationId: callId,
      payload: {
        groupCallSessionId: callId,
        groupId,
        cancelledById: userId,
      },
    });

    return (await groupCallRepository.getCallById(callId))!;
  },

  async endCallInternal(userId: string, groupId: string, callId: string, call: GroupCallWithParticipants, autoEnd: boolean) {
    const terminalStatuses: GroupCallSessionStatus[] = [
      GroupCallSessionStatus.ENDED, 
      GroupCallSessionStatus.MISSED, 
      GroupCallSessionStatus.CANCELLED, 
      GroupCallSessionStatus.FAILED
    ];
    
    if (terminalStatuses.includes(call.status)) {
      return call;
    }

    const endedAt = new Date();
    let durationSeconds = 0;
    if (call.startedAt && call.status === GroupCallSessionStatus.ACTIVE) {
      durationSeconds = Math.floor((endedAt.getTime() - call.startedAt.getTime()) / 1000);
    }

    let nextStatus: GroupCallSessionStatus = GroupCallSessionStatus.ENDED;
    if (call.status === GroupCallSessionStatus.RINGING && autoEnd) {
      nextStatus = GroupCallSessionStatus.MISSED;
    } else if (call.status === GroupCallSessionStatus.RINGING && !autoEnd) {
      nextStatus = GroupCallSessionStatus.CANCELLED;
    }

    await groupCallRepository.updateCallStatus(callId, nextStatus, { endedAt, durationSeconds });

    const payloadType = nextStatus === GroupCallSessionStatus.CANCELLED ? 'GROUP_CALL_CANCELLED' : 
                        nextStatus === GroupCallSessionStatus.MISSED ? 'GROUP_CALL_MISSED' : 'GROUP_CALL_ENDED';

    eventEmitter.emitEvent(payloadType, {
      eventId: crypto.randomUUID(),
      eventType: payloadType as any,
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-calls-module',
      correlationId: callId,
      payload: nextStatus === GroupCallSessionStatus.ENDED ? {
        groupCallSessionId: callId,
        groupId,
        endedById: userId,
        durationSeconds,
      } : nextStatus === GroupCallSessionStatus.CANCELLED ? {
        groupCallSessionId: callId,
        groupId,
        cancelledById: userId,
      } : {
        groupCallSessionId: callId,
        groupId,
      },
    });

    return (await groupCallRepository.getCallById(callId))!;
  },

  async getRecentCalls(userId: string, groupId: string, limit: number, cursor?: string) {
    const member = await groupRepository.getMember(groupId, userId);
    if (!member) throw new AppError('Not a member', 403);

    return groupCallRepository.getRecentCalls(groupId, limit, cursor);
  },

  async getActiveCall(userId: string, groupId: string) {
    const member = await groupRepository.getMember(groupId, userId);
    if (!member) throw new AppError('Not a member', 403);

    const call = await groupCallRepository.getActiveCallForGroup(groupId);
    const checkedCall = await checkTimeout(call);
    
    if (checkedCall && (checkedCall.status === GroupCallSessionStatus.ACTIVE || checkedCall.status === GroupCallSessionStatus.RINGING)) {
      return checkedCall;
    }
    return null;
  },

  async getCallDetails(userId: string, groupId: string, callId: string) {
    const member = await groupRepository.getMember(groupId, userId);
    if (!member) throw new AppError('Not a member', 403);

    const ban = await groupRepository.getBan(groupId, userId);
    if (ban) throw new AppError('You are banned from this group', 403);

    let call = await groupCallRepository.getCallById(callId);
    call = await checkTimeout(call);
    
    if (!call) throw new AppError('Call not found', 404);
    if (call.groupId !== groupId) throw new AppError('Group mismatch', 400);

    return call;
  },

  async persistSignal(userId: string, groupId: string, callId: string, type: string, payload: any) {
    const call = await groupCallRepository.getCallById(callId);
    if (!call) throw new AppError('Call not found', 404);
    if (call.groupId !== groupId) throw new AppError('Group mismatch', 400);

    const participant = await groupCallRepository.getParticipant(callId, userId);
    if (!participant) {
      throw new AppError('Not part of this call', 403);
    }
    
    const signal = await groupCallRepository.createSignal(callId, userId, type, payload);

    eventEmitter.emitEvent('GROUP_CALL_SIGNAL_SENT', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_CALL_SIGNAL_SENT',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'group-calls-module',
      correlationId: callId,
      payload: {
        groupCallSessionId: callId,
        groupId,
        senderId: userId,
        type,
      },
    });

    return signal;
  }
};
