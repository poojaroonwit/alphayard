import { Request, Response, NextFunction } from 'express';
import auditService from '../services/auditService';

// Generic audit middleware for admin routes
// Logs non-GET requests with status and basic metadata after response is sent
export const auditAdminRequests = function() {
  return function(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    // Only audit write operations
    const shouldAudit = req.method !== 'GET';
    const originalEnd = res.end;

    // @ts-ignore
    res.end = function(chunk?: any, encoding?: string | (() => void), cb?: () => void) {
      const durationMs = Date.now() - start;
      const statusCode = res.statusCode;
      
      try {
        if (shouldAudit) {
          const userId = (req as any).user && ((req as any).user.id || (req as any).user.userId) || null;
          const action = 'API_CALL';
          const path = req.originalUrl || req.url;
          
          const details = {
            method: req.method,
            path,
            statusCode,
            durationMs,
            requestId: (req as any).requestId,
          };
          
          // @ts-ignore
          auditService.logAPIEvent(userId, (auditService as any).auditActions[action] || action, path, details);
        }
      } catch (e) {
        // Do not block response on audit failure
        console.error('Audit middleware error:', e);
      }
      
      return originalEnd.call(this, chunk, encoding as any, cb as any);
    };

    next();
  };
};
