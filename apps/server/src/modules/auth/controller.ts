import { Request, Response, NextFunction } from 'express';
import { authService } from './service.js';
import { 
  registerSchema, 
  loginSchema, 
  resetPasswordSchema, 
  forgotPasswordSchema, 
  verifyEmailSchema 
} from '@repo/shared-validation';
import { generateToken } from '../../middleware/csrf.js';
import { env } from '../../shared/config/index.js';
import { eventEmitter } from '../../events/emitter.js';
import { AuthPayload } from './types.js';
import jwt from 'jsonwebtoken';

const setCookies = (res: Response, accessToken: string, refreshToken: string, expiresAt: Date) => {
  const isProduction = env.NODE_ENV === 'production';
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth/refresh',
    expires: expiresAt
  });
};

const clearCookies = (res: Response) => {
  const isProduction = env.NODE_ENV === 'production';
  res.clearCookie('accessToken', { path: '/', httpOnly: true, secure: isProduction, sameSite: 'lax' });
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh', httpOnly: true, secure: isProduction, sameSite: 'lax' });
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const user = await authService.register(data);
      
      eventEmitter.emit('USER_REGISTERED', {
        eventId: crypto.randomUUID(),
        eventType: 'USER_REGISTERED',
        timestamp: new Date(),
        version: '1',
        source: 'auth-module',
        correlationId: (req as any).correlationId || crypto.randomUUID(),
        payload: { userId: user.id }
      });

      res.status(201).json({ message: 'User registered. Please verify your email.' });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const deviceInfo = req.headers['user-agent'];
      const ipAddress = req.ip;

      const { accessToken, refreshToken, expiresAt } = await authService.login(
        data, 
        { userAgent: deviceInfo, ipAddress }
      );
      
      setCookies(res, accessToken, refreshToken, expiresAt);
      
      const payload = jwt.decode(accessToken) as AuthPayload;

      eventEmitter.emit('USER_LOGGED_IN', {
        eventId: crypto.randomUUID(),
        eventType: 'USER_LOGGED_IN',
        timestamp: new Date(),
        version: '1',
        source: 'auth-module',
        correlationId: (req as any).correlationId || crypto.randomUUID(),
        payload: { userId: payload.userId }
      });

      res.json({ message: 'Logged in successfully' });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const oldToken = req.cookies.refreshToken;
      if (!oldToken) return res.status(401).json({ message: 'Refresh token missing' });

      const deviceInfo = req.headers['user-agent'];
      const ipAddress = req.ip;

      const { accessToken, refreshToken, expiresAt } = await authService.refreshTokens(
        oldToken,
        { userAgent: deviceInfo, ipAddress }
      );

      setCookies(res, accessToken, refreshToken, expiresAt);
      res.json({ message: 'Token refreshed' });
    } catch (error) {
      clearCookies(res);
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      clearCookies(res);
      
      if (req.user) {
        const authUser = req.user as AuthPayload;
        eventEmitter.emit('USER_LOGGED_OUT', {
          eventId: crypto.randomUUID(),
          eventType: 'USER_LOGGED_OUT',
          timestamp: new Date(),
          version: '1',
          source: 'auth-module',
          correlationId: (req as any).correlationId || crypto.randomUUID(),
          payload: { userId: authUser.userId }
        });
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).send();
      const authUser = req.user as AuthPayload;
      await authService.logoutAll(authUser.userId);
      clearCookies(res);
      res.json({ message: 'Logged out of all devices' });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).send();
      const authUser = req.user as AuthPayload;
      // Usually fetch user from DB to get the latest profile
      const { authRepository } = await import('./repository.js');
      const user = await authRepository.findUserById(authUser.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isEmailVerified: user.isEmailVerified
      });
    } catch (error) {
      next(error);
    }
  },

  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).send();
      const authUser = req.user as AuthPayload;
      const sessions = await authService.getUserSessions(authUser.userId);
      res.json(sessions.map(s => ({
        id: s.id,
        deviceId: s.deviceId,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
      })));
    } catch (error) {
      next(error);
    }
  },

  async deleteSession(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).send();
      const authUser = req.user as AuthPayload;
      await authService.revokeSession(authUser.userId, req.params.sessionId);
      res.json({ message: 'Session revoked' });
    } catch (error) {
      next(error);
    }
  },

  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      await authService.requestPasswordReset(data.email);
      res.json({ message: 'If an account exists, an email was sent.' });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(data);
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const data = verifyEmailSchema.parse(req.body);
      await authService.verifyEmail(data.token);
      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      next(error);
    }
  },

  getCsrfToken(req: Request, res: Response) {
    res.json({ csrfToken: generateToken(req, res) });
  },

  async googleCallback(req: Request, res: Response) {
    // Reconstruct login logic for OAuth
    try {
      const user = req.user as any;
      if (!user) {
        return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
      }
      
      const deviceInfo = req.headers['user-agent'];
      const ipAddress = req.ip;

      const { accessToken, refreshToken, expiresAt } = await authService.createTokensAndSession(
        user.id,
        user.email,
        { userAgent: deviceInfo, ipAddress }
      );
      
      setCookies(res, accessToken, refreshToken, expiresAt);

      eventEmitter.emit('USER_LOGGED_IN', {
        eventId: crypto.randomUUID(),
        eventType: 'USER_LOGGED_IN',
        timestamp: new Date(),
        version: '1',
        source: 'auth-module',
        correlationId: (req as any).correlationId || crypto.randomUUID(),
        payload: { userId: user.id }
      });

      res.redirect(`${env.FRONTEND_URL}/dashboard`);
    } catch (err) {
      console.error(err);
      res.redirect(`${env.FRONTEND_URL}/login?error=internal`);
    }
  }
};
