import Redis from 'ioredis';
import { config } from '../config/env';

class RedisService {
    public client: Redis | null = null;
    private isConnected: boolean = false;

    /**
     * Initialize Redis connection
     */
    async connect(): Promise<void> {
        if (this.client && this.isConnected) {
            return;
        }

        const redisOptions: any = {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true,
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 100, 3000);
                return delay;
            },
        };

        if (config.REDIS_PASSWORD) {
            redisOptions.password = config.REDIS_PASSWORD;
        }

        try {
            if (config.REDIS_URL) {
                this.client = new Redis(config.REDIS_URL, redisOptions);
            } else {
                this.client = new Redis({
                    host: config.REDIS_HOST,
                    port: config.REDIS_PORT,
                    ...redisOptions
                });
            }

            // Universal error handler to prevent "Unhandled error event"
            this.client.on('error', (err) => {
                console.error('[RedisService] Redis error:', err.message);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                console.log('[RedisService] Connected to Redis');
            });

            this.client.on('close', () => {
                this.isConnected = false;
            });

            // Trigger connection
            await this.client.connect().catch(err => {
                console.warn('[RedisService] Early connection failed, ioredis will retry:', err.message);
            });
        } catch (error) {
            console.error('[RedisService] Failed to connect to Redis:', error);
            this.client = null;
            this.isConnected = false;
        }
    }

    /**
     * Get Redis client (auto-connects if needed)
     */
    public async getClient(): Promise<Redis | null> {
        if (!this.client || !this.isConnected) {
            await this.connect();
        }
        return this.client;
    }

    /**
     * Check if Redis is available
     */
    isAvailable(): boolean {
        return this.isConnected && this.client !== null;
    }

    // =============================================
    // BASIC KEY-VALUE OPERATIONS
    // =============================================

    /**
     * Get a value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        const client = await this.getClient();
        if (!client) return null;

        try {
            const value = await client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('[RedisService] Get error:', error);
            return null;
        }
    }

    /**
     * Set a value in cache with optional TTL (in seconds)
     */
    async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
        const client = await this.getClient();
        if (!client) return false;

        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await client.setex(key, ttlSeconds, serialized);
            } else {
                await client.set(key, serialized);
            }
            return true;
        } catch (error) {
            console.error('[RedisService] Set error:', error);
            return false;
        }
    }

    /**
     * Delete a key from cache
     */
    async del(key: string): Promise<boolean> {
        const client = await this.getClient();
        if (!client) return false;

        try {
            await client.del(key);
            return true;
        } catch (error) {
            console.error('[RedisService] Delete error:', error);
            return false;
        }
    }

    /**
     * Delete multiple keys matching a pattern
     */
    async delPattern(pattern: string): Promise<number> {
        const client = await this.getClient();
        if (!client) return 0;

        try {
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(...keys);
            }
            return keys.length;
        } catch (error) {
            console.error('[RedisService] Delete pattern error:', error);
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        const client = await this.getClient();
        if (!client) return false;

        try {
            const result = await client.exists(key);
            return result === 1;
        } catch (error) {
            return false;
        }
    }

    /**
     * Set expiration on a key
     */
    async expire(key: string, ttlSeconds: number): Promise<boolean> {
        const client = await this.getClient();
        if (!client) return false;

        try {
            await client.expire(key, ttlSeconds);
            return true;
        } catch (error) {
            return false;
        }
    }

    // =============================================
    // CACHING HELPERS
    // =============================================

    /**
     * Get or set pattern - returns cached value or fetches and caches
     */
    async getOrSet<T>(
        key: string, 
        fetchFn: () => Promise<T>, 
        ttlSeconds: number = 300
    ): Promise<T> {
        // Try to get from cache first
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Fetch fresh data
        const value = await fetchFn();
        
        // Cache the result
        await this.set(key, value, ttlSeconds);
        
        return value;
    }

    // =============================================
    // APPLICATION-SPECIFIC CACHE KEYS
    // =============================================

    /**
     * Cache application ID by slug (frequently queried)
     */
    async getApplicationId(slug: string): Promise<string | null> {
        return this.get<string>(`app:slug:${slug}`);
    }

    async setApplicationId(slug: string, id: string): Promise<boolean> {
        // Cache for 1 hour (apps don't change often)
        return this.set(`app:slug:${slug}`, id, 3600);
    }

    async invalidateApplicationCache(slug: string): Promise<boolean> {
        return this.del(`app:slug:${slug}`);
    }

    /**
     * Cache user session data
     */
    async getUserSession(userId: string): Promise<any | null> {
        return this.get(`session:user:${userId}`);
    }

    async setUserSession(userId: string, data: any, ttlSeconds: number = 3600): Promise<boolean> {
        return this.set(`session:user:${userId}`, data, ttlSeconds);
    }

    async invalidateUserSession(userId: string): Promise<boolean> {
        return this.del(`session:user:${userId}`);
    }

    /**
     * Cache entity by ID
     */
    async getEntity(entityId: string): Promise<any | null> {
        return this.get(`entity:${entityId}`);
    }

    async setEntity(entityId: string, entity: any, ttlSeconds: number = 300): Promise<boolean> {
        return this.set(`entity:${entityId}`, entity, ttlSeconds);
    }

    async invalidateEntity(entityId: string): Promise<boolean> {
        return this.del(`entity:${entityId}`);
    }

    /**
     * Cache circle data
     */
    async getCircle(circleId: string): Promise<any | null> {
        return this.get(`circle:${circleId}`);
    }

    async setCircle(circleId: string, data: any, ttlSeconds: number = 600): Promise<boolean> {
        return this.set(`circle:${circleId}`, data, ttlSeconds);
    }

    async invalidateCircle(circleId: string): Promise<boolean> {
        return this.del(`circle:${circleId}`);
    }

    // =============================================
    // RATE LIMITING
    // =============================================

    /**
     * Simple rate limiter
     * Returns true if request is allowed, false if rate limited
     */
    async rateLimit(
        key: string, 
        maxRequests: number, 
        windowSeconds: number
    ): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
        const client = await this.getClient();
        if (!client) {
            // If Redis unavailable, allow request
            return { allowed: true, remaining: maxRequests, resetIn: 0 };
        }

        const fullKey = `ratelimit:${key}`;

        try {
            const current = await client.incr(fullKey);
            
            if (current === 1) {
                // First request in window, set expiration
                await client.expire(fullKey, windowSeconds);
            }

            const ttl = await client.ttl(fullKey);
            const remaining = Math.max(0, maxRequests - current);
            
            return {
                allowed: current <= maxRequests,
                remaining,
                resetIn: ttl > 0 ? ttl : windowSeconds
            };
        } catch (error) {
            console.error('[RedisService] Rate limit error:', error);
            return { allowed: true, remaining: maxRequests, resetIn: 0 };
        }
    }

    // =============================================
    // COUNTERS & STATISTICS
    // =============================================

    /**
     * Increment a counter
     */
    async incr(key: string): Promise<number> {
        const client = await this.getClient();
        if (!client) return 0;

        try {
            return await client.incr(key);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get counter value
     */
    async getCounter(key: string): Promise<number> {
        const client = await this.getClient();
        if (!client) return 0;

        try {
            const value = await client.get(key);
            return value ? parseInt(value, 10) : 0;
        } catch (error) {
            return 0;
        }
    }

    // =============================================
    // PUB/SUB FOR REAL-TIME FEATURES
    // =============================================

    /**
     * Publish a message to a channel
     */
    async publish(channel: string, message: any): Promise<boolean> {
        const client = await this.getClient();
        if (!client) return false;

        try {
            await client.publish(channel, JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('[RedisService] Publish error:', error);
            return false;
        }
    }

    /**
     * Subscribe to a channel (returns a new client for subscription)
     */
    async subscribe(channel: string, callback: (message: any) => void): Promise<Redis | null> {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        try {
            const subscriber = new Redis(redisUrl);
            
            await subscriber.subscribe(channel);
            
            subscriber.on('message', (ch, message) => {
                if (ch === channel) {
                    try {
                        const parsed = JSON.parse(message);
                        callback(parsed);
                    } catch {
                        callback(message);
                    }
                }
            });
            
            return subscriber;
        } catch (error) {
            console.error('[RedisService] Subscribe error:', error);
            return null;
        }
    }

    // =============================================
    // CLEANUP
    // =============================================

    /**
     * Disconnect from Redis
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
            console.log('[RedisService] Disconnected from Redis');
        }
    }

    /**
     * Flush all keys (use with caution!)
     */
    async flushAll(): Promise<boolean> {
        const client = await this.getClient();
        if (!client) return false;

        try {
            await client.flushall();
            return true;
        } catch (error) {
            console.error('[RedisService] Flush error:', error);
            return false;
        }
    }
}

export default new RedisService();
