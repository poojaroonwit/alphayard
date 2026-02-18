import { Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const requestIdMiddleware = (req: any, res: Response, next: NextFunction) => {
  const headerName = 'X-Request-Id';
  const existing = req.header(headerName);
  const requestId = existing && existing.trim().length > 0 ? existing : randomUUID();

  // Attach to request for downstream usage
  (req as any).requestId = requestId;

  // Set on response header for clients and log correlation
  res.setHeader(headerName, requestId);
  next();
};



