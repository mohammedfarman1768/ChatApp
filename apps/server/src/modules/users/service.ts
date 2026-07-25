import { usersRepository } from './repository.js';
import { eventEmitter } from '../../events/emitter.js';
import { randomUUID } from 'crypto';
import { Visibility } from '@prisma/client';

export class UsersService {
  async ensureProfile(userId: string, email?: string, name?: string, avatarUrl?: string) {
    let profile = await usersRepository.findProfileByUserId(userId);
    if (!profile) {
      // Create with a generated username from email or name
      const baseUsername = (name || email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const uniqueUsername = `${baseUsername}_${randomUUID().slice(0, 8)}`;
      try {
        profile = await usersRepository.createProfile({
          userId,
          username: uniqueUsername,
          avatarUrl,
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Concurrently created by another request, just fetch it
          profile = await usersRepository.findProfileByUserId(userId);
        } else {
          throw error;
        }
      }
    }
    return profile!;
  }

  async getMyProfile(userId: string) {
    return this.ensureProfile(userId);
  }

  async updateMyProfile(userId: string, data: { username?: string; bio?: string | null; avatarUrl?: string | null; customStatus?: string | null }) {
    await this.ensureProfile(userId);
    const updated = await usersRepository.updateProfile(userId, data);
    
    eventEmitter.emitEvent('USER_UPDATED', {
      eventId: randomUUID(),
      eventType: 'USER_UPDATED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'users-module',
      correlationId: randomUUID(),
      payload: { userId }
    });

    return updated;
  }

  async updateMyPrivacy(userId: string, data: { profileVisibility?: Visibility; statusVisibility?: Visibility }) {
    const profile = await this.ensureProfile(userId);
    if (profile.privacySettings?.id) {
      return usersRepository.updatePrivacySettings(profile.privacySettings.id, data);
    }
    throw new Error('Privacy settings not found for user');
  }

  async getUserProfile(targetUsername: string, requesterId: string) {
    const profile = await usersRepository.findProfileByUsername(targetUsername);
    if (!profile) return null;

    // Check blocking
    const isBlocked = await usersRepository.findAnyBlock(requesterId, profile.userId);
    if (isBlocked) return null;

    // Check privacy
    const visibility = profile.privacySettings?.profileVisibility || 'PUBLIC';
    if (visibility === 'PRIVATE' && requesterId !== profile.userId) {
      // Strip private info
      return { username: profile.username };
    }

    if (visibility === 'FRIENDS' && requesterId !== profile.userId) {
      const friendship = await usersRepository.findFriendship(requesterId, profile.userId);
      if (!friendship) {
        return { username: profile.username };
      }
    }

    // Status privacy
    const statusVisibility = profile.privacySettings?.statusVisibility || 'FRIENDS';
    let hideStatus = false;
    if (statusVisibility === 'PRIVATE' && requesterId !== profile.userId) hideStatus = true;
    if (statusVisibility === 'FRIENDS' && requesterId !== profile.userId) {
      const friendship = await usersRepository.findFriendship(requesterId, profile.userId);
      if (!friendship) hideStatus = true;
    }

    return {
      ...profile,
      customStatus: hideStatus ? null : profile.customStatus,
    };
  }

  async searchUsers(query: string, requesterId: string, cursor?: string, limit?: number) {
    const results = await usersRepository.searchUsers(query, cursor, limit);
    
    // Filter out blocked users
    const blocks = await usersRepository.getBlocksForUser(requesterId);
    const blockedUserIds = new Set(blocks.map(b => b.blockerId === requesterId ? b.blockedId : b.blockerId));

    const filtered = results.filter(p => !blockedUserIds.has(p.userId));

    // Map according to privacy
    return Promise.all(filtered.map(async p => {
      const visibility = p.privacySettings?.profileVisibility || 'PUBLIC';
      if (visibility === 'PRIVATE' && requesterId !== p.userId) {
        return { username: p.username };
      }
      if (visibility === 'FRIENDS' && requesterId !== p.userId) {
        const friendship = await usersRepository.findFriendship(requesterId, p.userId);
        if (!friendship) return { username: p.username };
      }
      return { username: p.username, bio: p.bio, avatarUrl: p.avatarUrl };
    }));
  }

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) throw new Error('Cannot send request to yourself');

    const receiverProfile = await usersRepository.findProfileByUserId(receiverId);
    if (!receiverProfile) throw new Error('Receiver not found');

    const isBlocked = await usersRepository.findAnyBlock(senderId, receiverId);
    if (isBlocked) throw new Error('Cannot send friend request');

    const friendship = await usersRepository.findFriendship(senderId, receiverId);
    if (friendship) throw new Error('Already friends');

    // Check if reverse request exists
    const reverseReq = await usersRepository.findFriendRequest(receiverId, senderId);
    if (reverseReq && reverseReq.status === 'PENDING') {
      // Auto-accept if they already requested us
      await usersRepository.updateFriendRequestStatus(reverseReq.id, 'ACCEPTED');
      await usersRepository.createFriendship(senderId, receiverId);
      
      eventEmitter.emitEvent('FRIEND_REQUEST_ACCEPTED', {
        eventId: randomUUID(),
        eventType: 'FRIEND_REQUEST_ACCEPTED',
        timestamp: new Date().toISOString(),
        version: 1,
        source: 'users-module',
        correlationId: randomUUID(),
        payload: { requestId: reverseReq.id, senderId: receiverId, receiverId: senderId }
      });
      return { status: 'ACCEPTED', message: 'Friend request accepted automatically' };
    }

    const existingReq = await usersRepository.findFriendRequest(senderId, receiverId);
    if (existingReq && existingReq.status === 'PENDING') {
      throw new Error('Request already pending');
    }

    // Overwrite old rejected/cancelled request if any, or just create new one
    // We will just let prisma handle it by Upsert or Delete-Insert, or just update if exists.
    let req;
    if (existingReq) {
       req = await usersRepository.updateFriendRequestStatus(existingReq.id, 'PENDING');
    } else {
       req = await usersRepository.createFriendRequest(senderId, receiverId);
    }

    eventEmitter.emitEvent('FRIEND_REQUEST_CREATED', {
      eventId: randomUUID(),
      eventType: 'FRIEND_REQUEST_CREATED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'users-module',
      correlationId: randomUUID(),
      payload: { requestId: req.id, senderId, receiverId }
    });

    return req;
  }

