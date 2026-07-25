import { prisma } from '../../prisma/client.js';
import { GroupRole, GroupAuditAction } from '@prisma/client';
import { 
  ICreateGroupData, 
  IUpdateGroupData, 
  ICreateInviteData,
  IBanMemberData,
  IJoinRequestDecisionData
} from './types.js';

export const groupRepository = {
  async getGroupById(groupId: string) {
    return prisma.group.findUnique({
      where: { id: groupId },
      include: {
        settings: true
      }
    });
  },

  async getMember(groupId: string, userId: string) {
    return prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId }
      }
    });
  },

  async getMembers(groupId: string, limit = 50, cursor?: string) {
    const take = limit + 1;
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { joinedAt: 'asc' },
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 })
    });

    let hasNextPage = false;
    if (members.length > limit) {
      hasNextPage = true;
      members.pop();
    }

    return {
      members,
      nextCursor: hasNextPage ? members[members.length - 1].id : undefined
    };
  },

  async getBans(groupId: string, limit = 50, cursor?: string) {
    const take = limit + 1;
    const bans = await prisma.groupBan.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        banner: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 })
    });

    let hasNextPage = false;
    if (bans.length > limit) {
      hasNextPage = true;
      bans.pop();
    }

    return {
      bans,
      nextCursor: hasNextPage ? bans[bans.length - 1].id : undefined
    };
  },

  async getJoinRequests(groupId: string, limit = 50, cursor?: string) {
    const take = limit + 1;
    const requests = await prisma.groupJoinRequest.findMany({
      where: { groupId, status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { requestedAt: 'asc' },
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 })
    });

    let hasNextPage = false;
    if (requests.length > limit) {
      hasNextPage = true;
      requests.pop();
    }

    return {
      requests,
      nextCursor: hasNextPage ? requests[requests.length - 1].id : undefined
    };
  },

  async createGroup(data: ICreateGroupData) {
    return prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: data.name,
          description: data.description,
          avatarMediaId: data.avatarMediaId,
          createdBy: data.userId,
          settings: {
            create: {} // defaults
          },
          members: {
            create: {
              userId: data.userId,
              role: GroupRole.OWNER
            }
          }
        },
        include: {
          settings: true,
          members: true
        }
      });

      await tx.groupAuditLog.create({
        data: {
          groupId: group.id,
          actorId: data.userId,
          action: GroupAuditAction.GROUP_CREATED
        }
      });

      return group;
    });
  },

  async updateGroup(data: IUpdateGroupData) {
    return prisma.$transaction(async (tx) => {
      const updatedGroup = await tx.group.update({
        where: { id: data.groupId },
        data: {
          name: data.name !== undefined ? data.name : undefined,
          description: data.description !== undefined ? data.description : undefined,
          avatarMediaId: data.avatarMediaId !== undefined ? data.avatarMediaId : undefined,
          settings: {
            update: {
              allowMemberInvites: data.allowMemberInvites,
              allowMemberNicknameChanges: data.allowMemberNicknameChanges,
              joinApprovalRequired: data.joinApprovalRequired,
              slowModeSeconds: data.slowModeSeconds
            }
          }
        },
        include: { settings: true }
      });

      await tx.groupAuditLog.create({
        data: {
          groupId: data.groupId,
          actorId: data.userId,
          action: GroupAuditAction.GROUP_UPDATED,
          metadata: { ...data, userId: undefined, groupId: undefined } as any
        }
      });

      return updatedGroup;
    });
  },

  async deleteGroup(groupId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const group = await tx.group.update({
        where: { id: groupId },
        data: {
          deletedAt: new Date()
        }
      });

      await tx.groupAuditLog.create({
        data: {
          groupId: groupId,
          actorId: userId,
          action: GroupAuditAction.GROUP_UPDATED,
          metadata: { action: 'DELETED' }
        }
      });

      return group;
    });
  },

  async addMember(groupId: string, userId: string, role: GroupRole = GroupRole.MEMBER, inviteCode?: string) {
    return prisma.$transaction(async (tx) => {
      const member = await tx.groupMember.create({
        data: {
          groupId,
          userId,
          role
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } }
        }
      });

      if (inviteCode) {
        await tx.groupInvite.update({
          where: { inviteCode },
          data: { uses: { increment: 1 } }
        });
      }

      await tx.groupAuditLog.create({
        data: {
          groupId,
          actorId: userId,
          targetUserId: userId,
          action: GroupAuditAction.MEMBER_JOINED,
          metadata: { inviteCode }
        }
      });

      return member;
    });
  },

  async removeMember(groupId: string, targetUserId: string, actorId: string, action: GroupAuditAction = GroupAuditAction.MEMBER_LEFT) {
    return prisma.$transaction(async (tx) => {
      await tx.groupMember.delete({
        where: { groupId_userId: { groupId, userId: targetUserId } }
      });

      await tx.groupAuditLog.create({
        data: {
          groupId,
          actorId,
          targetUserId,
          action
        }
      });
    });
  },

  async promoteMember(groupId: string, targetUserId: string, role: GroupRole, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const member = await tx.groupMember.update({
        where: { groupId_userId: { groupId, userId: targetUserId } },
        data: { role },
        include: { user: { select: { id: true, name: true } } }
      });

      await tx.groupAuditLog.create({
        data: {
          groupId,
          actorId,
          targetUserId,
          action: GroupAuditAction.ROLE_UPDATED,
          metadata: { role }
        }
      });

      return member;
    });
  },

  async transferOwnership(groupId: string, currentOwnerId: string, newOwnerId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.groupMember.update({
        where: { groupId_userId: { groupId, userId: currentOwnerId } },
        data: { role: GroupRole.ADMIN }
      });

      const newOwner = await tx.groupMember.update({
        where: { groupId_userId: { groupId, userId: newOwnerId } },
        data: { role: GroupRole.OWNER }
      });

      await tx.groupAuditLog.create({
        data: {
          groupId,
          actorId: currentOwnerId,
          targetUserId: newOwnerId,
          action: GroupAuditAction.OWNERSHIP_TRANSFERRED
        }
      });

      return newOwner;
    });
  },

  async banMember(data: IBanMemberData) {
    return prisma.$transaction(async (tx) => {
      // Create ban
      const ban = await tx.groupBan.create({
        data: {
          groupId: data.groupId,
          userId: data.targetUserId,
          bannedBy: data.adminId,
          reason: data.reason
        }
      });

      // Remove member if they are in the group
      await tx.groupMember.deleteMany({
        where: { groupId: data.groupId, userId: data.targetUserId }
      });

      await tx.groupAuditLog.create({
        data: {
          groupId: data.groupId,
          actorId: data.adminId,
          targetUserId: data.targetUserId,
          action: GroupAuditAction.MEMBER_BANNED,
          metadata: { reason: data.reason }
        }
      });

      return ban;
    });
  },

  async unbanMember(groupId: string, targetUserId: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.groupBan.delete({
        where: { groupId_userId: { groupId, userId: targetUserId } }
      });

      await tx.groupAuditLog.create({
        data: {
          groupId,
          actorId: adminId,
          targetUserId,
          action: GroupAuditAction.MEMBER_UNBANNED
        }
      });
    });
  },

  async getBan(groupId: string, userId: string) {
    return prisma.groupBan.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });
  },

  async getInviteByCode(inviteCode: string) {
    return prisma.groupInvite.findUnique({
      where: { inviteCode }
    });
  },

  async getInvites(groupId: string) {
    return prisma.groupInvite.findMany({
      where: { groupId, isRevoked: false },
      orderBy: { createdAt: 'desc' }
    });
  },

  async createInvite(data: ICreateInviteData, inviteCode: string) {
    return prisma.$transaction(async (tx) => {
      const invite = await tx.groupInvite.create({
        data: {
          groupId: data.groupId,
          createdBy: data.userId,
          inviteCode,
          maxUses: data.maxUses,
          expiresAt: data.expiresInHours 
            ? new Date(Date.now() + data.expiresInHours * 3600000) 
            : null
        }
      });

      await tx.groupAuditLog.create({
        data: {
          groupId: data.groupId,
          actorId: data.userId,
          action: GroupAuditAction.INVITE_CREATED,
          metadata: { inviteCode }
        }
      });

      return invite;
    });
  },

  async revokeInvite(groupId: string, inviteCode: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const invite = await tx.groupInvite.update({
        where: { inviteCode },
        data: { isRevoked: true }
      });

      await tx.groupAuditLog.create({
        data: {
          groupId,
          actorId: adminId,
          action: GroupAuditAction.INVITE_REVOKED,
          metadata: { inviteCode }
        }
      });

      return invite;
    });
  },

  async createJoinRequest(groupId: string, userId: string) {
    return prisma.groupJoinRequest.create({
      data: {
        groupId,
        userId
      }
    });
  },

  async getJoinRequest(requestId: string) {
    return prisma.groupJoinRequest.findUnique({
      where: { id: requestId }
    });
  },

  async getPendingJoinRequest(groupId: string, userId: string) {
    return prisma.groupJoinRequest.findFirst({
      where: { groupId, userId, status: 'PENDING' }
    });
  },

  async decideJoinRequest(data: IJoinRequestDecisionData) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.groupJoinRequest.update({
        where: { id: data.requestId },
        data: {
          status: data.status,
          decidedAt: new Date(),
          decidedBy: data.adminId
        }
      });

      if (data.status === 'APPROVED') {
        // Create member
        await tx.groupMember.create({
          data: {
            groupId: data.groupId,
            userId: request.userId,
            role: GroupRole.MEMBER
          }
        });
        
        await tx.groupAuditLog.create({
          data: {
            groupId: data.groupId,
            actorId: data.adminId,
            targetUserId: request.userId,
            action: GroupAuditAction.MEMBER_JOINED,
            metadata: { joinRequestId: request.id }
          }
        });
      }

      return request;
    });
  }
};
