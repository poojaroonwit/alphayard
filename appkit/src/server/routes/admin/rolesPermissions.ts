/**
 * Admin Roles and Permissions API Routes
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissionCheck';
import rolePermissionService from '../../services/rolePermissionService';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken as any);
router.use(requireAdmin as any);

// ==========================================
// Current User Permission Routes
// ==========================================

/**
 * GET /admin/me/permissions
 * Get current user's permissions
 */
router.get('/me/permissions', async (req: any, res: Response) => {
  try {
    // Try multiple sources for user ID: req.admin (from authenticateAdmin), req.user (from authenticateToken), req.adminUser
    const userId = req.admin?.id || req.admin?.adminId || req.user?.id || req.adminUser?.id;
    if (!userId) {
      console.error('[/me/permissions] No user ID found. req.admin:', req.admin, 'req.user:', req.user);
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const permissions = await rolePermissionService.getUserPermissions(userId);
    const isSuperAdmin = await rolePermissionService.userIsSuperAdmin(userId);
    
    res.json({ 
      success: true, 
      permissions,
      is_super_admin: isSuperAdmin,
    });
  } catch (error: any) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch permissions' });
  }
});

// ==========================================
// Permission Routes
// ==========================================

/**
 * GET /admin/permissions
 * Get all permissions
 */
router.get('/permissions', async (req: Request, res: Response) => {
  try {
    const permissions = await rolePermissionService.getAllPermissions();
    res.json({ success: true, permissions });
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch permissions' });
  }
});

/**
 * GET /admin/permissions/grouped
 * Get permissions grouped by module
 */
router.get('/permissions/grouped', async (req: Request, res: Response) => {
  try {
    const grouped = await rolePermissionService.getPermissionsByModule();
    res.json({ success: true, permissions: grouped });
  } catch (error: any) {
    console.error('Error fetching grouped permissions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch permissions' });
  }
});

/**
 * POST /admin/permissions
 * Create a new permission (for extensibility)
 */
router.post('/permissions', async (req: Request, res: Response) => {
  try {
    const { module, action, description } = req.body;
    
    if (!module || !action) {
      return res.status(400).json({ error: 'Module and action are required' });
    }
    
    const permission = await rolePermissionService.createPermission(module, action, description);
    res.status(201).json({ success: true, permission });
  } catch (error: any) {
    console.error('Error creating permission:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Permission already exists' });
    }
    res.status(500).json({ error: error.message || 'Failed to create permission' });
  }
});

// ==========================================
// Role Routes
// ==========================================

/**
 * GET /admin/roles
 * Get all roles with counts
 */
router.get('/roles', async (req: Request, res: Response) => {
  try {
    const roles = await rolePermissionService.getAllRoles();
    res.json({ success: true, roles });
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch roles' });
  }
});

/**
 * GET /admin/roles/statistics
 * Get role and permission statistics
 */
router.get('/roles/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await rolePermissionService.getRoleStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch statistics' });
  }
});

/**
 * GET /admin/roles/:id
 * Get a single role with permission details
 */
router.get('/roles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await rolePermissionService.getRoleById(id);
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    res.json({ success: true, role });
  } catch (error: any) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch role' });
  }
});

/**
 * POST /admin/roles
 * Create a new role
 */
router.post('/roles', requirePermission('roles', 'create'), async (req: Request, res: Response) => {
  try {
    const { name, description, color, priority, permission_ids } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }
    
    // Check if role name already exists
    const existing = await rolePermissionService.getRoleByName(name);
    if (existing) {
      return res.status(409).json({ error: 'Role with this name already exists' });
    }
    
    const role = await rolePermissionService.createRole({
      name,
      description,
      color,
      priority,
      permission_ids,
    });
    
    res.status(201).json({ success: true, role });
  } catch (error: any) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: error.message || 'Failed to create role' });
  }
});

/**
 * PUT /admin/roles/:id
 * Update a role
 */
router.put('/roles/:id', requirePermission('roles', 'edit'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, color, priority, permission_ids } = req.body;
    
    const role = await rolePermissionService.updateRole(id, {
      name,
      description,
      color,
      priority,
      permission_ids,
    });
    
    res.json({ success: true, role });
  } catch (error: any) {
    console.error('Error updating role:', error);
    if (error.message === 'Role not found') {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.status(500).json({ error: error.message || 'Failed to update role' });
  }
});

/**
 * DELETE /admin/roles/:id
 * Delete a role
 */
