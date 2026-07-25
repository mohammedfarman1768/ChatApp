import { Router } from 'express';
import { groupCallController } from './controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateData } from '../../middleware/validation.js';
import { csrfMiddleware } from '../../middleware/csrf.js';
import { apiRateLimiter } from '../../middleware/rateLimiter.js';
import {
  CreateGroupCallSchema,
  GroupCallJoinSchema,
  GroupCallActionSchema,
  GroupCallSignalSchema,
  GroupCallPaginationSchema,
} from '@repo/shared-validation';

export const groupCallsRouter = Router({ mergeParams: true });

groupCallsRouter.use(requireAuth);
groupCallsRouter.use(apiRateLimiter);

// Since this is mounted under /api/v1/group-calls/groups/:groupId/calls or similar,
// let's assume it's mounted at `/api/v1/groups/:groupId/calls` (as per Phase 10 API spec).

// Lifecycle
groupCallsRouter.post(
  '/',
  csrfMiddleware,
  validateData(CreateGroupCallSchema, 'body'),
  groupCallController.initiateCall
);

groupCallsRouter.get(
  '/current',
  groupCallController.getActiveCall
);

groupCallsRouter.get(
  '/:callId',
  validateData(GroupCallActionSchema, 'params'),
  groupCallController.getCallDetails
);

groupCallsRouter.post(
  '/:callId/join',
  csrfMiddleware,
  validateData(GroupCallActionSchema, 'params'),
  validateData(GroupCallJoinSchema, 'body'),
  groupCallController.joinCall
);

groupCallsRouter.post(
  '/:callId/leave',
  csrfMiddleware,
  validateData(GroupCallActionSchema, 'params'),
  groupCallController.leaveCall
);

groupCallsRouter.post(
  '/:callId/end',
  csrfMiddleware,
  validateData(GroupCallActionSchema, 'params'),
  groupCallController.endCall
);

groupCallsRouter.post(
  '/:callId/cancel',
  csrfMiddleware,
  validateData(GroupCallActionSchema, 'params'),
  groupCallController.cancelCall
);

groupCallsRouter.get(
  '/',
  validateData(GroupCallPaginationSchema, 'query'),
  groupCallController.getRecentCalls
);

// Signaling
groupCallsRouter.post(
  '/:callId/signals',
  csrfMiddleware,
  validateData(GroupCallActionSchema, 'params'),
  validateData(GroupCallSignalSchema, 'body'),
  groupCallController.persistSignal
);
