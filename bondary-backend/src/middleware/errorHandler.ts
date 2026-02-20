import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { auditService, AuditCategory, AuditAction } from '../services/auditService';

export const errorHandler = async (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    // Convert generic Error to ApiError
    const statusCode = (error as any).statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(message, statusCode, 'INTERNAL_ERROR', undefined, false);
    error.stack = err.stack;
  }

  const apiError = error as ApiError;

  // Enhanced error logging
  const errorContext = {
    message: apiError.message,
    code: apiError.code,
    statusCode: apiError.statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  };

  // Log to console (in production, this should go to a logging service)
  console.error('Error:', errorContext);

  // Log security-relevant errors to audit system
  if (apiError.statusCode >= 400 || apiError.code?.includes('SECURITY')) {
    try {
      await auditService.logAuditEvent({
        userId: errorContext.userId,
        action: AuditAction.SECURITY_ALERT,
        category: AuditCategory.SECURITY,
        description: `Security error: ${apiError.message}`,
        details: {
          error: apiError.code,
          statusCode: apiError.statusCode,
          url: req.url,
          method: req.method,
          userAgent: req.get('User-Agent'),
        },
        ipAddress: req.ip,
      });
    } catch (auditError) {
      console.error('Failed to log security audit:', auditError);
    }
  }

  const response = {
    success: false,
    error: {
      message: apiError.message,
      code: apiError.code || 'UNKNOWN_ERROR',
      ...(apiError.details && { details: apiError.details })
    },
    ...(process.env.NODE_ENV === 'development' && { stack: apiError.stack }),
    timestamp: new Date().toISOString()
  };

  res.status(apiError.statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
