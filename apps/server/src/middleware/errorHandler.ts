import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/index.js';
import { logger } from '../shared/logger/index.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  logger.error({ err, reqId: req.headers['x-request-id'] }, 'Unhandled error');
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
};
