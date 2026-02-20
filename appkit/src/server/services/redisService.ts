/**
 * Redis Service
 * 
 * Basic Redis service implementation for caching and session management.
 * In production, this would connect to a real Redis instance.
 */

class RedisService {
    private cache: Map<string, any> = new Map();
    private ttl: Map<string, number> = new Map();

    async connect(): Promise<void> {
        // In development, we'll use in-memory cache
        console.log('RedisService: Using in-memory cache for development');
    }

    async disconnect(): Promise<void> {
        this.cache.clear();
        this.ttl.clear();
    }

    async getClient(): Promise<any> {
        // Return a mock client interface for compatibility
        return {
            get: async (key: string) => await this.get(key),
            set: async (key: string, value: any, options?: any) => await this.set(key, value, options?.EX),
            del: async (key: string) => await this.del(key),
            exists: async (key: string) => await this.exists(key),
            incr: async (key: string) => await this.incr(key),
            expire: async (key: string, ttl: number) => await this.expire(key, ttl)
        };
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        this.cache.set(key, value);
        if (ttlSeconds) {
            this.ttl.set(key, Date.now() + ttlSeconds * 1000);
        }
    }

    async get(key: string): Promise<any> {
        // Check TTL
        const expiry = this.ttl.get(key);
        if (expiry && Date.now() > expiry) {
            this.cache.delete(key);
            this.ttl.delete(key);
            return null;
        }
        return this.cache.get(key) || null;
    }

    async del(key: string): Promise<void> {
        this.cache.delete(key);
        this.ttl.delete(key);
    }

    async exists(key: string): Promise<boolean> {
        const expiry = this.ttl.get(key);
        if (expiry && Date.now() > expiry) {
            this.cache.delete(key);
            this.ttl.delete(key);
            return false;
        }
        return this.cache.has(key);
    }

    async incr(key: string): Promise<number> {
        const current = await this.get(key);
        const newValue = (current || 0) + 1;
        await this.set(key, newValue);
        return newValue;
    }

    async expire(key: string, ttlSeconds: number): Promise<void> {
        if (this.cache.has(key)) {
            this.ttl.set(key, Date.now() + ttlSeconds * 1000);
        }
    }

    // Rate limiting helper
    async checkRateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
        const current = await this.get(key) || 0;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (current >= limit) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: windowStart + windowMs
            };
        }

        await this.incr(key);
        await this.expire(key, Math.ceil(windowMs / 1000));

        return {
            allowed: true,
            remaining: limit - current,
            resetTime: windowStart + windowMs
        };
    }
}

export default new RedisService();
