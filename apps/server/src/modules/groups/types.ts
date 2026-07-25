import { GroupRole, JoinRequestStatus } from '@prisma/client';

export interface ICreateGroupData {
  name: string;
  description?: string;
  avatarMediaId?: string;
  userId: string; // The creator
}

export interface IUpdateGroupData {
  groupId: string;
  userId: string; // The updater
  name?: string;
  description?: string | null;
  avatarMediaId?: string | null;
  allowMemberInvites?: boolean;
  allowMemberNicknameChanges?: boolean;
  joinApprovalRequired?: boolean;
  slowModeSeconds?: number;
}

export interface ICreateInviteData {
  groupId: string;
  userId: string; // The creator
  maxUses?: number | null;
  expiresInHours?: number | null;
}

export interface IPromoteMemberData {
  groupId: string;
  adminId: string;
  targetUserId: string;
  role: GroupRole;
}

export interface IJoinGroupData {
  groupId: string;
  userId: string;
  inviteCode?: string;
}

export interface IJoinRequestData {
  groupId: string;
  userId: string;
}

export interface IJoinRequestDecisionData {
  groupId: string;
  adminId: string;
  requestId: string;
  status: JoinRequestStatus;
}

export interface ITransferOwnershipData {
  groupId: string;
  currentOwnerId: string;
  newOwnerId: string;
}

export interface IBanMemberData {
  groupId: string;
  adminId: string;
  targetUserId: string;
  reason?: string;
}

export class GroupError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'GroupError';
  }
}
