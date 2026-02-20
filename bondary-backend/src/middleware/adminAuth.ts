import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../lib/prisma';
import { Application, AppScopedRequest } from './appScoping';


// ============================================================================
// Types
// ============================================================================

export interface AdminAppAccess {
  id: string;
  adminUserId: string;
  applicationId: string;
  role: 'viewer' | 'editor' | 'admin' | 'super_admin';
  permissions: string[];
  isPrimary: boolean;
  grantedAt: Date;
  lastAccessedAt: Date | null;
}

export interface AdminRequest extends AppScopedRequest {
  admin?: {
    id: string; // This is now users.id
    adminId?: string; // This is admin_users.id (optional)
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    permissions: string[];
    type: string;
    isSuperAdmin?: boolean;
    // Multi-tenant additions
    applications?: AdminAppAccess[];
    currentApp?: Application;
    currentAppAccess?: AdminAppAccess;
  };
}

// ============================================================================
// Cache for Admin-App Access
// ============================================================================

interface AdminAccessCache {
  applications: AdminAppAccess[];
  timestamp: number;
}

const adminAccessCache = new Map<string, AdminAccessCache>();
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Clear expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of adminAccessCache.entries()) {
    if (now - entry.timestamp > ADMIN_CACHE_TTL_MS) {
      adminAccessCache.delete(key);
    }
  }
}, 60 * 1000);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all applications an admin has access to
 */
async function getAdminApplications(adminId: string): Promise<AdminAppAccess[]> {
  const cached = adminAccessCache.get(adminId);
  if (cached && Date.now() - cached.timestamp < ADMIN_CACHE_TTL_MS) {
    return cached.applications;
  }

  try {
    // Use Prisma to fetch admin user applications with related application
    const adminAppAccesses = await prisma.adminUserApplication.findMany({
      where: {
        adminUserId: adminId,
        application: {
          isActive: true
        }
      },
      include: {
        application: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    const applications: AdminAppAccess[] = adminAppAccesses.map(row => ({
      id: row.id,
      adminUserId: row.adminUserId,
      applicationId: row.applicationId,
      role: row.role as 'viewer' | 'editor' | 'admin' | 'super_admin',
      permissions: (row.permissions as string[]) || [],
      isPrimary: row.isPrimary,
      grantedAt: row.createdAt,
      lastAccessedAt: row.createdAt
    }));

    adminAccessCache.set(adminId, { applications, timestamp: Date.now() });
    return applications;
  } catch (error) {
    console.error('[AdminAuth] Error fetching admin applications:', error);
    return [];
  }
}

/**
 * Check if admin is a super admin
 */
async function checkSuperAdmin(adminId: string): Promise<boolean> {
  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { isSuperAdmin: true }
    });
    return adminUser?.isSuperAdmin === true;
  } catch (error) {
    console.error('[AdminAuth] Error checking super admin status:', error);
    return false;
  }
}

/**
 * Update admin's last accessed timestamp for an application
 * Note: lastAccessedAt field not in schema, function is a no-op
 */
async function updateAdminLastAccessed(_adminId: string, _applicationId: string): Promise<void> {
  // lastAccessedAt field not available in current schema
  // This is a no-op until the schema is updated
}

/**
 * Clear admin access cache
 */
export function clearAdminAccessCache(adminId?: string): void {
  if (adminId) {
    adminAccessCache.delete(adminId);
  } else {
    adminAccessCache.clear();
  }
}

export const authenticateAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verify JWT token
    const jwtSecret = config.JWT_SECRET;
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Check if it's an admin token
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    // Get admin's application access
    const adminId = decoded.adminId || decoded.id;
    const [applications, isSuperAdmin] = await Promise.all([
      getAdminApplications(adminId),
      checkSuperAdmin(adminId)
    ]);

    // Add admin info to request
    req.admin = {
      id: decoded.id, // users.id
      adminId: decoded.adminId, // admin_users.id
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: decoded.role,
      permissions: decoded.permissions || [],
      type: decoded.type,
      isSuperAdmin,
      applications
    };

    // If there's an application context from appScopingMiddleware, validate access
    if (req.applicationId && req.application) {
      const appAccess = applications.find(a => a.applicationId === req.applicationId);
      
      if (appAccess || isSuperAdmin) {
        req.admin.currentApp = req.application;
        req.admin.currentAppAccess = appAccess || undefined;
        
        // Update last accessed timestamp (fire and forget)
        if (appAccess) {
          updateAdminLastAccessed(adminId, req.applicationId);
        }
      }
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired'
      });
    }

    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Middleware to check if admin has required permission
 * Usage: requirePermission('pages:write')
 */
