import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: any, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: (error as any).param,
        message: error.msg,
        value: (error as any).value
      }))
    });
    return;
  }
  
  next();
};
