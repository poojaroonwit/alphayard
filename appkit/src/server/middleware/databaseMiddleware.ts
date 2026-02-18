import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

// Simple logger for middleware
const logger = {
  error: (...args: any[]) => console.error('[DB-MIDDLEWARE ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[DB-MIDDLEWARE WARN]', ...args),
  info: (...args: any[]) => console.info('[DB-MIDDLEWARE INFO]', ...args),
};

export const databaseHealthCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const healthStatus = { healthy: true };

    (req as any).databaseHealth = healthStatus;
    next();
  } catch (error) {
    logger.error('Database health check error:', error);
    return res.status(503).json({
      error: 'Database health check failed',
      message: 'Unable to verify database status',
      timestamp: new Date().toISOString()
    });
  }
};

export const databasePerformanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  const originalEnd = res.end;
  // @ts-ignore
  res.end = function (...args: any[]) {
    const responseTime = Date.now() - startTime;

    if (responseTime > 1000) {
      logger.warn('Slow database operation detected', {
        method: req.method,
        url: req.url,
        responseTime: `${responseTime}ms`,
      });
    }

    res.set('X-Response-Time', `${responseTime}ms`);
    (originalEnd as any).apply(this, args);
  };

  next();
};

export const databaseErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.code && (typeof error.code === 'string' && error.code.startsWith('PGRST'))) {
    logger.error('Database error:', {
      code: error.code,
      message: error.message,
      method: req.method,
      url: req.url,
    });

    let statusCode = 500;
    let userMessage = 'Database error occurred';

    switch (error.code) {
      case 'PGRST116': statusCode = 404; userMessage = 'Resource not found'; break;
      case 'PGRST301': statusCode = 409; userMessage = 'Resource already exists'; break;
      case 'PGRST204': statusCode = 403; userMessage = 'Access denied'; break;
    }

    return res.status(statusCode).json({
      error: 'Database Error',
      message: userMessage,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }

  next(error);
};
