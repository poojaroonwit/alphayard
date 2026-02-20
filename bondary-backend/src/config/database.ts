import { Pool, PoolConfig } from 'pg';
import { config } from './env';
import { prisma } from '../lib/prisma';

// Re-export Prisma client for easy migration
export { prisma };

/**
 * PostgreSQL Connection Pool Configuration
 * @deprecated Use prisma client instead for new code
 * Kept for backward compatibility during migration
 */
const poolConfig: PoolConfig = {
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    
    // Connection pool sizing
    // Rule: max = (num_cores * 2) + effective_spindle_count
    // For most setups: 20-50 connections per node
    max: parseInt(process.env.DB_POOL_MAX || '50', 10),
    min: parseInt(process.env.DB_POOL_MIN || '5', 10),
    
    // Timeout settings
    idleTimeoutMillis: 30000,           // Close idle clients after 30s
    connectionTimeoutMillis: 10000,      // Fail if can't connect in 10s
    
    // Statement timeout (prevent long-running queries)
    statement_timeout: 30000,            // 30 second max query time
    
    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
};

if (config.DATABASE_URL) {
    poolConfig.connectionString = config.DATABASE_URL;
}

export const pool = new Pool(poolConfig);

// Connection pool event handlers
pool.on('error', (err, client) => {
    console.error('[Database] Unexpected error on idle client:', err.message);
    // Don't exit - let the pool handle reconnection
});

pool.on('connect', (client) => {
    // Set search path and other session settings if needed
    client.query('SET statement_timeout = 30000');
});

// Pool statistics (useful for monitoring)
export function getPoolStats() {
    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
    };
}

// Log pool stats periodically in development
if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
        const stats = getPoolStats();
        if (stats.waitingCount > 0) {
            console.log('[Database] Pool stats:', stats);
        }
    }, 60000); // Every minute
}

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default {
    pool,
    query,
    getPoolStats,
    prisma
};
