/**
 * Chat Rate Limiter Middleware
 * 
 * Implements rate limiting for chat socket events to prevent abuse.
 */

import { Socket } from 'socket.io';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class ChatRateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { windowMs: 60000, maxRequests: 30 }) {
    this.config = config;
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request should be allowed
   */
  check(socketId: string, eventName: string): { allowed: boolean; remaining: number; resetTime: number } {
    const key = `${socketId}:${eventName}`;
    const now = Date.now();
    const entry = this.store[key];

    // If no entry or window expired, create new entry
    if (!entry || now > entry.resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count += 1;
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(socketId: string, eventName: string): void {
    const key = `${socketId}:${eventName}`;
    delete this.store[key];
  }

  /**
   * Get rate limit status
   */
  getStatus(socketId: string, eventName: string): { count: number; remaining: number; resetTime: number } {
    const key = `${socketId}:${eventName}`;
    const entry = this.store[key];
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return {
        count: 0,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      };
    }

    return {
      count: entry.count,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }
}

// Create rate limiter instances for different events
export const messageRateLimiter = new ChatRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 30, // 30 messages per minute
});

export const reactionRateLimiter = new ChatRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 60, // 60 reactions per minute
});

export const typingRateLimiter = new ChatRateLimiter({
  windowMs: 10000, // 10 seconds
  maxRequests: 20, // 20 typing events per 10 seconds
});

/**
 * Rate limit middleware for socket events
 */
export function createRateLimitMiddleware(limiter: ChatRateLimiter) {
  return (socket: Socket, eventName: string, next: (err?: Error) => void) => {
    const result = limiter.check(socket.id, eventName);

    if (!result.allowed) {
      socket.emit('rate-limit-exceeded', {
        event: eventName,
        message: 'Rate limit exceeded. Please slow down.',
        resetTime: result.resetTime,
      });
      return next(new Error('Rate limit exceeded'));
    }

    // Attach rate limit info to socket
    (socket as any).rateLimitInfo = {
      remaining: result.remaining,
      resetTime: result.resetTime,
    };

    next();
  };
}





