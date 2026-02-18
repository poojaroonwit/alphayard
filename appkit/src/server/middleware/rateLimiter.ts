import rateLimit from 'express-rate-limit';
// @ts-ignore
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { Request, Response, NextFunction, Application } from 'express';

import redisService from '../services/redisService';

const getStore = (prefix: string) => {
  return new RedisStore({
    // @ts-ignore
    sendCommand: async (...args: string[]) => {
      const client = await redisService.getClient();
      if (!client) return null;
      return await (client as any).call(...args);
    },
    prefix: `rate_limit:${prefix}:`,
  });
};

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { 
    error: 'Too many requests',
    retryAfter: 'Please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Auth rate limiter (more restrictive)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 20,
  message: { 
    error: 'Too many authentication attempts',
    retryAfter: 'Please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
  skipSuccessfulRequests: false,
});

// Password reset rate limiter (very restrictive)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 3 : 10,
  message: { 
    error: 'Too many password reset attempts',
    retryAfter: 'Please try again in 1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 50 : 200,
  message: { 
    error: 'Too many file uploads',
    retryAfter: 'Please try again in 1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

// Apply all rate limiters with specific routes
export const applyRateLimiters = (app: Application) => {
  // General API rate limiting
  app.use('/api/', generalLimiter);
  
  // Authentication endpoints (more restrictive)
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/refresh', authLimiter);
  
  // Password reset (very restrictive)
  app.use('/api/auth/forgot-password', passwordResetLimiter);
  app.use('/api/auth/reset-password', passwordResetLimiter);
  
  // File upload endpoints
  app.use('/api/files/upload', uploadLimiter);
  app.use('/api/upload', uploadLimiter);
  
  // Admin endpoints (moderate restriction)
  const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 200 : 1000,
    message: { error: 'Too many admin requests' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/admin/', adminLimiter);
  
  console.log('✅ Rate limiters applied successfully');
};
