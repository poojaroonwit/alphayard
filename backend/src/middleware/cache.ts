import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('error', (err) => console.error('[REDIS] Cache Redis error:', err));

export const cacheUtils = {
  set: async (key: string, data: any, ttl?: number) => {
    try {
      const value = JSON.stringify(data);
      if (ttl) {
        await redisClient.setex(key, ttl, value);
      } else {
        await redisClient.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  get: async (key: string) => {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  delete: async (key: string) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }
};

export const cacheMiddleware = (prefix: string, ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();

    const key = `${prefix}:${req.originalUrl}`;
    try {
      const cached = await cacheUtils.get(key);
      if (cached) {
        return res.json(cached);
      }

      const originalJson = res.json;
      // @ts-ignore
      res.json = function(data: any) {
        cacheUtils.set(key, data, ttl);
        return originalJson.call(this, data);
      };
      next();
    } catch (error) {
      next();
    }
  };
};

export default redisClient;
