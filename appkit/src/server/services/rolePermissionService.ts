/**
 * Role and Permission Management Service
 * Handles CRUD operations for admin roles and permissions
 */

import { prisma } from '../lib/prisma';

// ==========================================
// Types
// ==========================================

export interface Permission {
  id: string;
  module: string;
  action: string;
  description: string | null;
  created_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  color: string;
  priority: number;
  created_at: Date;
  updated_at: Date;
  // Computed fields
  permission_count?: number;
  user_count?: number;
}

export interface RoleWithPermissions extends Role {
  permission_details: Permission[];
}

export interface AdminUserRole {
  user_id: string;
  role_id: string;
  role_name: string;
  permissions: Permission[];
}

// ==========================================
// Permission Operations
// ==========================================

/**
 * Get all permissions, optionally grouped by module
 */
export async function getAllPermissions(): Promise<Permission[]> {
  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT id, module, action, description, created_at
    FROM admin.admin_permissions
    ORDER BY module, action
  `);
  return result;
}

/**
 * Get permissions grouped by module for UI display
 */
export async function getPermissionsByModule(): Promise<Record<string, Permission[]>> {
  const permissions = await getAllPermissions();
  const grouped: Record<string, Permission[]> = {};
  
  for (const perm of permissions) {
    if (!grouped[perm.module]) {
      grouped[perm.module] = [];
    }
    grouped[perm.module].push(perm);
  }
  
  return grouped;
}

/**
 * Get permission by ID
 */
export async function getPermissionById(id: string): Promise<Permission | null> {
  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT id, module, action, description, created_at
    FROM admin.admin_permissions
    WHERE id = $1
  `, id);
  return result[0] || null;
}

/**
 * Create a new permission (for extensibility)
 */
export async function createPermission(
  module: string, 
  action: string, 
  description?: string
): Promise<Permission> {
  const result = await prisma.$queryRawUnsafe<any[]>(`
    INSERT INTO admin.admin_permissions (module, action, description)
    VALUES ($1, $2, $3)
    RETURNING id, module, action, description, created_at
  `, module, action, description || null);
  return result[0];
}

// ==========================================
// Role Operations
// ==========================================

/**
 * Get all roles with counts
 */
export async function getAllRoles(): Promise<Role[]> {
  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT 
      r.id,
      r.name,
      r.description,
      r.permissions,
      r.is_system,
      r.color,
      r.priority,
      r.created_at,
      r.updated_at,
      COUNT(DISTINCT rp.permission_id) as permission_count,
      COUNT(DISTINCT u.id) as user_count
    FROM admin.admin_roles r
    LEFT JOIN admin.admin_role_permissions rp ON rp.role_id = r.id
    LEFT JOIN admin.admin_users u ON u.role_id = r.id AND u.is_active = true
    GROUP BY r.id
    ORDER BY r.priority DESC, r.name
  `);
  
  return result.map((row: any) => ({
    ...row,
    permission_count: parseInt(row.permission_count) || 0,
    user_count: parseInt(row.user_count) || 0,
  }));
}

/**
 * Get a single role by ID with full permission details
 */
export async function getRoleById(id: string): Promise<RoleWithPermissions | null> {
  const roleResult = await prisma.$queryRawUnsafe<any[]>(`
    SELECT 
      r.id,
      r.name,
      r.description,
      r.permissions,
      r.is_system,
      r.color,
      r.priority,
      r.created_at,
      r.updated_at,
      COUNT(DISTINCT u.id) as user_count
    FROM admin.admin_roles r
    LEFT JOIN admin.admin_users u ON u.role_id = r.id AND u.is_active = true
    WHERE r.id = $1
    GROUP BY r.id
  `, id);
  
  if (roleResult.length === 0) {
    return null;
  }
  
  const role = roleResult[0];
  
  // Get assigned permissions
  const permissionsResult = await prisma.$queryRawUnsafe<any[]>(`
    SELECT p.id, p.module, p.action, p.description, p.created_at
    FROM admin.admin_permissions p
    JOIN admin.admin_role_permissions rp ON rp.permission_id = p.id
    WHERE rp.role_id = $1
    ORDER BY p.module, p.action
  `, id);
  
  return {
    ...role,
    user_count: parseInt(role.user_count) || 0,
    permission_count: permissionsResult.length,
    permission_details: permissionsResult,
  };
}

/**
 * Get role by name
 */
export async function getRoleByName(name: string): Promise<Role | null> {
  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT id, name, description, permissions, is_system, color, priority, created_at, updated_at
    FROM admin.admin_roles
    WHERE name = $1
  `, name);
  return result[0] || null;
}

/**
 * Create a new role
 */