export const requirePermission = (permission: string) => {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Not authenticated'
      });
    }

    const { permissions, isSuperAdmin } = req.admin;

    // Super admins have all permissions
    if (isSuperAdmin || permissions.includes('*')) {
      return next();
    }

    // Check for specific permission
    if (permissions.includes(permission)) {
      return next();
    }

    // Check app-specific permissions if there's a current app context
    if (req.admin.currentAppAccess?.permissions?.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: `Permission denied. Required: ${permission}`
    });
  };
};

/**
 * Middleware to require admin access to the current application
 * Must be used after authenticateAdmin and appScopingMiddleware
 */
export const requireAdminAppAccess = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.admin) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Not authenticated'
    });
  }

  if (!req.applicationId) {
    return res.status(400).json({
      error: 'Application context required',
      message: 'Please provide X-App-ID header'
    });
  }

  // Super admins can access any application
  if (req.admin.isSuperAdmin) {
    return next();
  }

  // Check if admin has access to this specific application
  const hasAccess = req.admin.applications?.some(
    app => app.applicationId === req.applicationId
  );

  if (!hasAccess) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You do not have access to this application'
    });
  }

  next();
};

/**
 * Middleware to require specific admin role within an application
 * Usage: requireAdminAppRole('admin') or requireAdminAppRole(['admin', 'super_admin'])
 */
export const requireAdminAppRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Not authenticated'
      });
    }

    // Super admins bypass role checks
    if (req.admin.isSuperAdmin) {
      return next();
    }

    // Check current app access role
    const currentRole = req.admin.currentAppAccess?.role;
    if (currentRole && allowedRoles.includes(currentRole)) {
      return next();
    }

    return res.status(403).json({
      error: 'Insufficient permissions',
      message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
    });
  };
};

// ============================================================================
// Utility Functions for Admin-App Management
// ============================================================================

/**
 * Grant admin access to an application
 */
export async function grantAdminAppAccess(
  adminUserId: string,
  applicationId: string,
  role: 'viewer' | 'editor' | 'admin' | 'super_admin' = 'admin',
  _grantedBy?: string
): Promise<AdminAppAccess | null> {
  try {
    const result = await prisma.adminUserApplication.upsert({
      where: {
        adminUserId_applicationId: {
          adminUserId,
          applicationId
        }
      },
      update: {
        role
      },
      create: {
        adminUserId,
        applicationId,
        role
      }
    });

    clearAdminAccessCache(adminUserId);
    
    return {
      id: result.id,
      adminUserId: result.adminUserId,
      applicationId: result.applicationId,
      role: result.role as 'viewer' | 'editor' | 'admin' | 'super_admin',
      permissions: (result.permissions as string[]) || [],
      isPrimary: result.isPrimary,
      grantedAt: result.createdAt,
      lastAccessedAt: result.createdAt
    };
  } catch (error) {
    console.error('[AdminAuth] Error granting admin access:', error);
    return null;
  }
}

/**
 * Revoke admin access from an application
 */
export async function revokeAdminAppAccess(
  adminUserId: string,
  applicationId: string
): Promise<boolean> {
  try {
    const result = await prisma.adminUserApplication.deleteMany({
      where: {
        adminUserId,
        applicationId
      }
    });

    clearAdminAccessCache(adminUserId);
    return result.count > 0;
  } catch (error) {
    console.error('[AdminAuth] Error revoking admin access:', error);
    return false;
  }
}

/**
 * Get all admins for an application
 */
export async function getApplicationAdmins(applicationId: string): Promise<any[]> {
  try {
    const admins = await prisma.adminUserApplication.findMany({
      where: { applicationId },
      include: {
        adminUser: true
      },
      orderBy: [
        { role: 'asc' },
        { adminUser: { email: 'asc' } }
      ]
    });

    return admins.map(aua => ({
      ...aua.adminUser,
      app_role: aua.role,
      granted_at: aua.createdAt,
      last_accessed_at: aua.createdAt
    }));
  } catch (error) {
    console.error('[AdminAuth] Error getting application admins:', error);
    return [];
  }
}
