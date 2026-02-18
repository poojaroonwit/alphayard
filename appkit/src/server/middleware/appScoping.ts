import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

// ============================================================================
// Types
// ============================================================================

export interface Application {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    branding: Record<string, any>;
    settings: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AppScopedRequest extends Request {
    applicationId?: string;
    application?: Application;
    appSlug?: string;
}

// ============================================================================
// In-Memory Cache for Application Lookups
// ============================================================================

interface CacheEntry {
    application: Application;
    timestamp: number;
}

const applicationCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_APP_SLUG = 'appkit';

// Clear expired cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of applicationCache.entries()) {
        if (now - entry.timestamp > CACHE_TTL_MS) {
            applicationCache.delete(key);
        }
    }
}, 60 * 1000); // Clean up every minute

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get application from cache or database
 */
async function getApplicationById(id: string): Promise<Application | null> {
    // Check cache first (by ID)
    const cacheKey = `id:${id}`;
    const cached = applicationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.application;
    }

    try {
        // Use Prisma to fetch application
        const dbApp = await prisma.application.findFirst({
            where: {
                id,
                isActive: true
            }
        });

        if (dbApp) {
            const app: Application = {
                id: dbApp.id,
                name: dbApp.name,
                slug: dbApp.slug,
                description: dbApp.description,
                branding: (dbApp.branding as Record<string, any>) || {},
                settings: (dbApp.settings as Record<string, any>) || {},
                isActive: dbApp.isActive,
                createdAt: dbApp.createdAt,
                updatedAt: dbApp.updatedAt
            };
            applicationCache.set(cacheKey, { application: app, timestamp: Date.now() });
            applicationCache.set(`slug:${app.slug}`, { application: app, timestamp: Date.now() });
            return app;
        }
    } catch (error) {
        console.error('[AppScoping] Error fetching application by ID:', error);
    }

    return null;
}

/**
 * Get application by slug from cache or database
 */
async function getApplicationBySlug(slug: string): Promise<Application | null> {
    // Check cache first (by slug)
    const cacheKey = `slug:${slug}`;
    const cached = applicationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.application;
    }

    try {
        // Use Prisma to fetch application by slug
        const dbApp = await prisma.application.findFirst({
            where: {
                slug,
                isActive: true
            }
        });

        if (dbApp) {
            const app: Application = {
                id: dbApp.id,
                name: dbApp.name,
                slug: dbApp.slug,
                description: dbApp.description,
                branding: (dbApp.branding as Record<string, any>) || {},
                settings: (dbApp.settings as Record<string, any>) || {},
                isActive: dbApp.isActive,
                createdAt: dbApp.createdAt,
                updatedAt: dbApp.updatedAt
            };
            applicationCache.set(cacheKey, { application: app, timestamp: Date.now() });
            applicationCache.set(`id:${app.id}`, { application: app, timestamp: Date.now() });
            return app;
        }
    } catch (error) {
        console.error('[AppScoping] Error fetching application by slug:', error);
    }

    return null;
}

/**
 * Get default application (appkit)
 */
async function getDefaultApplication(): Promise<Application | null> {
    return getApplicationBySlug(DEFAULT_APP_SLUG);
}

/**
 * Extract app identifier from subdomain
 * e.g., app1.example.com -> app1
 */
function extractFromSubdomain(hostname: string): string | null {
    if (!hostname) return null;
    
    // Skip localhost and IP addresses
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return null;
    }

    const parts = hostname.split('.');
    // Only extract if there are at least 3 parts (subdomain.domain.tld)
    if (parts.length >= 3) {
        const subdomain = parts[0];
        // Ignore common subdomains
        if (!['www', 'api', 'admin', 'app'].includes(subdomain)) {
            return subdomain;
        }
    }

    return null;
}

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * App Scoping Middleware
 * Extracts application context from request and validates it
 * 
 * Priority order:
 * 1. X-App-ID header (UUID)
 * 2. X-Application-ID header (UUID) - legacy support
 * 3. X-App-Slug header (slug string)
 * 4. Subdomain extraction
 * 5. Query parameter ?app_id or ?app_slug
 * 6. Default application (appkit)
 */