export async function createRole(data: {
  name: string;
  description?: string;
  color?: string;
  priority?: number;
  permission_ids?: string[];
}): Promise<RoleWithPermissions> {
  return await prisma.$transaction(async (tx) => {
    // Create the role
    const roleResult = await tx.$queryRawUnsafe<any[]>(`
      INSERT INTO admin.admin_roles (name, description, color, priority, is_system, permissions)
      VALUES ($1, $2, $3, $4, false, '[]')
      RETURNING id, name, description, permissions, is_system, color, priority, created_at, updated_at
    `,
      data.name,
      data.description || null,
      data.color || '#3B82F6',
      data.priority || 0
    );
    
    const role = roleResult[0];
    
    // Assign permissions if provided
    if (data.permission_ids && data.permission_ids.length > 0) {
      const values = data.permission_ids.map((permId: string, idx: number) => 
        `($1, $${idx + 2})`
      ).join(', ');
      
      await tx.$queryRawUnsafe<any[]>(`
        INSERT INTO admin.admin_role_permissions (role_id, permission_id)
        VALUES ${values}
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `, role.id, ...data.permission_ids);
    }
    
    // Fetch and return the complete role
    return (await getRoleById(role.id))!;
  });
}

/**
 * Update a role
 */
export async function updateRole(id: string, data: {
  name?: string;
  description?: string;
  color?: string;
  priority?: number;
  permission_ids?: string[];
}): Promise<RoleWithPermissions> {
  return await prisma.$transaction(async (tx) => {
    // Check if role is system role (can only update description and permissions, not name)
    const existingRole = await getRoleById(id);
    if (!existingRole) {
      throw new Error('Role not found');
    }
    
    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.name !== undefined && !existingRole.is_system) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(data.color);
    }
    if (data.priority !== undefined && !existingRole.is_system) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(data.priority);
    }
    
    updates.push(`updated_at = NOW()`);
    
    if (updates.length > 1) { // More than just updated_at
      values.push(id);
      await tx.$queryRawUnsafe<any[]>(`
        UPDATE admin.admin_roles
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
      `, ...values);
    }
    
    // Update permissions if provided
    if (data.permission_ids !== undefined) {
      // Remove all existing permissions
      await tx.$queryRawUnsafe<any[]>(`
        DELETE FROM admin.admin_role_permissions
        WHERE role_id = $1
      `, id);
      
      // Add new permissions
      if (data.permission_ids.length > 0) {
        const permValues = data.permission_ids.map((permId: string, idx: number) => 
          `($1, $${idx + 2})`
        ).join(', ');
        
        await tx.$queryRawUnsafe<any[]>(`
          INSERT INTO admin.admin_role_permissions (role_id, permission_id)
          VALUES ${permValues}
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `, id, ...data.permission_ids);
      }
    }
    
    return (await getRoleById(id))!;
  });
}

/**
 * Delete a role
 */
export async function deleteRole(id: string): Promise<boolean> {
  // Check if role is system role
  const role = await getRoleById(id);
  if (!role) {
    throw new Error('Role not found');
  }
  if (role.is_system) {
    throw new Error('Cannot delete system roles');
  }
  if (role.user_count && role.user_count > 0) {
    throw new Error('Cannot delete role with assigned users');
  }
  
  await prisma.$queryRawUnsafe<any[]>('DELETE FROM admin.admin_roles WHERE id = $1', id);
  return true;
}

// ==========================================
// Role-Permission Assignment Operations
// ==========================================

/**
 * Get permissions for a role
 */
export async function getRolePermissions(roleId: string): Promise<Permission[]> {
  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT p.id, p.module, p.action, p.description, p.created_at
    FROM admin.admin_permissions p
    JOIN admin.admin_role_permissions rp ON rp.permission_id = p.id
    WHERE rp.role_id = $1
    ORDER BY p.module, p.action
  `, roleId);
  return result;
}

/**
 * Assign a permission to a role
 */
export async function assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
  await prisma.$queryRawUnsafe<any[]>(`
    INSERT INTO admin.admin_role_permissions (role_id, permission_id)
    VALUES ($1, $2)
    ON CONFLICT (role_id, permission_id) DO NOTHING
  `, roleId, permissionId);
}

/**
 * Remove a permission from a role
 */
export async function removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
  await prisma.$queryRawUnsafe<any[]>(`
    DELETE FROM admin.admin_role_permissions
    WHERE role_id = $1 AND permission_id = $2
  `, roleId, permissionId);
}

/**
 * Set all permissions for a role (replace existing)
 */
export async function setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
  return await prisma.$transaction(async (tx) => {
    // Remove all existing permissions
    await tx.$queryRawUnsafe<any[]>(`
      DELETE FROM admin.admin_role_permissions
      WHERE role_id = $1
    `, roleId);
    
    // Add new permissions
    if (permissionIds.length > 0) {
      const values = permissionIds.map((permId: string, idx: number) => 
        `($1, $${idx + 2})`
      ).join(', ');
      
      await tx.$queryRawUnsafe<any[]>(`
        INSERT INTO admin.admin_role_permissions (role_id, permission_id)
        VALUES ${values}
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `, roleId, ...permissionIds);
    }
  });
}

// ==========================================
// User-Role Operations
// ==========================================

/**
 * Get user's role and permissions
 */
export async function getUserRoleAndPermissions(userId: string): Promise<AdminUserRole | null> {
  // Check both admin_users.id and admin_users.user_id (for linked accounts)
  const userResult = await prisma.$queryRawUnsafe<any[]>(`
    SELECT u.id as user_id, r.id as role_id, r.name as role_name
    FROM admin.admin_users u
    LEFT JOIN admin.admin_roles r ON r.id = COALESCE(u.role_id, u.admin_role_id)
    WHERE (u.id = $1 OR u.user_id = $1) AND u.is_active = true
  `, userId);
  
  if (userResult.length === 0) {
    return null;
  }
  
  const user = userResult[0];
  
  if (!user.role_id) {
    return {
      user_id: user.user_id,
      role_id: '',
      role_name: '',
      permissions: [],
    };
  }
  
  const permissions = await getRolePermissions(user.role_id);
  
  return {
    user_id: user.user_id,
    role_id: user.role_id,
    role_name: user.role_name,
    permissions,
  };
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(userId: string, roleId: string): Promise<void> {
  await prisma.$queryRawUnsafe<any[]>(`
    UPDATE admin.admin_users
    SET role_id = $2, updated_at = NOW()
    WHERE id = $1
  `, userId, roleId);
}

/**
 * Check if a user has a specific permission
 */
export async function userHasPermission(
  userId: string, 
  module: string, 
  action: string
): Promise<boolean> {
  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT admin_has_permission($1, $2, $3) as has_permission
  `, userId, module, action);
  
  return result[0]?.has_permission || false;
}

