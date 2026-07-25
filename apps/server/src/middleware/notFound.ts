import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../shared/errors/index.js';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Cannot find ${req.method} ${req.originalUrl}`));
};
