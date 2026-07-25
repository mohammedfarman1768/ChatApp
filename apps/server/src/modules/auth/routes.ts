import { Router } from 'express';
import { authController } from './controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { csrfMiddleware } from '../../middleware/csrf.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';
import passport from 'passport';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/csrf:
 *   get:
 *     summary: Get CSRF token
 *     responses:
 *       200:
 *         description: CSRF token retrieved
 */
router.get('/csrf', authController.getCsrfToken);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', authRateLimiter, csrfMiddleware, authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     responses:
 *       200:
 *         description: Logged in successfully
 */
router.post('/login', authRateLimiter, csrfMiddleware, authController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     responses:
 *       200:
 *         description: Tokens refreshed
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     responses:
 *       200:
 *         description: User profile returned
 */
router.get('/me', requireAuth, authController.me);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout current session
 */
router.post('/logout', requireAuth, csrfMiddleware, authController.logout);

/**
 * @swagger
 * /api/v1/auth/logout-all:
 *   post:
 *     summary: Logout all sessions
 */
router.post('/logout-all', requireAuth, csrfMiddleware, authController.logoutAll);

/**
 * @swagger
 * /api/v1/auth/sessions:
 *   get:
 *     summary: Get all active sessions
 */
router.get('/sessions', requireAuth, authController.getSessions);

/**
 * @swagger
 * /api/v1/auth/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke a specific session
 */
router.delete('/sessions/:sessionId', requireAuth, csrfMiddleware, authController.deleteSession);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 */
router.post('/forgot-password', authRateLimiter, csrfMiddleware, authController.requestPasswordReset);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password
 */
router.post('/reset-password', authRateLimiter, csrfMiddleware, authController.resetPassword);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: Verify email address
 */
router.post('/verify-email', csrfMiddleware, authController.verifyEmail);

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Start Google OAuth flow
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 */
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }), 
  authController.googleCallback
);

export { router as authRouter };
