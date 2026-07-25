import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../shared/config/index.js';
import { UnauthorizedError } from '../shared/errors/index.js';
import { AuthPayload } from '../modules/auth/types.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends AuthPayload {}
    interface Request {
      user?: User;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return next(new UnauthorizedError('Authentication required'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch (error) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
};