  async acceptFriendRequest(userId: string, requestId: string) {
    const req = await usersRepository.findFriendRequestById(requestId);
    if (!req) throw new Error('Request not found');
    if (req.receiverId !== userId) throw new Error('Unauthorized');
    if (req.status !== 'PENDING') throw new Error('Request not pending');

    await usersRepository.updateFriendRequestStatus(requestId, 'ACCEPTED');
    await usersRepository.createFriendship(req.senderId, req.receiverId);

    eventEmitter.emitEvent('FRIEND_REQUEST_ACCEPTED', {
      eventId: randomUUID(),
      eventType: 'FRIEND_REQUEST_ACCEPTED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'users-module',
      correlationId: randomUUID(),
      payload: { requestId, senderId: req.senderId, receiverId: req.receiverId }
    });

    return { success: true };
  }

  async rejectFriendRequest(userId: string, requestId: string) {
    const req = await usersRepository.findFriendRequestById(requestId);
    if (!req) throw new Error('Request not found');
    if (req.receiverId !== userId) throw new Error('Unauthorized');
    if (req.status !== 'PENDING') throw new Error('Request not pending');

    await usersRepository.updateFriendRequestStatus(requestId, 'REJECTED');

    eventEmitter.emitEvent('FRIEND_REQUEST_REJECTED', {
      eventId: randomUUID(),
      eventType: 'FRIEND_REQUEST_REJECTED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'users-module',
      correlationId: randomUUID(),
      payload: { requestId, senderId: req.senderId, receiverId: req.receiverId }
    });

    return { success: true };
  }

