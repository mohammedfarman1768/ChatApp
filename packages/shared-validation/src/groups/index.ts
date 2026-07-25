import { z } from 'zod';

export const GroupPaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  cursor: z.string().uuid().optional(),
});

export const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  avatarMediaId: z.string().optional(),
});

export const UpdateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  avatarMediaId: z.string().optional().nullable(),
  allowMemberInvites: z.boolean().optional(),
  allowMemberNicknameChanges: z.boolean().optional(),
  joinApprovalRequired: z.boolean().optional(),
  slowModeSeconds: z.number().min(0).max(3600).optional(),
});

export const CreateGroupInviteSchema = z.object({
  maxUses: z.number().min(1).max(10000).optional().nullable(),
  expiresInHours: z.number().min(1).max(8760).optional().nullable(),
});

export const JoinGroupSchema = z.object({
  inviteCode: z.string().min(1).optional(),
});

export const PromoteMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MODERATOR', 'MEMBER']),
});

export const TransferOwnershipSchema = z.object({
  newOwnerId: z.string().uuid(),
});

export const BanMemberSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const JoinRequestDecisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
