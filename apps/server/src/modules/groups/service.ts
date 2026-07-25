import { groupRepository } from './repository.js';
import { GroupRole, JoinRequestStatus, GroupVisibility } from '@prisma/client';
import { 
  ICreateGroupData, 
  IUpdateGroupData, 
  ICreateInviteData,
  IPromoteMemberData,
  IJoinGroupData,
  IJoinRequestData,
  IJoinRequestDecisionData,
  ITransferOwnershipData,
  IBanMemberData,
  GroupError
} from './types.js';
import crypto from 'crypto';
import { eventEmitter } from '../../events/emitter.js';

const roleRank: Record<GroupRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MODERATOR: 2,
  MEMBER: 1
};

export const groupService = {
  async createGroup(data: ICreateGroupData, correlationId?: string) {
    const group = await groupRepository.createGroup(data);
    
    eventEmitter.emit('GROUP_CREATED', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_CREATED',
      timestamp: new Date(),
      version: '1',
      source: 'groups-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        groupId: group.id,
        creatorId: data.userId
      }
    });

    return group;
  },

  async getGroup(groupId: string, userId: string) {
    const group = await groupRepository.getGroupById(groupId);
    if (!group) throw new GroupError(404, 'Group not found');

    const member = await groupRepository.getMember(groupId, userId);
    if (!member && group.visibility === GroupVisibility.PRIVATE) {
      throw new GroupError(403, 'Not a member of this private group');
    }

    return group;
  },

  async updateGroup(data: IUpdateGroupData, correlationId?: string) {
    const member = await groupRepository.getMember(data.groupId, data.userId);
    if (!member) throw new GroupError(403, 'Not a member of this group');
    
    // Only OWNER and ADMIN can update settings
    if (member.role !== GroupRole.OWNER && member.role !== GroupRole.ADMIN) {
      throw new GroupError(403, 'Insufficient permissions to update group');
    }

    const updated = await groupRepository.updateGroup(data);

    eventEmitter.emit('GROUP_UPDATED', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_UPDATED',
      timestamp: new Date(),
      version: '1',
      source: 'groups-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        groupId: updated.id,
        updatedBy: data.userId
      }
    });

    return updated;
  },

  async deleteGroup(groupId: string, userId: string, correlationId?: string) {
    const member = await groupRepository.getMember(groupId, userId);
    if (!member) throw new GroupError(403, 'Not a member of this group');
    
    if (member.role !== GroupRole.OWNER) {
      throw new GroupError(403, 'Only the owner can delete the group');
    }

    const group = await groupRepository.deleteGroup(groupId, userId);

    eventEmitter.emit('GROUP_DELETED', {
      eventId: crypto.randomUUID(),
      eventType: 'GROUP_DELETED',
      timestamp: new Date(),
      version: '1',
      source: 'groups-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        groupId: group.id,
        deletedBy: userId
      }
    });

    return group;
  },

  async getMembers(groupId: string, userId: string, limit?: number, cursor?: string) {
    const member = await groupRepository.getMember(groupId, userId);
    if (!member) throw new GroupError(403, 'Not a member of this group');

    return groupRepository.getMembers(groupId, limit, cursor);
  },

  async joinGroup(data: IJoinGroupData, correlationId?: string) {
    const group = await groupRepository.getGroupById(data.groupId);
    if (!group) throw new GroupError(404, 'Group not found');

    const existingMember = await groupRepository.getMember(data.groupId, data.userId);
    if (existingMember) throw new GroupError(409, 'Already a member');

    const ban = await groupRepository.getBan(data.groupId, data.userId);
    if (ban) throw new GroupError(403, 'You are banned from this group');

    if (group.visibility === GroupVisibility.PRIVATE) {
      if (!data.inviteCode) {
        throw new GroupError(403, 'Invite code required for private groups');
      }

      const invite = await groupRepository.getInviteByCode(data.inviteCode);
      if (!invite || invite.groupId !== data.groupId || invite.isRevoked) {
        throw new GroupError(400, 'Invalid or revoked invite code');
      }

      if (invite.expiresAt && invite.expiresAt < new Date()) {
        throw new GroupError(400, 'Invite code expired');
      }

      if (invite.maxUses && invite.uses >= invite.maxUses) {
        throw new GroupError(400, 'Invite code usage limit reached');
      }
    }

    const member = await groupRepository.addMember(data.groupId, data.userId, GroupRole.MEMBER, data.inviteCode);

    eventEmitter.emit('MEMBER_JOINED', {
      eventId: crypto.randomUUID(),
      eventType: 'MEMBER_JOINED',
      timestamp: new Date(),
      version: '1',
      source: 'groups-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        groupId: data.groupId,
        userId: data.userId,
        role: GroupRole.MEMBER,
        inviteCode: data.inviteCode
      }
    });

    return member;
  },

  async leaveGroup(groupId: string, userId: string, correlationId?: string) {
    const member = await groupRepository.getMember(groupId, userId);
    if (!member) throw new GroupError(404, 'Not a member of this group');

    if (member.role === GroupRole.OWNER) {
      throw new GroupError(400, 'Owner cannot leave without transferring ownership or deleting the group');
    }

    await groupRepository.removeMember(groupId, userId, userId);

    eventEmitter.emit('MEMBER_LEFT', {
      eventId: crypto.randomUUID(),
      eventType: 'MEMBER_LEFT',
      timestamp: new Date(),
      version: '1',
      source: 'groups-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        groupId,
        userId
      }
    });
  },

  async kickMember(groupId: string, targetUserId: string, adminId: string, correlationId?: string) {
    const admin = await groupRepository.getMember(groupId, adminId);
    if (!admin) throw new GroupError(403, 'Not a member');

    const target = await groupRepository.getMember(groupId, targetUserId);
    if (!target) throw new GroupError(404, 'Target user is not a member');

    if (adminId === targetUserId) {
      throw new GroupError(400, 'Cannot kick yourself');
    }

    if (roleRank[admin.role] <= roleRank[target.role]) {
      throw new GroupError(403, 'Cannot kick a member with an equal or higher role');
    }

    await groupRepository.removeMember(groupId, targetUserId, adminId);

    eventEmitter.emit('MEMBER_KICKED', {
      eventId: crypto.randomUUID(),
      eventType: 'MEMBER_KICKED',
      timestamp: new Date(),
      version: '1',
      source: 'groups-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        groupId,
        userId: targetUserId,
        kickedBy: adminId
      }
    });
  },

  async promoteMember(data: IPromoteMemberData, correlationId?: string) {
    const admin = await groupRepository.getMember(data.groupId, data.adminId);
    if (!admin) throw new GroupError(403, 'Not a member');

    const target = await groupRepository.getMember(data.groupId, data.targetUserId);
    if (!target) throw new GroupError(404, 'Target user is not a member');

    if (data.adminId === data.targetUserId) {
      throw new GroupError(400, 'Cannot change your own role');
    }

    if (roleRank[admin.role] <= roleRank[target.role]) {
      throw new GroupError(403, 'Cannot modify role of an equal or higher ranked member');
    }

    if (roleRank[admin.role] <= roleRank[data.role]) {
      throw new GroupError(403, 'Cannot promote someone to a role equal to or higher than your own');
    }

    const member = await groupRepository.promoteMember(data.groupId, data.targetUserId, data.role, data.adminId);

    eventEmitter.emit(
      roleRank[data.role] > roleRank[target.role] ? 'MEMBER_PROMOTED' : 'MEMBER_DEMOTED', 
      {
        eventId: crypto.randomUUID(),
        eventType: roleRank[data.role] > roleRank[target.role] ? 'MEMBER_PROMOTED' : 'MEMBER_DEMOTED',
        timestamp: new Date(),
        version: '1',
        source: 'groups-module',
        correlationId: correlationId || crypto.randomUUID(),
        payload: {
          groupId: data.groupId,
          userId: data.targetUserId,
          role: data.role,
          [roleRank[data.role] > roleRank[target.role] ? 'promotedBy' : 'demotedBy']: data.adminId
        } as any
      }
    );

    return member;
  },

  async transferOwnership(data: ITransferOwnershipData, correlationId?: string) {
    const currentOwner = await groupRepository.getMember(data.groupId, data.currentOwnerId);
    if (!currentOwner || currentOwner.role !== GroupRole.OWNER) {
      throw new GroupError(403, 'Only the current owner can transfer ownership');
    }

    const newOwner = await groupRepository.getMember(data.groupId, data.newOwnerId);
    if (!newOwner) {
      throw new GroupError(404, 'Target user is not a member');
    }

    const member = await groupRepository.transferOwnership(data.groupId, data.currentOwnerId, data.newOwnerId);

    eventEmitter.emit('OWNERSHIP_TRANSFERRED', {
      eventId: crypto.randomUUID(),
      eventType: 'OWNERSHIP_TRANSFERRED',
      timestamp: new Date(),
      version: '1',
      source: 'groups-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        groupId: data.groupId,
        previousOwnerId: data.currentOwnerId,
        newOwnerId: data.newOwnerId
      }
    });

    return member;
  },

  async banMember(data: IBanMemberData, correlationId?: string) {
    const admin = await groupRepository.getMember(data.groupId, data.adminId);
    if (!admin) throw new GroupError(403, 'Not a member');

    if (admin.role !== GroupRole.OWNER && admin.role !== GroupRole.ADMIN) {
      throw new GroupError(403, 'Only owners and admins can ban members');
    }

    if (data.adminId === data.targetUserId) {
      throw new GroupError(400, 'Cannot ban yourself');
    }

    const target = await groupRepository.getMember(data.groupId, data.targetUserId);
    if (target) {
      if (roleRank[admin.role] <= roleRank[target.role]) {
        throw new GroupError(403, 'Cannot ban a member with an equal or higher role');
      }
    }

    const existingBan = await groupRepository.getBan(data.groupId, data.targetUserId);
    if (existingBan) throw new GroupError(409, 'User is already banned');

    const ban = await groupRepository.banMember(data);

    eventEmitter.emit('MEMBER_BANNED', {
      eventId: crypto.randomUUID(),
      eventType: 'MEMBER_BANNED',
      timestamp: new Date(),
      version: '1',
      source: 'groups-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        groupId: data.groupId,
        userId: data.targetUserId,
        bannedBy: data.adminId,
        reason: data.reason
      }
    });

    return ban;
  },

  async unbanMember(groupId: string, targetUserId: string, adminId: string, correlationId?: string) {
    const admin = await groupRepository.getMember(groupId, adminId);
    if (!admin || (admin.role !== GroupRole.OWNER && admin.role !== GroupRole.ADMIN)) {
      throw new GroupError(403, 'Only owners and admins can unban members');
    }

    const ban = await groupRepository.getBan(groupId, targetUserId);
    if (!ban) throw new GroupError(404, 'Ban not found');

    await groupRepository.unbanMember(groupId, targetUserId, adminId);

    eventEmitter.emit('MEMBER_UNBANNED', {
      eventId: crypto.randomUUID(),
      eventType: 'MEMBER_UNBANNED',
      timestamp: new Date(),
      version: '1',
      source: 'groups-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        groupId,
        userId: targetUserId,
        unbannedBy: adminId
      }
    });
  },

  async getBans(groupId: string, userId: string, limit?: number, cursor?: string) {
    const admin = await groupRepository.getMember(groupId, userId);
    if (!admin || (admin.role !== GroupRole.OWNER && admin.role !== GroupRole.ADMIN && admin.role !== GroupRole.MODERATOR)) {
      throw new GroupError(403, 'Insufficient permissions to view bans');
    }

    return groupRepository.getBans(groupId, limit, cursor);
  },

  async createInvite(data: ICreateInviteData, correlationId?: string) {
    const member = await groupRepository.getMember(data.groupId, data.userId);
    if (!member) throw new GroupError(403, 'Not a member');

    const group = await groupRepository.getGroupById(data.groupId);
    if (!group) throw new GroupError(404, 'Group not found');

    if (
      member.role === GroupRole.MEMBER && 
      !group.settings?.allowMemberInvites
    ) {
      throw new GroupError(403, 'Members are not allowed to create invites');
    }

    const inviteCode = crypto.randomBytes(6).toString('hex');
    const invite = await groupRepository.createInvite(data, inviteCode);

    eventEmitter.emit('INVITE_CREATED', {
      eventId: crypto.randomUUID(),
      eventType: 'INVITE_CREATED',
      timestamp: new Date(),
      version: '1',
      source: 'groups-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        groupId: data.groupId,
        inviteCode,
        creatorId: data.userId
      }
    });

    return invite;
  },

  async getInvites(groupId: string, userId: string) {
    const member = await groupRepository.getMember(groupId, userId);
    if (!member || member.role === GroupRole.MEMBER) {
      throw new GroupError(403, 'Insufficient permissions to view invites');
    }

    return groupRepository.getInvites(groupId);
  },

  async revokeInvite(inviteCode: string, adminId: string, correlationId?: string) {
    const invite = await groupRepository.getInviteByCode(inviteCode);
    if (!invite) throw new GroupError(404, 'Invite not found');

    const admin = await groupRepository.getMember(invite.groupId, adminId);
    if (!admin || memberCanNotRevoke(admin.role)) {
      throw new GroupError(403, 'Insufficient permissions to revoke invites');
    }

    const revoked = await groupRepository.revokeInvite(invite.groupId, inviteCode, adminId);

    eventEmitter.emit('INVITE_REVOKED', {
      eventId: crypto.randomUUID(),
      eventType: 'INVITE_REVOKED',
      timestamp: new Date(),
      version: '1',
      source: 'groups-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        groupId: invite.groupId,
        inviteCode,
        revokedBy: adminId
      }
    });

    return revoked;
  },

  async createJoinRequest(data: IJoinRequestData, correlationId?: string) {
    const group = await groupRepository.getGroupById(data.groupId);
    if (!group) throw new GroupError(404, 'Group not found');

    if (group.visibility === GroupVisibility.PUBLIC) {
      throw new GroupError(400, 'Group is public, no request needed');
    }

    const member = await groupRepository.getMember(data.groupId, data.userId);
    if (member) throw new GroupError(409, 'Already a member');

    const ban = await groupRepository.getBan(data.groupId, data.userId);
    if (ban) throw new GroupError(403, 'You are banned from this group');

    const existing = await groupRepository.getPendingJoinRequest(data.groupId, data.userId);
    if (existing) throw new GroupError(409, 'You already have a pending join request');

    const request = await groupRepository.createJoinRequest(data.groupId, data.userId);

    eventEmitter.emit('JOIN_REQUEST_SUBMITTED', {
      eventId: crypto.randomUUID(),
      eventType: 'JOIN_REQUEST_SUBMITTED',
      timestamp: new Date(),
      version: '1',
      source: 'groups-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        groupId: data.groupId,
        userId: data.userId,
        requestId: request.id
      }
    });

    return request;
  },

  async decideJoinRequest(data: IJoinRequestDecisionData, correlationId?: string) {
    const admin = await groupRepository.getMember(data.groupId, data.adminId);
    if (!admin || memberCanNotRevoke(admin.role)) { // Owner, Admin, Mod
      throw new GroupError(403, 'Insufficient permissions');
    }

    const request = await groupRepository.getJoinRequest(data.requestId);
    if (!request || request.groupId !== data.groupId) throw new GroupError(404, 'Join request not found');

    if (request.status !== JoinRequestStatus.PENDING) {
      throw new GroupError(400, 'Join request is already decided');
    }

    const decided = await groupRepository.decideJoinRequest(data);

    eventEmitter.emit(data.status === JoinRequestStatus.APPROVED ? 'JOIN_REQUEST_APPROVED' : 'JOIN_REQUEST_REJECTED', {
      eventId: crypto.randomUUID(),
      eventType: data.status === JoinRequestStatus.APPROVED ? 'JOIN_REQUEST_APPROVED' : 'JOIN_REQUEST_REJECTED',
      timestamp: new Date(),
      version: '1',
      source: 'groups-module',
      correlationId: correlationId || crypto.randomUUID(),
      payload: {
        groupId: data.groupId,
        userId: request.userId,
        requestId: request.id,
        [data.status === JoinRequestStatus.APPROVED ? 'approvedBy' : 'rejectedBy']: data.adminId
      } as any
    });

    return decided;
  },

  async getJoinRequests(groupId: string, userId: string, limit?: number, cursor?: string) {
    const admin = await groupRepository.getMember(groupId, userId);
    if (!admin || memberCanNotRevoke(admin.role)) { 
      throw new GroupError(403, 'Insufficient permissions to view join requests');
    }

    return groupRepository.getJoinRequests(groupId, limit, cursor);
  }
};

function memberCanNotRevoke(role: GroupRole) {
  return role === GroupRole.MEMBER;
}
