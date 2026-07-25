import { Router } from 'express';
import { chatController } from './controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { csrfMiddleware } from '../../middleware/csrf.js';
import { apiRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// All chat routes require authentication and rate limiting
router.use(requireAuth);
router.use(apiRateLimiter);

/**
 * @swagger
 * /api/v1/chat/conversations:
 *   get:
 *     summary: Get conversations for the current user
 *   post:
 *     summary: Create a new conversation or get existing
 */
router.route('/conversations')
  .get(chatController.getConversations)
  .post(csrfMiddleware, chatController.createConversation);

/**
 * @swagger
 * /api/v1/chat/conversations/{conversationId}:
 *   get:
 *     summary: Get details of a specific conversation
 */
router.route('/conversations/:conversationId')
  .get(chatController.getConversation);

/**
 * @swagger
 * /api/v1/chat/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get messages for a conversation
 *   post:
 *     summary: Send a message in a conversation
 */
router.route('/conversations/:conversationId/messages')
  .get(chatController.getMessages)
  .post(csrfMiddleware, chatController.sendMessage);

/**
 * @swagger
 * /api/v1/chat/messages/{messageId}:
 *   patch:
 *     summary: Edit a message
 *   delete:
 *     summary: Delete a message
 */
router.route('/messages/:messageId')
  .patch(csrfMiddleware, chatController.editMessage)
  .delete(csrfMiddleware, chatController.deleteMessage);

/**
 * @swagger
 * /api/v1/chat/messages/{messageId}/read:
 *   post:
 *     summary: Mark a message as read
 */
router.route('/messages/:messageId/read')
  .post(csrfMiddleware, chatController.markMessageRead);

/**
 * @swagger
 * /api/v1/chat/messages/{messageId}/reactions:
 *   post:
 *     summary: Add a reaction to a message
 */
router.route('/messages/:messageId/reactions')
  .post(csrfMiddleware, chatController.addReaction);

/**
 * @swagger
 * /api/v1/chat/messages/{messageId}/reactions/{emoji}:
 *   delete:
 *     summary: Remove a reaction from a message
 */
router.route('/messages/:messageId/reactions/:emoji')
  .delete(csrfMiddleware, chatController.removeReaction);

export { router as chatRouter };
