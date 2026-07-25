import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateData = (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req[target] = schema.parse(req[target]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        });
      } else {
        next(error);
      }
    }
  };
};
