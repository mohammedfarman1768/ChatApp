import { Router } from 'express';
import { groupMessageController } from './controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateData } from '../../middleware/validation.js';
import { 
  SendGroupMessageSchema,
  EditGroupMessageSchema,
  DeleteGroupMessageSchema,
  GroupMessageReactionSchema,
  GroupMessagePaginationSchema,
  PinMessageSchema,
  AnnouncementSchema
} from '@repo/shared-validation';

const router = Router();

router.use(requireAuth);

// Messages
router.get(
  '/:groupId/messages',
  validateData(GroupMessagePaginationSchema, 'query'),
  groupMessageController.getMessages
);

router.post(
  '/:groupId/messages',
  validateData(SendGroupMessageSchema, 'body'),
  groupMessageController.sendMessage
);

router.patch(
  '/:groupId/messages/:messageId',
  validateData(EditGroupMessageSchema, 'body'),
  groupMessageController.editMessage
);

router.delete(
  '/:groupId/messages/:messageId',
  validateData(DeleteGroupMessageSchema, 'body'),
  groupMessageController.deleteMessage
);

router.post(
  '/:groupId/messages/:messageId/read',
  groupMessageController.markAsRead
);

// Reactions
router.post(
  '/:groupId/messages/:messageId/reactions',
  validateData(GroupMessageReactionSchema, 'body'),
  groupMessageController.addReaction
);

router.delete(
  '/:groupId/messages/:messageId/reactions/:emoji',
  groupMessageController.removeReaction
);

// Pins
router.post(
  '/:groupId/pins',
  validateData(PinMessageSchema, 'body'),
  groupMessageController.pinMessage
);

router.delete(
  '/:groupId/pins/:messageId',
  groupMessageController.unpinMessage
);

router.get(
  '/:groupId/pins',
  groupMessageController.getPins
);

// Announcements
router.post(
  '/:groupId/announcements',
  validateData(AnnouncementSchema, 'body'),
  groupMessageController.createAnnouncement
);

router.get(
  '/:groupId/announcements',
  validateData(GroupMessagePaginationSchema, 'query'),
  groupMessageController.getAnnouncements
);

// Metadata
router.get(
  '/:groupId/messages/meta',
  groupMessageController.getMeta
);

export default router;
