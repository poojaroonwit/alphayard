import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppScopedRequest } from './appScoping';

// ============================================================================
// Types
// ============================================================================

export interface UserAppAccess {
    id: string;
    userId: string;
    applicationId: string;
    role: 'member' | 'moderator' | 'admin';
    status: 'active' | 'suspended' | 'pending';
    settings: Record<string, any>;
    joinedAt: Date;
    lastActiveAt: Date | null;
}

export interface TenantRequest extends AppScopedRequest {
    user?: {
        id: string;
        email?: string;
        [key: string]: any;
    };
    userAppAccess?: UserAppAccess;
}

// ============================================================================
// Cache for User-App Access
// ============================================================================

interface AccessCacheEntry {
    access: UserAppAccess | null;
    timestamp: number;
}

const accessCache = new Map<string, AccessCacheEntry>();
const ACCESS_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes (shorter than app cache)

// Clear expired cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of accessCache.entries()) {
        if (now - entry.timestamp > ACCESS_CACHE_TTL_MS) {
            accessCache.delete(key);
        }
    }
}, 30 * 1000); // Clean up every 30 seconds

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a user has access to an application
 */
async function getUserAppAccess(
    userId: string, 
    applicationId: string
): Promise<UserAppAccess | null> {
    const cacheKey = `${userId}:${applicationId}`;
    const cached = accessCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < ACCESS_CACHE_TTL_MS) {
        return cached.access;
    }

    try {
        const result = await prisma.userApplication.findFirst({
            where: {
                userId,
                applicationId,
                status: 'active'
            }
        });

        const access = result as UserAppAccess | null;
        accessCache.set(cacheKey, { access, timestamp: Date.now() });
        return access;
    } catch (error) {
        console.error('[TenantValidation] Error checking user app access:', error);
        return null;
    }
}

/**
 * Auto-assign user to application if they don't have access
 * This is useful for the default application
 */
async function autoAssignUserToApp(
    userId: string, 
    applicationId: string
): Promise<UserAppAccess | null> {
    try {
        const result = await prisma.userApplication.upsert({
            where: {
                userId_applicationId: {
                    userId,
                    applicationId
                }
            },
            update: {
                lastActiveAt: new Date()
            },
            create: {
                userId,
                applicationId,
                role: 'member',
                status: 'active',
                joinedAt: new Date()
            }
        });

        const access = result as UserAppAccess;
        const cacheKey = `${userId}:${applicationId}`;
        accessCache.set(cacheKey, { access, timestamp: Date.now() });
        return access;
    } catch (error) {
        console.error('[TenantValidation] Error auto-assigning user to app:', error);
    }

    return null;
}

/**
 * Update last active timestamp for user-app relationship
 */
async function updateLastActive(userId: string, applicationId: string): Promise<void> {
    try {
        await prisma.userApplication.updateMany({
            where: {
                userId,
                applicationId
            },
            data: {
                lastActiveAt: new Date()
            }
        });
    } catch (error) {
        // Non-critical, just log
        console.error('[TenantValidation] Error updating last active:', error);
    }
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Validate User Tenant Access
 * Checks if the authenticated user has access to the current application
 * 
 * Prerequisites:
 * - appScopingMiddleware must run before this
 * - User must be authenticated (req.user must exist)
 */
export const validateUserTenantAccess = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Check prerequisites
        if (!req.applicationId) {
            return res.status(400).json({
                error: 'Application context required',
                message: 'No application context found in request'
            });
        }

        if (!req.user?.id) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'User must be authenticated to access this resource'
            });
        }

        // Check user's access to this application
        let access = await getUserAppAccess(req.user.id, req.applicationId);

        // If no access found, try auto-assignment for default app
        if (!access && req.application?.slug === 'appkit') {
            access = await autoAssignUserToApp(req.user.id, req.applicationId);
        }

        if (!access) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have access to this application'
            });
        }

        if (access.status !== 'active') {
            return res.status(403).json({
                error: 'Access suspended',
                message: 'Your access to this application has been suspended'
            });
        }

        // Attach access info to request
        req.userAppAccess = access;

        // Update last active (fire and forget)
        updateLastActive(req.user.id, req.applicationId);

        next();
    } catch (error) {
        console.error('[TenantValidation] Middleware error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to validate tenant access'
        });
    }
};

/**
 * Optional User Tenant Validation
 * Same as validateUserTenantAccess but allows requests without authentication
 * Useful for public endpoints that behave differently for authenticated users
 */
export const optionalUserTenantValidation = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // If no user or no app context, just continue
        if (!req.user?.id || !req.applicationId) {
            return next();
        }

        // Check user's access to this application
        const access = await getUserAppAccess(req.user.id, req.applicationId);

        if (access && access.status === 'active') {
            req.userAppAccess = access;
            updateLastActive(req.user.id, req.applicationId);
        }

        next();
    } catch (error) {
        console.error('[TenantValidation] Optional validation error:', error);
        // Don't block the request
        next();
    }
};

/**
 * Require specific role within application
 * Usage: requireAppRole('admin') or requireAppRole(['admin', 'moderator'])
 */
export const requireAppRole = (roles: string | string[]) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req: TenantRequest, res: Response, next: NextFunction) => {
        if (!req.userAppAccess) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'User app access not validated'
            });
        }

        if (!allowedRoles.includes(req.userAppAccess.role)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear access cache for a user
 */
export function clearUserAccessCache(userId: string, applicationId?: string): void {
    if (applicationId) {
        accessCache.delete(`${userId}:${applicationId}`);
    } else {
        // Clear all entries for this user
        for (const key of accessCache.keys()) {
            if (key.startsWith(`${userId}:`)) {
                accessCache.delete(key);
            }
        }
    }
}

/**
 * Grant user access to an application
 */
export async function grantUserAppAccess(
    userId: string,
    applicationId: string,
    role: 'member' | 'moderator' | 'admin' = 'member'
): Promise<UserAppAccess | null> {
    try {
        const result = await prisma.userApplication.upsert({
            where: {
                userId_applicationId: {
                    userId,
                    applicationId
                }
            },
            update: {
                role,
                status: 'active',
                updatedAt: new Date()
            },
            create: {
                userId,
                applicationId,
                role,
                status: 'active',
                joinedAt: new Date()
            }
        });

        clearUserAccessCache(userId, applicationId);
        return result as UserAppAccess;
    } catch (error) {
        console.error('[TenantValidation] Error granting user access:', error);
    }

    return null;
}

/**
 * Revoke user access from an application
 */
export async function revokeUserAppAccess(
    userId: string,
    applicationId: string
): Promise<boolean> {
    try {
        const result = await prisma.userApplication.updateMany({
            where: {
                userId,
                applicationId
            },
            data: {
                status: 'suspended',
                updatedAt: new Date()
            }
        });

        clearUserAccessCache(userId, applicationId);
        return result.count > 0;
    } catch (error) {
        console.error('[TenantValidation] Error revoking user access:', error);
        return false;
    }
}

/**
 * Get all applications a user has access to
 */
export async function getUserApplications(userId: string): Promise<any[]> {
    try {
        const userApplications = await prisma.userApplication.findMany({
            where: {
                userId,
                status: 'active',
                application: {
                    isActive: true
                }
            },
            include: {
                application: true
            },
            orderBy: {
                joinedAt: 'desc'
            }
        });

        return userApplications.map(ua => ({
            ...ua.application,
            user_role: ua.role,
            access_status: ua.status,
            joined_at: ua.joinedAt
        }));
    } catch (error) {
        console.error('[TenantValidation] Error getting user applications:', error);
        return [];
    }
}
