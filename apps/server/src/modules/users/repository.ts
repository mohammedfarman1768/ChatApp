import { UserProfile, PrivacySettings, RequestStatus } from '@prisma/client';
import { prisma } from '../../prisma/client.js';

export class UsersRepository {
  async findProfileByUserId(userId: string) {
    return prisma.userProfile.findUnique({
      where: { userId },
      include: { privacySettings: true },
    });
  }

  async findProfileByUsername(username: string) {
    return prisma.userProfile.findUnique({
      where: { username },
      include: { privacySettings: true },
    });
  }

  async createProfile(data: { userId: string; username: string; bio?: string | null; avatarUrl?: string | null; customStatus?: string | null }) {
    // Generate a unique fallback username if none provided or collision happens? No, the caller should handle it.
    return prisma.userProfile.create({
      data: {
        userId: data.userId,
        username: data.username,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        customStatus: data.customStatus,
        privacySettings: {
          create: {
            profileVisibility: 'PUBLIC',
            statusVisibility: 'FRIENDS',
          }
        }
      },
      include: { privacySettings: true },
    });
  }

  async updateProfile(userId: string, data: Partial<UserProfile>) {
    return prisma.userProfile.update({
      where: { userId },
      data,
      include: { privacySettings: true },
    });
  }

  async updatePrivacySettings(userProfileId: string, data: Partial<PrivacySettings>) {
    return prisma.privacySettings.update({
      where: { userProfileId },
      data,
    });
  }

  async searchUsers(query: string, cursor?: string, limit: number = 20) {
    return prisma.userProfile.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive'
        }
      },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
      include: { privacySettings: true },
    });
  }

  async createFriendRequest(senderId: string, receiverId: string) {
    return prisma.friendRequest.create({
      data: { senderId, receiverId, status: 'PENDING' }
    });
  }

  async findFriendRequest(senderId: string, receiverId: string) {
    return prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } }
    });
  }

  async findFriendRequestById(id: string) {
    return prisma.friendRequest.findUnique({ where: { id } });
  }

  async updateFriendRequestStatus(id: string, status: RequestStatus) {
    return prisma.friendRequest.update({
      where: { id },
      data: { status }
    });
  }

  async findPendingFriendRequests(userId: string, cursor?: string, limit: number = 20) {
    return prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'PENDING' },
          { receiverId: userId, status: 'PENDING' }
        ]
      },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteFriendRequest(id: string) {
    return prisma.friendRequest.delete({ where: { id } });
  }

  // Helper to ensure userId < friendId for unique constraint
  private normalizeFriendshipKeys(id1: string, id2: string) {
    return id1 < id2 ? { userId: id1, friendId: id2 } : { userId: id2, friendId: id1 };
  }

  async createFriendship(userId1: string, userId2: string) {
    const { userId, friendId } = this.normalizeFriendshipKeys(userId1, userId2);
    return prisma.friendship.create({
      data: { userId, friendId }
    });
  }

  async findFriendship(userId1: string, userId2: string) {
    const { userId, friendId } = this.normalizeFriendshipKeys(userId1, userId2);
    return prisma.friendship.findUnique({
      where: { userId_friendId: { userId, friendId } }
    });
  }

  async deleteFriendship(userId1: string, userId2: string) {
    const { userId, friendId } = this.normalizeFriendshipKeys(userId1, userId2);
    return prisma.friendship.delete({
      where: { userId_friendId: { userId, friendId } }
    });
  }

  async findFriends(userId: string, cursor?: string, limit: number = 20) {
    return prisma.friendship.findMany({
      where: {
        OR: [
          { userId: userId },
          { friendId: userId }
        ]
      },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' }
    });
  }

  async findBlock(blockerId: string, blockedId: string) {
    return prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } }
    });
  }

  async findAnyBlock(userId1: string, userId2: string) {
    // Check if either has blocked the other
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { blockerId: userId1, blockedId: userId2 },
          { blockerId: userId2, blockedId: userId1 }
        ]
      }
    });
    return blocks.length > 0;
  }

  async getBlocksForUser(userId: string) {
    // Get all users this user has blocked, AND all users who blocked this user
    return prisma.block.findMany({
      where: {
        OR: [
          { blockerId: userId },
          { blockedId: userId }
        ]
      }
    });
  }

  async createBlock(blockerId: string, blockedId: string) {
    return prisma.$transaction(async (tx) => {
      const block = await tx.block.create({
        data: { blockerId, blockedId }
      });

      // Also remove any existing friendship
      const { userId, friendId } = this.normalizeFriendshipKeys(blockerId, blockedId);
      await tx.friendship.deleteMany({
        where: { userId, friendId }
      });

      // Also cancel pending requests between them
      await tx.friendRequest.updateMany({
        where: {
          status: 'PENDING',
          OR: [
            { senderId: blockerId, receiverId: blockedId },
            { senderId: blockedId, receiverId: blockerId }
          ]
        },
        data: { status: 'CANCELLED' }
      });

      return block;
    });
  }

  async deleteBlock(blockerId: string, blockedId: string) {
    return prisma.block.delete({
      where: { blockerId_blockedId: { blockerId, blockedId } }
    });
  }

  async addContact(ownerId: string, contactUserId: string, alias?: string | null) {
    return prisma.contact.upsert({
      where: { ownerId_contactUserId: { ownerId, contactUserId } },
      update: { alias },
      create: { ownerId, contactUserId, alias }
    });
  }

  async findContacts(ownerId: string, cursor?: string, limit: number = 20) {
    return prisma.contact.findMany({
      where: { ownerId },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteContact(ownerId: string, contactUserId: string) {
    return prisma.contact.delete({
      where: { ownerId_contactUserId: { ownerId, contactUserId } }
    });
  }
}

export const usersRepository = new UsersRepository();
