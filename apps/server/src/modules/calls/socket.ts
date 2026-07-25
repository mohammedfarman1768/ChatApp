import { Server, Socket } from 'socket.io';
import { callService } from './service.js';
import { eventEmitter } from '../../events/emitter.js';
import { 
  CallStartedPayload,
  CallRingingPayload,
  CallAcceptedPayload,
  CallRejectedPayload,
  CallEndedPayload,
  CallMissedPayload,
  CallCancelledPayload,
  CallSignalSentPayload,
  AppEvent
} from '../../events/types.js';
import { callRepository } from './repository.js';

export function initCallSocket(io: Server) {
  // Listen to internal events and forward them via Socket.IO
  eventEmitter.onEvent('CALL_STARTED', (event: AppEvent) => {
    const payload = event.payload as CallStartedPayload;
    io.to(`user:${payload.calleeId}`).emit('call:incoming', {
      callId: payload.callSessionId,
      callerId: payload.callerId,
      hasVideo: payload.hasVideo
    });
  });

  eventEmitter.onEvent('CALL_RINGING', (event: AppEvent) => {
    const payload = event.payload as CallRingingPayload;
    // We can emit back to caller that it is ringing
    // But caller is not directly in the payload, we'd need it.
    // For now, it's just an event. If we need to send call:ringing, we look up caller.
    callRepository.getCallById(payload.callSessionId).then(call => {
      if (call) {
        io.to(`user:${call.callerId}`).emit('call:ringing', {
          callId: payload.callSessionId,
          calleeId: payload.calleeId
        });
      }
    });
  });

  eventEmitter.onEvent('CALL_ACCEPTED', (event: AppEvent) => {
    const payload = event.payload as CallAcceptedPayload;
    callRepository.getCallById(payload.callSessionId).then(call => {
      if (call) {
        io.to(`user:${call.callerId}`).emit('call:accepted', {
          callId: payload.callSessionId,
          calleeId: payload.calleeId
        });
      }
    });
  });

  eventEmitter.onEvent('CALL_REJECTED', (event: AppEvent) => {
    const payload = event.payload as CallRejectedPayload;
    callRepository.getCallById(payload.callSessionId).then(call => {
      if (call) {
        io.to(`user:${call.callerId}`).emit('call:rejected', {
          callId: payload.callSessionId,
          calleeId: payload.calleeId
        });
      }
    });
  });

  eventEmitter.onEvent('CALL_CANCELLED', (event: AppEvent) => {
    const payload = event.payload as CallCancelledPayload;
    callRepository.getCallById(payload.callSessionId).then(call => {
      if (call) {
        io.to(`user:${call.calleeId}`).emit('call:cancelled', {
          callId: payload.callSessionId,
          callerId: payload.callerId
        });
      }
    });
  });

  eventEmitter.onEvent('CALL_MISSED', (event: AppEvent) => {
    const payload = event.payload as CallMissedPayload;
    io.to(`user:${payload.callerId}`).emit('call:missed', {
      callId: payload.callSessionId,
      calleeId: payload.calleeId
    });
    io.to(`user:${payload.calleeId}`).emit('call:missed', {
      callId: payload.callSessionId,
      callerId: payload.callerId
    });
  });

  eventEmitter.onEvent('CALL_ENDED', (event: AppEvent) => {
    const payload = event.payload as CallEndedPayload;
    callRepository.getCallById(payload.callSessionId).then(call => {
      if (call) {
        const otherUserId = payload.endedById === call.callerId ? call.calleeId : call.callerId;
        io.to(`user:${otherUserId}`).emit('call:ended', {
          callId: payload.callSessionId,
          endedById: payload.endedById,
          durationSeconds: payload.durationSeconds
        });
      }
    });
  });

  eventEmitter.onEvent('CALL_SIGNAL_SENT', (event: AppEvent) => {
    const payload = event.payload as CallSignalSentPayload;
    // We already handle direct socket-to-socket signals below, but this is for REST based signals
  });

  // Socket Connection Handlers
  io.on('connection', (socket: Socket) => {
    if (!socket.data.userId) return;

    const userId = socket.data.userId;

    // Direct WebRTC signaling over socket (Faster than REST)
    socket.on('call:signal', async (data: { callId: string; type: string; payload: any }, callback?: Function) => {
      try {
        const call = await callRepository.getCallById(data.callId);
        if (!call) throw new Error('Call not found');
        if (call.callerId !== userId && call.calleeId !== userId) throw new Error('Not authorized');

        const targetUserId = call.callerId === userId ? call.calleeId : call.callerId;
        io.to(`user:${targetUserId}`).emit('call:signal', {
          callId: data.callId,
          senderId: userId,
          type: data.type,
          payload: data.payload
        });

        if (callback) callback({ status: 'success' });
      } catch (err: any) {
        if (callback) callback({ status: 'error', error: err.message });
        socket.emit('call:error', { callId: data.callId, error: err.message });
      }
    });

    // Mute/Unmute/Video toggles
    socket.on('call:mute', async (data: { callId: string }) => {
      const call = await callRepository.getCallById(data.callId);
      if (call) {
        const targetUserId = call.callerId === userId ? call.calleeId : call.callerId;
        io.to(`user:${targetUserId}`).emit('call:mute', { callId: data.callId, userId });
      }
    });

    socket.on('call:unmute', async (data: { callId: string }) => {
      const call = await callRepository.getCallById(data.callId);
      if (call) {
        const targetUserId = call.callerId === userId ? call.calleeId : call.callerId;
        io.to(`user:${targetUserId}`).emit('call:unmute', { callId: data.callId, userId });
      }
    });

    socket.on('call:camera:on', async (data: { callId: string }) => {
      const call = await callRepository.getCallById(data.callId);
      if (call) {
        const targetUserId = call.callerId === userId ? call.calleeId : call.callerId;
        io.to(`user:${targetUserId}`).emit('call:camera:on', { callId: data.callId, userId });
      }
    });

    socket.on('call:camera:off', async (data: { callId: string }) => {
      const call = await callRepository.getCallById(data.callId);
      if (call) {
        const targetUserId = call.callerId === userId ? call.calleeId : call.callerId;
        io.to(`user:${targetUserId}`).emit('call:camera:off', { callId: data.callId, userId });
      }
    });
  });
}