export const appScopingMiddleware = async (
    req: AppScopedRequest, 
    res: Response, 
    next: NextFunction
) => {
    try {
        let application: Application | null = null;
        let appIdentifier: string | null = null;

        // 1. Try X-App-ID header (UUID)
        const appIdHeader = req.headers['x-app-id'] as string;
        if (appIdHeader && isValidUUID(appIdHeader)) {
            appIdentifier = appIdHeader;
            application = await getApplicationById(appIdHeader);
        }

        // 2. Try X-Application-ID header (legacy, UUID)
        if (!application) {
            const legacyHeader = req.headers['x-application-id'] as string;
            if (legacyHeader && isValidUUID(legacyHeader)) {
                appIdentifier = legacyHeader;
                application = await getApplicationById(legacyHeader);
            }
        }

        // 3. Try X-App-Slug header (slug string)
        if (!application) {
            const slugHeader = req.headers['x-app-slug'] as string;
            if (slugHeader) {
                appIdentifier = slugHeader;
                application = await getApplicationBySlug(slugHeader);
            }
        }

        // 4. Try subdomain extraction
        if (!application) {
            const subdomain = extractFromSubdomain(req.hostname);
            if (subdomain) {
                appIdentifier = subdomain;
                application = await getApplicationBySlug(subdomain);
            }
        }

        // 5. Try query parameters
        if (!application) {
            const queryAppId = req.query.app_id as string;
            const queryAppSlug = req.query.app_slug as string;

            if (queryAppId && isValidUUID(queryAppId)) {
                appIdentifier = queryAppId;
                application = await getApplicationById(queryAppId);
            } else if (queryAppSlug) {
                appIdentifier = queryAppSlug;
                application = await getApplicationBySlug(queryAppSlug);
            }
        }

        // 6. Fall back to default application
        if (!application) {
            application = await getDefaultApplication();
        }

        // Set request properties
        if (application) {
            req.applicationId = application.id;
            req.application = application;
            req.appSlug = application.slug;
        }

        next();
    } catch (error) {
        console.error('[AppScoping] Middleware error:', error);
        // Don't block the request, continue without app context
        next();
    }
};

/**
 * Strict App Scoping Middleware
 * Same as appScopingMiddleware but returns 400 if no valid application found
 * Use this for routes that REQUIRE application context
 */
export const requireAppContext = async (
    req: AppScopedRequest, 
    res: Response, 
    next: NextFunction
) => {
    try {
        // Run the regular middleware first
        await new Promise<void>((resolve) => {
            appScopingMiddleware(req, res, () => resolve());
        });

        // Check if we have a valid application
        if (!req.applicationId || !req.application) {
            return res.status(400).json({
                error: 'Application context required',
                message: 'Please provide a valid X-App-ID header or X-App-Slug header'
            });
        }

        next();
    } catch (error) {
        console.error('[AppScoping] requireAppContext error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to resolve application context'
        });
    }
};

/**
 * Validate that the application exists and is active
 * Returns 403 if application is inactive or not found
 */
export const validateAppAccess = async (
    req: AppScopedRequest, 
    res: Response, 
    next: NextFunction
) => {
    if (!req.applicationId) {
        return res.status(400).json({
            error: 'Application context required',
            message: 'No application context found in request'
        });
    }

    if (!req.application?.isActive) {
        return res.status(403).json({
            error: 'Application inactive',
            message: 'The requested application is not active'
        });
    }

    next();
};

// ============================================================================
// Utility Functions (exported for use in services)
// ============================================================================

/**
 * Clear application cache (useful after updates)
 */
export function clearApplicationCache(appIdOrSlug?: string): void {
    if (appIdOrSlug) {
        applicationCache.delete(`id:${appIdOrSlug}`);
        applicationCache.delete(`slug:${appIdOrSlug}`);
    } else {
        applicationCache.clear();
    }
}

/**
 * Get application by ID or slug (for service layer use)
 */
export async function getApplication(idOrSlug: string): Promise<Application | null> {
    if (isValidUUID(idOrSlug)) {
        return getApplicationById(idOrSlug);
    }
    return getApplicationBySlug(idOrSlug);
}

/**
 * Get default application ID
 */
export async function getDefaultApplicationId(): Promise<string | null> {
    const app = await getDefaultApplication();
    return app?.id || null;
}
