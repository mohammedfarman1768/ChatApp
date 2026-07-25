import { Router } from 'express';
import { usersController } from './controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { csrfMiddleware } from '../../middleware/csrf.js';

const router = Router();

// Ensure all user routes are authenticated
router.use(requireAuth);

// Profile routes
router.get('/me', usersController.getMyProfile);
router.patch('/me', csrfMiddleware, usersController.updateMyProfile);
router.patch('/me/privacy', csrfMiddleware, usersController.updateMyPrivacy);

// User search
router.get('/search', usersController.searchUsers);

// Public profile retrieval
router.get('/:username', usersController.getUserProfile);

// Friend requests
router.get('/friends/requests', usersController.getPendingRequests);
router.post('/friends/requests', csrfMiddleware, usersController.sendFriendRequest);
router.post('/friends/requests/:id/accept', csrfMiddleware, usersController.acceptFriendRequest);
router.post('/friends/requests/:id/reject', csrfMiddleware, usersController.rejectFriendRequest);
router.delete('/friends/requests/:id', csrfMiddleware, usersController.cancelFriendRequest);

// Friends
router.get('/me/friends', usersController.getFriends);
router.delete('/friends/:friendId', csrfMiddleware, usersController.removeFriend);

// Contacts
router.get('/me/contacts', usersController.getContacts);
router.post('/me/contacts', csrfMiddleware, usersController.addContact);
router.delete('/me/contacts/:contactUserId', csrfMiddleware, usersController.removeContact);

// Blocking
router.post('/blocks', csrfMiddleware, usersController.blockUser);
router.delete('/blocks/:blockedId', csrfMiddleware, usersController.unblockUser);

export { router as usersRouter };
