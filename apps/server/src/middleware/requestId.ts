import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  const corrId = req.headers['x-correlation-id'] || reqId; // Default correlation ID to request ID if not provided

  req.headers['x-request-id'] = reqId;
  req.headers['x-correlation-id'] = corrId;
  
  res.setHeader('x-request-id', reqId);
  res.setHeader('x-correlation-id', corrId);

  next();
};
