/**
 * Permission Check Middleware
 * Enforces role-based access control on admin routes
 */

import { Request, Response, NextFunction } from 'express';
import rolePermissionService from '../services/rolePermissionService';

// Extended request type with admin user info
interface AdminRequest extends Request {
  adminUser?: {
    id: string;
    email: string;
    role_id?: string;
    role?: string;
  };
  // Support for authenticateAdmin middleware which uses 'admin' property
  admin?: {
    id: string;
    adminId?: string;
    email: string;
    role?: string;
    isSuperAdmin?: boolean;
  };
}

/**
 * Middleware to check if the admin user has a specific permission
 * @param module - The module name (e.g., 'users', 'roles', 'collections')
 * @param action - The action (e.g., 'view', 'create', 'edit', 'delete')
 */
export function requirePermission(module: string, action: string) {
  return async (req: AdminRequest, res: Response, next: NextFunction) => {
    try {
      // Support both 'admin' (from authenticateAdmin) and 'adminUser' properties
      const adminUser = req.admin || req.adminUser;
      
      if (!adminUser || !adminUser.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Use adminId if available (from authenticateAdmin), fallback to id
      const userId = (adminUser as any).adminId || adminUser.id;

      // Check if user is super admin (has wildcard permission)
      // First check isSuperAdmin flag from authenticateAdmin
      if ((adminUser as any).isSuperAdmin) {
        return next();
      }
      
      const isSuperAdmin = await rolePermissionService.userIsSuperAdmin(userId);
      if (isSuperAdmin) {
        return next();
      }

      // Check specific permission
      const hasPermission = await rolePermissionService.userHasPermission(
        userId,
        module,
        action
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Permission denied',
          required_permission: `${module}:${action}`,
          message: `You don't have permission to ${action} ${module}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

/**
 * Middleware to check if user has ANY of the specified permissions
 * @param permissions - Array of [module, action] tuples
 */
export function requireAnyPermission(permissions: [string, string][]) {
  return async (req: AdminRequest, res: Response, next: NextFunction) => {
    try {
      // Support both 'admin' (from authenticateAdmin) and 'adminUser' properties
      const adminUser = req.admin || req.adminUser;
      
      if (!adminUser || !adminUser.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Use adminId if available (from authenticateAdmin), fallback to id
      const userId = (adminUser as any).adminId || adminUser.id;

      // Check if user is super admin
      if ((adminUser as any).isSuperAdmin) {
        return next();
      }
      
      const isSuperAdmin = await rolePermissionService.userIsSuperAdmin(userId);
      if (isSuperAdmin) {
        return next();
      }

      // Check each permission
      for (const [module, action] of permissions) {
        const hasPermission = await rolePermissionService.userHasPermission(
          userId,
          module,
          action
        );
        if (hasPermission) {
          return next();
        }
      }

      return res.status(403).json({ 
        error: 'Permission denied',
        required_permissions: permissions.map(([m, a]) => `${m}:${a}`),
        message: 'You need at least one of the required permissions'
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

/**
 * Middleware to check if user has ALL of the specified permissions
 * @param permissions - Array of [module, action] tuples
 */
export function requireAllPermissions(permissions: [string, string][]) {
  return async (req: AdminRequest, res: Response, next: NextFunction) => {
    try {
      // Support both 'admin' (from authenticateAdmin) and 'adminUser' properties
      const adminUser = req.admin || req.adminUser;
      
      if (!adminUser || !adminUser.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Use adminId if available (from authenticateAdmin), fallback to id
      const userId = (adminUser as any).adminId || adminUser.id;

      // Check if user is super admin
      if ((adminUser as any).isSuperAdmin) {
        return next();
      }
      
      const isSuperAdmin = await rolePermissionService.userIsSuperAdmin(userId);
      if (isSuperAdmin) {
        return next();
      }

      // Check all permissions
      const missingPermissions: string[] = [];
      for (const [module, action] of permissions) {
        const hasPermission = await rolePermissionService.userHasPermission(
          userId,
          module,
          action
        );
        if (!hasPermission) {
          missingPermissions.push(`${module}:${action}`);
        }
      }

      if (missingPermissions.length > 0) {
        return res.status(403).json({ 
          error: 'Permission denied',
          missing_permissions: missingPermissions,
          message: 'You are missing required permissions'
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

/**
 * Helper to get user's permissions and attach to request
 * Use this early in the middleware chain to cache permissions
 */
export function loadUserPermissions() {
  return async (req: AdminRequest, res: Response, next: NextFunction) => {
    try {
      // Support both 'admin' (from authenticateAdmin) and 'adminUser' properties
      const adminUser = req.admin || req.adminUser;
      
      if (adminUser && adminUser.id) {
        const userId = (adminUser as any).adminId || adminUser.id;
        const permissions = await rolePermissionService.getUserPermissions(userId);
        const isSuperAdmin = (adminUser as any).isSuperAdmin || await rolePermissionService.userIsSuperAdmin(userId);
        
        // Attach permissions to request for use in route handlers
        (req as any).userPermissions = permissions;
        (req as any).isSuperAdmin = isSuperAdmin;
      }
      
      next();
    } catch (error) {
      console.error('Error loading user permissions:', error);
      next(); // Continue even if permission loading fails
    }
  };
}

/**
 * Check if request has a specific permission (after loadUserPermissions middleware)
 */
export function hasPermission(req: Request, module: string, action: string): boolean {
  if ((req as any).isSuperAdmin) return true;
  
  const permissions = (req as any).userPermissions || [];
  return permissions.some((p: any) => p.module === module && p.action === action);
}

export default {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  loadUserPermissions,
  hasPermission,
};
