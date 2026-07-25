import { Router } from 'express';
import { groupController } from './controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { csrfMiddleware } from '../../middleware/csrf.js';
import { apiRateLimiter } from '../../middleware/rateLimiter.js';
import { validateData } from '../../middleware/validation.js';
import { 
  CreateGroupSchema, 
  UpdateGroupSchema, 
  CreateGroupInviteSchema, 
  JoinGroupSchema, 
  PromoteMemberSchema, 
  TransferOwnershipSchema, 
  BanMemberSchema, 
  JoinRequestDecisionSchema,
  GroupPaginationSchema
} from '@repo/shared-validation';

const router = Router();

// All group routes require authentication and rate limiting
router.use(requireAuth);
router.use(apiRateLimiter);

// Group lifecycle
router.post('/', csrfMiddleware, validateData(CreateGroupSchema), groupController.createGroup);
router.get('/:groupId', groupController.getGroup);
router.patch('/:groupId', csrfMiddleware, validateData(UpdateGroupSchema), groupController.updateGroup);
router.delete('/:groupId', csrfMiddleware, groupController.deleteGroup);

// Membership
router.get('/:groupId/members', validateData(GroupPaginationSchema, 'query'), groupController.getMembers);
router.post('/:groupId/join', csrfMiddleware, validateData(JoinGroupSchema), groupController.joinGroup);
router.post('/:groupId/leave', csrfMiddleware, groupController.leaveGroup);
router.delete('/:groupId/members/:userId', csrfMiddleware, groupController.kickMember);

// Roles & ownership
router.patch('/:groupId/members/:userId/role', csrfMiddleware, validateData(PromoteMemberSchema), groupController.promoteMember);
router.post('/:groupId/transfer-ownership', csrfMiddleware, validateData(TransferOwnershipSchema), groupController.transferOwnership);

// Bans
router.post('/:groupId/bans', csrfMiddleware, validateData(BanMemberSchema), groupController.banMember);
router.delete('/:groupId/bans/:userId', csrfMiddleware, groupController.unbanMember);
router.get('/:groupId/bans', validateData(GroupPaginationSchema, 'query'), groupController.getBans);

// Invites
router.post('/:groupId/invites', csrfMiddleware, validateData(CreateGroupInviteSchema), groupController.createInvite);
router.get('/:groupId/invites', groupController.getInvites);
router.delete('/invites/:inviteCode', csrfMiddleware, groupController.revokeInvite);

// Join requests
router.post('/:groupId/join-requests', csrfMiddleware, groupController.createJoinRequest);
router.get('/:groupId/join-requests', validateData(GroupPaginationSchema, 'query'), groupController.getJoinRequests);
router.patch('/:groupId/join-requests/:requestId', csrfMiddleware, validateData(JoinRequestDecisionSchema), groupController.decideJoinRequest);

export { router as groupsRouter };
