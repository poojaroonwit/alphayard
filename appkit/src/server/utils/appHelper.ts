import { prisma } from '../lib/prisma';
import redisService from '../services/redisService';

const DEFAULT_APP_SLUG = 'appkit';

/**
 * @deprecated Use `getDefaultApplicationId()` from middleware/appScoping.ts or
 * use `req.applicationId` from the request object after appScopingMiddleware runs.
 * 
 * Helper to get application ID with Redis caching
 * This is called frequently across services, so caching is critical
 */
export async function getAppKitApplicationId(): Promise<string | undefined> {
    return getDefaultAppId();
}

/**
 * Get the default application ID (appkit)
 * Use this as a fallback when no application context is provided
 */
export async function getDefaultAppId(): Promise<string | undefined> {
    const CACHE_KEY = DEFAULT_APP_SLUG;
    
    // Try Redis cache first
    const cachedId = await redisService.getApplicationId(CACHE_KEY);
    if (cachedId) {
        return cachedId;
    }

    // Query database - try both 'appkit' (new) and 'bondarys' (legacy) slugs
    const application = await prisma.application.findFirst({
        where: {
            slug: {
                in: ['appkit', 'bondarys']
            },
            isActive: true
        },
        orderBy: {
            slug: 'desc'
        }
    });
    
    const applicationId = application?.id;
    
    // Cache the result (1 hour TTL)
    if (applicationId) {
        await redisService.setApplicationId(CACHE_KEY, applicationId);
    }
    
    return applicationId;
}

/**
 * Get any application ID by slug with caching
 */
export async function getApplicationIdBySlug(slug: string): Promise<string | undefined> {
    // Try Redis cache first
    const cachedId = await redisService.getApplicationId(slug);
    if (cachedId) {
        return cachedId;
    }

    // Query database
    const application = await prisma.application.findFirst({
        where: {
            slug,
            isActive: true
        }
    });
    
    const applicationId = application?.id;
    
    // Cache the result (1 hour TTL)
    if (applicationId) {
        await redisService.setApplicationId(slug, applicationId);
    }
    
    return applicationId;
}

/**
 * Invalidate application cache (call when app settings change)
 */
export async function invalidateApplicationCache(slug: string): Promise<void> {
    await redisService.invalidateApplicationCache(slug);
}

/**
 * Get application ID from request or fall back to default
 * Use this in services that need an application context
 * 
 * @param req - Express request object (should have applicationId from appScopingMiddleware)
 * @returns Application ID from request or default application ID
 */
export async function getApplicationIdFromRequest(req: any): Promise<string | undefined> {
    // First try to get from request (set by appScopingMiddleware)
    if (req?.applicationId) {
        return req.applicationId;
    }
    
    // Fall back to default application
    return getDefaultAppId();
}

/**
 * Ensure application ID is available, throwing if not found
 * Use this when application context is required
 */
export async function requireApplicationId(req: any): Promise<string> {
    const appId = await getApplicationIdFromRequest(req);
    if (!appId) {
        throw new Error('Application context is required but not found');
    }
    return appId;
}
