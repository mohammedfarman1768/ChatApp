import { Router } from 'express';
import { callController } from './controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateData } from '../../middleware/validation.js';
import { csrfMiddleware } from '../../middleware/csrf.js';
import { apiRateLimiter } from '../../middleware/rateLimiter.js';
import { 
  CreateCallSchema, 
  CallActionSchema, 
  CallSignalSchema, 
  CallPaginationSchema 
} from '@repo/shared-validation';

const router = Router();

router.use(requireAuth);
router.use(apiRateLimiter);

// Start a call
router.post(
  '/',
  csrfMiddleware,
  validateData(CreateCallSchema, 'body'),
  callController.initiateCall
);

// Get recent calls
router.get(
  '/',
  validateData(CallPaginationSchema, 'query'),
  callController.getRecentCalls
);

// Get call details
router.get(
  '/:callId',
  validateData(CallActionSchema, 'params'),
  callController.getCallDetails
);

// Get call log/details (same as get details for Phase 9)
router.get(
  '/:callId/log',
  validateData(CallActionSchema, 'params'),
  callController.getCallDetails
);

// Accept call
router.post(
  '/:callId/accept',
  csrfMiddleware,
  validateData(CallActionSchema, 'params'),
  callController.acceptCall
);

// Reject call
router.post(
  '/:callId/reject',
  csrfMiddleware,
  validateData(CallActionSchema, 'params'),
  callController.rejectCall
);

// Cancel call
router.post(
  '/:callId/cancel',
  csrfMiddleware,
  validateData(CallActionSchema, 'params'),
  callController.cancelCall
);

// End call
router.post(
  '/:callId/end',
  csrfMiddleware,
  validateData(CallActionSchema, 'params'),
  callController.endCall
);

// Persist signals
router.post(
  '/:callId/signals',
  csrfMiddleware,
  validateData(CallActionSchema, 'params'),
  validateData(CallSignalSchema, 'body'),
  callController.persistSignal
);

export default router;