  async cancelFriendRequest(userId: string, requestId: string) {
    const req = await usersRepository.findFriendRequestById(requestId);
    if (!req) throw new Error('Request not found');
    if (req.senderId !== userId) throw new Error('Unauthorized');
    if (req.status !== 'PENDING') throw new Error('Request not pending');

    await usersRepository.updateFriendRequestStatus(requestId, 'CANCELLED');

    eventEmitter.emitEvent('FRIEND_REQUEST_CANCELLED', {
      eventId: randomUUID(),
      eventType: 'FRIEND_REQUEST_CANCELLED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'users-module',
      correlationId: randomUUID(),
      payload: { requestId, senderId: req.senderId, receiverId: req.receiverId }
    });

    return { success: true };
  }

  async getPendingRequests(userId: string, cursor?: string, limit?: number) {
    return usersRepository.findPendingFriendRequests(userId, cursor, limit);
  }

  async getFriends(userId: string, cursor?: string, limit?: number) {
    return usersRepository.findFriends(userId, cursor, limit);
  }

  async removeFriend(userId: string, friendId: string) {
    try {
      await usersRepository.deleteFriendship(userId, friendId);

      eventEmitter.emitEvent('FRIENDSHIP_REMOVED', {
        eventId: randomUUID(),
        eventType: 'FRIENDSHIP_REMOVED',
        timestamp: new Date().toISOString(),
        version: 1,
        source: 'users-module',
        correlationId: randomUUID(),
        payload: { userId, friendId }
      });
    } catch (error: any) {
      if (error.code !== 'P2025') throw error; // ignore if not found
    }
    return { success: true };
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new Error('Cannot block yourself');

    const blockedProfile = await usersRepository.findProfileByUserId(blockedId);
    if (!blockedProfile) throw new Error('User not found');

    const existingBlock = await usersRepository.findBlock(blockerId, blockedId);
    if (existingBlock) return { success: true };

    await usersRepository.createBlock(blockerId, blockedId);

    eventEmitter.emitEvent('USER_BLOCKED', {
      eventId: randomUUID(),
      eventType: 'USER_BLOCKED',
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'users-module',
      correlationId: randomUUID(),
      payload: { blockerId, blockedId }
    });

    return { success: true };
  }

  async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await usersRepository.getBlocksForUser(userId);
    return blocks.map(b => b.blockerId === userId ? b.blockedId : b.blockerId);
  }

  async unblockUser(blockerId: string, blockedId: string) {
    try {
      await usersRepository.deleteBlock(blockerId, blockedId);

      eventEmitter.emitEvent('USER_UNBLOCKED', {
        eventId: randomUUID(),
        eventType: 'USER_UNBLOCKED',
        timestamp: new Date().toISOString(),
        version: 1,
        source: 'users-module',
        correlationId: randomUUID(),
        payload: { blockerId, blockedId }
      });
    } catch (error: any) {
      if (error.code !== 'P2025') throw error;
    }

    return { success: true };
  }

  async getContacts(userId: string, cursor?: string, limit?: number) {
    return usersRepository.findContacts(userId, cursor, limit);
  }

  async addContact(userId: string, contactUserId: string, alias?: string | null) {
    if (userId === contactUserId) throw new Error('Cannot add yourself as contact');
    const contactProfile = await usersRepository.findProfileByUserId(contactUserId);
    if (!contactProfile) throw new Error('User not found');

    return usersRepository.addContact(userId, contactUserId, alias);
  }

  async removeContact(userId: string, contactUserId: string) {
    try {
      await usersRepository.deleteContact(userId, contactUserId);
    } catch {
      // Ignore if not found
    }
    return { success: true };
  }
}

export const usersService = new UsersService();
