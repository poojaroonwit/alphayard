import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import redisService from '../services/redisService';

// For backward compatibility with any direct redisClient usage within this file or elsewhere
// We use a Proxy to lazily access the centralized redisService
const redisClient = new Proxy({}, {
  get: (target, prop) => {
    // Return a function that will fetch the client and call the property
    return async (...args: any[]) => {
      const client = await redisService.getClient();
      if (!client) {
        console.error(`[REDIS_PROXY] Client not available for ${String(prop)}`);
        return null;
      }
      return await (client as any)[prop](...args);
    };
  }
});
export const cacheUtils = {
  set: async (key: string, data: any, ttl?: number) => {
    return await redisService.set(key, data, ttl);
  },

  get: async (key: string) => {
    return await redisService.get(key);
  },

  delete: async (key: string) => {
    return await redisService.del(key);
  },

  // @ts-ignore
  sendCommand: async (...args: any[]) => {
    const client = await redisService.getClient();
    if (!client) return null;
    return await (client as any).call(...args);
  },
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