router.delete('/roles/:id', requirePermission('roles', 'delete'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await rolePermissionService.deleteRole(id);
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting role:', error);
    if (error.message === 'Role not found') {
      return res.status(404).json({ error: 'Role not found' });
    }
    if (error.message === 'Cannot delete system roles') {
      return res.status(403).json({ error: error.message });
    }
    if (error.message === 'Cannot delete role with assigned users') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to delete role' });
  }
});

// ==========================================
// Role Permission Assignment Routes
// ==========================================

/**
 * GET /admin/roles/:id/permissions
 * Get permissions assigned to a role
 */
router.get('/roles/:id/permissions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const permissions = await rolePermissionService.getRolePermissions(id);
    res.json({ success: true, permissions });
  } catch (error: any) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch permissions' });
  }
});

/**
 * PUT /admin/roles/:id/permissions
 * Set all permissions for a role (replace existing)
 */
router.put('/roles/:id/permissions', requirePermission('roles', 'edit'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permission_ids } = req.body;
    
    if (!Array.isArray(permission_ids)) {
      return res.status(400).json({ error: 'permission_ids must be an array' });
    }
    
    await rolePermissionService.setRolePermissions(id, permission_ids);
    const updatedPermissions = await rolePermissionService.getRolePermissions(id);
    
    res.json({ success: true, permissions: updatedPermissions });
  } catch (error: any) {
    console.error('Error setting role permissions:', error);
    res.status(500).json({ error: error.message || 'Failed to set permissions' });
  }
});

/**
 * POST /admin/roles/:id/permissions/:permissionId
 * Assign a single permission to a role
 */
router.post('/roles/:id/permissions/:permissionId', requirePermission('roles', 'edit'), async (req: Request, res: Response) => {
  try {
    const { id, permissionId } = req.params;
    await rolePermissionService.assignPermissionToRole(id, permissionId);
    res.json({ success: true, message: 'Permission assigned' });
  } catch (error: any) {
    console.error('Error assigning permission:', error);
    res.status(500).json({ error: error.message || 'Failed to assign permission' });
  }
});

/**
 * DELETE /admin/roles/:id/permissions/:permissionId
 * Remove a single permission from a role
 */
router.delete('/roles/:id/permissions/:permissionId', requirePermission('roles', 'edit'), async (req: Request, res: Response) => {
  try {
    const { id, permissionId } = req.params;
    await rolePermissionService.removePermissionFromRole(id, permissionId);
    res.json({ success: true, message: 'Permission removed' });
  } catch (error: any) {
    console.error('Error removing permission:', error);
    res.status(500).json({ error: error.message || 'Failed to remove permission' });
  }
});

// ==========================================
// User Role Assignment Routes
// ==========================================

/**
 * GET /admin/users/:userId/role
 * Get user's role and permissions
 */
router.get('/users/:userId/role', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userRole = await rolePermissionService.getUserRoleAndPermissions(userId);
    
    if (!userRole) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, userRole });
  } catch (error: any) {
    console.error('Error fetching user role:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user role' });
  }
});

/**
 * PUT /admin/users/:userId/role
 * Assign a role to a user
 */
router.put('/users/:userId/role', requirePermission('admin_users', 'edit'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role_id } = req.body;
    
    if (!role_id) {
      return res.status(400).json({ error: 'role_id is required' });
    }
    
    await rolePermissionService.assignRoleToUser(userId, role_id);
    const userRole = await rolePermissionService.getUserRoleAndPermissions(userId);
    
    res.json({ success: true, userRole });
  } catch (error: any) {
    console.error('Error assigning role to user:', error);
    res.status(500).json({ error: error.message || 'Failed to assign role' });
  }
});

/**
 * GET /admin/users/:userId/permissions
 * Get all permissions for a user
 */
router.get('/users/:userId/permissions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const permissions = await rolePermissionService.getUserPermissions(userId);
    const isSuperAdmin = await rolePermissionService.userIsSuperAdmin(userId);
    
    res.json({ 
      success: true, 
      permissions,
      is_super_admin: isSuperAdmin,
    });
  } catch (error: any) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch permissions' });
  }
});

/**
 * GET /admin/users/:userId/check-permission
 * Check if a user has a specific permission
 */
router.get('/users/:userId/check-permission', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { module, action } = req.query;
    
    if (!module || !action) {
      return res.status(400).json({ error: 'module and action query params are required' });
    }
    
    const hasPermission = await rolePermissionService.userHasPermission(
      userId, 
      module as string, 
      action as string
    );
    
    res.json({ success: true, has_permission: hasPermission });
  } catch (error: any) {
    console.error('Error checking permission:', error);
    res.status(500).json({ error: error.message || 'Failed to check permission' });
  }
});

export default router;
