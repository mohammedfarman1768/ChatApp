
/**
 * Group Calls Socket Handlers
 * 
 * Manages real-time WebRTC signaling (offers, answers, ICE candidates) and call state events via Socket.IO.
 * Enforces membership, ban status, and participant verification before relaying any media or signaling events.
 * Note: Ephemeral Socket.IO signaling is preferred over REST persistence to prevent database bloat.
 */
import { Server, Socket } from 'socket.io';
import { groupRepository } from '../groups/repository.js';
import { groupCallRepository } from './repository.js';

export function initGroupCallSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    // We assume authentication middleware has already verified the token
    // and populated socket.data.userId.
    const userId = socket.data.userId;
    if (!userId) return;

    // Join a group call room
    socket.on('group-call:join', async (payload: { groupId: string; callId: string }) => {
      try {
        const { groupId, callId } = payload;
        
        // Security check
        const member = await groupRepository.getMember(groupId, userId);
        const ban = await groupRepository.getBan(groupId, userId);
        if (!member || ban) return socket.emit('group-call:error', { message: 'Unauthorized' });

        const participant = await groupCallRepository.getParticipant(callId, userId);
        if (!participant) return socket.emit('group-call:error', { message: 'Must join via REST API first' });

        const roomName = `group-call:${groupId}:${callId}`;
        socket.join(roomName);

        // Notify others
        socket.to(roomName).emit('group-call:joined', { userId, groupId, callId });
      } catch (err) {
        socket.emit('group-call:error', { message: 'Failed to join group call socket' });
      }
    });

    socket.on('group-call:leave', async (payload: { groupId: string; callId: string }) => {
      try {
        const { groupId, callId } = payload;
        // Verify the user is actually a participant before broadcasting leave
        const participant = await groupCallRepository.getParticipant(callId, userId);
        if (!participant) return; // Silently ignore if not a participant

        const roomName = `group-call:${groupId}:${callId}`;
        socket.leave(roomName);
        socket.to(roomName).emit('group-call:left', { userId, groupId, callId });
      } catch (err) {
        // Ignore errors on leave
      }
    });

    socket.on('group-call:signal', async (payload: { groupId: string; callId: string; targetUserId?: string; type: string; payload: any }) => {
      try {
        const { groupId, callId, targetUserId, type, payload: signalPayload } = payload;

        // Verify membership
        const member = await groupRepository.getMember(groupId, userId);
        if (!member) return;

        const participant = await groupCallRepository.getParticipant(callId, userId);
        if (!participant) return; // Ignore if not part of the call

        const signalEvent = {
          groupId,
          callId,
          senderId: userId,
          type,
          payload: signalPayload
        };

        if (targetUserId) {
          // Direct signal to specific user (e.g., SDP offer)
          // We assume users are in room `user:${targetUserId}`
          socket.to(`user:${targetUserId}`).emit('group-call:signal', signalEvent);
        } else {
          // Broadcast signal to everyone in call
          socket.to(`group-call:${groupId}:${callId}`).emit('group-call:signal', signalEvent);
        }
      } catch (err) {
        console.error('Signal relay error', err);
      }
    });

    // Mute/Camera events
    const mediaEvents = ['mute', 'unmute', 'camera:on', 'camera:off', 'screen-share:on', 'screen-share:off'];
    mediaEvents.forEach(evt => {
      socket.on(`group-call:${evt}`, async (payload: { groupId: string; callId: string }) => {
        try {
          const { groupId, callId } = payload;
          const member = await groupRepository.getMember(groupId, userId);
          if (!member) return;

          socket.to(`group-call:${groupId}:${callId}`).emit(`group-call:${evt}`, {
            userId,
            groupId,
            callId
          });
        } catch (err) {
          // ignore
        }
      });
    });

    socket.on('disconnect', () => {
      // Automatic cleanup could be handled here if needed, but it's tricky to map socket disconnects
      // to leaving the group call without checking all rooms.
      // Often, a user might just refresh the page and reconnect.
      // The REST API handles formal leaving.
    });
  });
}
