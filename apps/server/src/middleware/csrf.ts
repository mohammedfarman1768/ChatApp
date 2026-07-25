import { doubleCsrf } from 'csrf-csrf';
import { env } from '../shared/config/index.js';
import { Request, Response, NextFunction } from 'express';

const { doubleCsrfProtection, generateToken, invalidCsrfTokenError } = doubleCsrf({
  getSecret: () => env.JWT_SECRET || 'fallback-secret-for-dev',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    sameSite: 'lax',
    path: '/',
    secure: env.NODE_ENV === 'production',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

export const csrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  return doubleCsrfProtection(req, res, next);
};

export const csrfErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error === invalidCsrfTokenError) {
    res.status(403).json({ error: 'invalid csrf token' });
  } else {
    next(error);
  }
};

export { generateToken };