/**
 * Get all permissions for a user (flattened list)
 */
export async function getUserPermissions(userId: string): Promise<{ module: string; action: string }[]> {
  // First check if user is super_admin - if so, return wildcard permission
  const isSuperAdmin = await userIsSuperAdmin(userId);
  if (isSuperAdmin) {
    // Super admin has all permissions - return wildcard
    return [{ module: '*', action: '*' }];
  }
  
  // Try to get permissions from admin_roles.permissions JSONB column
  try {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT r.permissions
      FROM admin.admin_users u
      JOIN admin.admin_roles r ON r.id = u.role_id
      WHERE u.id = $1 AND u.is_active = true
    `, userId);
    
    if (result.length > 0 && result[0].permissions) {
      const permissions = result[0].permissions;
      // If permissions include "*", return wildcard
      if (Array.isArray(permissions) && permissions.includes('*')) {
        return [{ module: '*', action: '*' }];
      }
      // Convert permissions array to module/action format
      // Format can be "module:action" or just "module" (all actions)
      return permissions.map((p: string) => {
        const [module, action] = p.split(':');
        return { module, action: action || '*' };
      });
    }
  } catch (error) {
    console.error('Error fetching permissions from roles:', error);
  }
  
  return [];
}

/**
 * Check if user has wildcard permission (super admin)
 */
export async function userIsSuperAdmin(userId: string): Promise<boolean> {
  // First check admin_users table
  const adminResult = await prisma.$queryRawUnsafe<any[]>(`
    SELECT EXISTS (
      SELECT 1
      FROM admin.admin_users u
      LEFT JOIN admin.admin_roles r ON r.id = u.role_id
      WHERE u.id = $1
        AND u.is_active = true
        AND (
          u.is_super_admin = true
          OR r.name = 'super_admin'
        )
    ) as is_super_admin
  `, userId);
  
  if (adminResult[0]?.is_super_admin) {
    return true;
  }
  
  // Fallback: Check if user exists in users table with admin/super_admin role
  const userResult = await prisma.$queryRawUnsafe<any[]>(`
    SELECT EXISTS (
      SELECT 1
      FROM core.users u
      WHERE u.id = $1
        AND u.is_active = true
        AND u.role IN ('admin', 'super_admin')
    ) as is_super_admin
  `, userId);
  
  return userResult[0]?.is_super_admin || false;
}

// ==========================================
// Statistics
// ==========================================

/**
 * Get role statistics
 */
export async function getRoleStatistics(): Promise<{
  total_roles: number;
  total_permissions: number;
  permissions_by_module: { module: string; count: number }[];
}> {
  const rolesCount = await prisma.$queryRawUnsafe<any[]>('SELECT COUNT(*) as count FROM admin.admin_roles');
  const permsCount = await prisma.$queryRawUnsafe<any[]>('SELECT COUNT(*) as count FROM admin.admin_permissions');
  const permsByModule = await prisma.$queryRawUnsafe<any[]>(`
    SELECT module, COUNT(*) as count
    FROM admin.admin_permissions
    GROUP BY module
    ORDER BY module
  `);
  
  return {
    total_roles: parseInt(rolesCount[0].count),
    total_permissions: parseInt(permsCount[0].count),
    permissions_by_module: permsByModule.map((r: any) => ({
      module: r.module,
      count: parseInt(r.count),
    })),
  };
}

export default {
  // Permissions
  getAllPermissions,
  getPermissionsByModule,
  getPermissionById,
  createPermission,
  
  // Roles
  getAllRoles,
  getRoleById,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  
  // Role-Permission assignments
  getRolePermissions,
  assignPermissionToRole,
  removePermissionFromRole,
  setRolePermissions,
  
  // User-Role operations
  getUserRoleAndPermissions,
  assignRoleToUser,
  userHasPermission,
  getUserPermissions,
  userIsSuperAdmin,
  
  // Statistics
  getRoleStatistics,
};
