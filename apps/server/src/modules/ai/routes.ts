import { Router } from 'express';
import { aiController } from './controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { csrfMiddleware } from '../../middleware/csrf.js';
import { apiRateLimiter } from '../../middleware/rateLimiter.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// AI Specific Rate Limiter (20 requests per minute)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'Too many AI requests from this IP, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(requireAuth);
router.use(csrfMiddleware);
router.use(apiRateLimiter);
router.use(aiRateLimiter);

router.get('/capabilities', aiController.getCapabilities);
router.get('/usage', aiController.getUsage);
router.get('/preferences', aiController.getPreferences);
router.patch('/preferences', aiController.updatePreferences);

router.post('/summaries', aiController.generateSummary);
router.post('/smart-replies', aiController.generateSmartReplies);
router.post('/rewrite', aiController.rewriteMessage);
router.post('/translate', aiController.translateMessage);
router.post('/grammar', aiController.fixGrammar);
router.post('/moderation', aiController.runModeration);
router.post('/group-description', aiController.generateGroupDescription);
router.post('/group-rules', aiController.generateGroupRules);

export { router as aiRouter };
