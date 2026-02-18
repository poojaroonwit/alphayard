// Identity Management Admin Routes
import { Router, Request, Response } from 'express';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import * as identityService from '../../services/identityService';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// =====================================================
// USER MANAGEMENT
// =====================================================

// Create new user
router.post('/users', requirePermission('users', 'create'), async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, role, status, emailVerified, sendWelcomeEmail } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user exists
    const existing = await prisma.$queryRawUnsafe<any[]>('SELECT id FROM core.users WHERE email = $1', email.toLowerCase());
    if (existing[0]) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO core.users (email, password_hash, first_name, last_name, phone_number, preferences, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, first_name, last_name, phone_number as phone, preferences, is_active, is_verified, created_at`,
      email.toLowerCase(), passwordHash, firstName, lastName, phone, 
      JSON.stringify({ role: role || 'user', status: status || 'active' }), 
      status !== 'inactive', emailVerified || false
    );
    
    const user = result[0];
    
    // Log action
    await identityService.logIdentityAction({
      actorType: 'admin',
      actorId: (req as any).admin?.id,
      actorEmail: (req as any).admin?.email,
      targetType: 'user',
      targetId: user.id,
      targetEmail: user.email,
      action: 'create_user',
      actionCategory: 'admin',
      description: `Created user ${user.email}`,
      newValue: { email: user.email, role: user.role, status: user.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Bulk user operations
router.post('/users/bulk', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { action, userIds, data } = req.body;
    
    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Action and userIds array are required' });
    }
    
    let affected = 0;
    
    switch (action) {
      case 'delete':
        const deleteResult = await prisma.$executeRawUnsafe(
          'DELETE FROM core.users WHERE id = ANY($1)',
          userIds
        );
        affected = deleteResult || 0;
        break;
        
      case 'suspend':
        const suspendResult = await prisma.$executeRawUnsafe(
          `UPDATE core.users SET is_active = false, preferences = preferences || '{"status": "suspended"}'::jsonb, updated_at = NOW() WHERE id = ANY($1)`,
          userIds
        );
        affected = suspendResult || 0;
        break;
        
      case 'activate':
        const activateResult = await prisma.$executeRawUnsafe(
          `UPDATE core.users SET is_active = true, preferences = preferences || '{"status": "active"}'::jsonb, updated_at = NOW() WHERE id = ANY($1)`,
          userIds
        );
        affected = activateResult || 0;
        break;
        
      case 'verify_email':
        const verifyResult = await prisma.$executeRawUnsafe(
          `UPDATE core.users SET is_verified = true, updated_at = NOW() WHERE id = ANY($1)`,
          userIds
        );
        affected = verifyResult || 0;
        break;
        
      case 'assign_role':
        if (!data?.role) {
          return res.status(400).json({ error: 'Role is required for assign_role action' });
        }
        const roleResult = await prisma.$executeRawUnsafe(
          `UPDATE core.users SET preferences = preferences || jsonb_build_object('role', $2::text), updated_at = NOW() WHERE id = ANY($1)`,
          userIds, data.role
        );
        affected = roleResult || 0;
        break;
        
      case 'add_to_group':
        if (!data?.groupId) {
          return res.status(400).json({ error: 'GroupId is required for add_to_group action' });
        }
        for (const userId of userIds) {
          await identityService.addUserToGroup(data.groupId, userId, 'member', (req as any).admin?.id);
          affected++;
        }
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Log bulk action
    await identityService.logIdentityAction({
      actorType: 'admin',
      actorId: (req as any).admin?.id,
      actorEmail: (req as any).admin?.email,
      targetType: 'user',
      action: `bulk_${action}`,
      actionCategory: 'admin',
      description: `Bulk ${action} on ${affected} users`,
      metadata: { userIds, action, data },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.json({ success: true, affected });
  } catch (error) {
    console.error('Error in bulk operation:', error);
    res.status(500).json({ error: 'Failed to perform bulk operation' });
  }
});

// Export users
router.get('/users/export', requirePermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const { format = 'json', status, role, startDate, endDate } = req.query;
    
    let query = `SELECT id, email, first_name, last_name, phone_number as phone, 
                        preferences->>'role' as role, 
                        (CASE WHEN is_active THEN 'active' ELSE 'inactive' END) as status, 
                        is_verified as email_verified, created_at, last_login_at
                 FROM core.users WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND (is_active = $${paramIndex++})`;
      params.push(status === 'active');
    }
    if (role) {
      query += ` AND preferences->>'role' = $${paramIndex++}`;
      params.push(role);
    }
    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await prisma.$queryRawUnsafe<any[]>(query, ...params);
    
    const users = result.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      role: row.role,
      status: row.status,
      emailVerified: row.email_verified,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at,
    }));
    
    if (format === 'csv') {
      const headers = 'ID,Email,First Name,Last Name,Phone,Role,Status,Email Verified,Created At,Last Login';
      const rows = users.map(u => 
        `${u.id},${u.email},${u.firstName || ''},${u.lastName || ''},${u.phone || ''},${u.role},${u.status},${u.emailVerified},${u.createdAt},${u.lastLoginAt || ''}`
      );
      const csv = [headers, ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
      return res.send(csv);
    }
    
    res.json({ users, total: users.length });
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// Assign role to user
router.post('/users/:id/role', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roleId, roleName } = req.body;
    
    // Get current user data
    const currentResult = await prisma.$queryRawUnsafe<any[]>('SELECT preferences->>\'role\' as role FROM core.users WHERE id = $1', id);
    if (!currentResult[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    const oldRole = currentResult[0].role;
    
    // Update user role
    await prisma.$executeRawUnsafe(
      'UPDATE core.users SET preferences = preferences || jsonb_build_object(\'role\', $2::text), updated_at = NOW() WHERE id = $1',
      id, roleName || 'user'
    );
    
    // Log action
    await identityService.logIdentityAction({
      actorType: 'admin',
      actorId: (req as any).admin?.id,
      actorEmail: (req as any).admin?.email,
      targetType: 'user',
      targetId: id,
      action: 'assign_role',
      actionCategory: 'admin',
      description: `Changed user role from ${oldRole} to ${roleName}`,
      oldValue: { role: oldRole },
      newValue: { role: roleName, roleId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
});

// =====================================================
// SESSION MANAGEMENT
// =====================================================

// Get user sessions
router.get('/users/:id/sessions', requirePermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeExpired } = req.query;
    
    const { sessions, total } = await identityService.getSessions(id, {
      includeExpired: includeExpired === 'true',
    });
    
    res.json({ sessions, total });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Revoke session
router.post('/sessions/:id/revoke', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const session = await identityService.getSessionById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    await identityService.revokeSession(id, (req as any).admin?.id, reason || 'Revoked by admin');
    
    // Log action
    await identityService.logIdentityAction({
      actorType: 'admin',
      actorId: (req as any).admin?.id,
      actorEmail: (req as any).admin?.email,
      targetType: 'session',
      targetId: id,
      action: 'revoke_session',
      actionCategory: 'security',
      description: `Revoked session for user ${session.userId}`,
      metadata: { reason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error revoking session:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

// Revoke all user sessions
router.post('/users/:id/sessions/revoke-all', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const count = await identityService.revokeAllSessions(id, undefined, (req as any).admin?.id);
    
    // Log action
    await identityService.logIdentityAction({
      actorType: 'admin',
      actorId: (req as any).admin?.id,
      actorEmail: (req as any).admin?.email,
      targetType: 'user',
      targetId: id,
      action: 'revoke_all_sessions',
      actionCategory: 'security',
      description: `Revoked ${count} sessions for user`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.json({ success: true, revokedCount: count });
  } catch (error) {
    console.error('Error revoking sessions:', error);
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
});

// =====================================================
// DEVICE MANAGEMENT
// =====================================================

// Get user devices
router.get('/users/:id/devices', requirePermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const devices = await identityService.getDevices(id);
    res.json({ devices });
  } catch (error) {
    console.error('Error getting devices:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// Trust/untrust device
router.post('/devices/:id/trust', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { trusted } = req.body;
    
    await identityService.trustDevice(id, trusted);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating device trust:', error);
    res.status(500).json({ error: 'Failed to update device trust' });
  }
});

// Block device
router.post('/devices/:id/block', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    await identityService.blockDevice(id, reason);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error blocking device:', error);
    res.status(500).json({ error: 'Failed to block device' });
  }
});

// Unblock device
router.post('/devices/:id/unblock', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await identityService.unblockDevice(id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error unblocking device:', error);
    res.status(500).json({ error: 'Failed to unblock device' });
  }
});

// Delete device
router.delete('/devices/:id', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await identityService.deleteDevice(id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// =====================================================
// MFA MANAGEMENT
// =====================================================

// Get user MFA settings
router.get('/users/:id/mfa', requirePermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mfaSettings = await identityService.getMFASettings(id);
    res.json({ mfaSettings });
  } catch (error) {
    console.error('Error getting MFA settings:', error);
    res.status(500).json({ error: 'Failed to get MFA settings' });
  }
});

// Disable user MFA
router.post('/users/:id/mfa/disable', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mfaType } = req.body;
    
    if (mfaType) {
      await identityService.disableMFA(id, mfaType);
    } else {
      // Disable all MFA
      const settings = await identityService.getMFASettings(id);
      for (const setting of settings) {
        await identityService.disableMFA(id, setting.mfaType);
      }
    }
    
    // Log action
    await identityService.logIdentityAction({
      actorType: 'admin',
      actorId: (req as any).admin?.id,
      actorEmail: (req as any).admin?.email,
      targetType: 'user',
      targetId: id,
      action: 'disable_mfa',
      actionCategory: 'security',
      description: `Disabled MFA${mfaType ? ` (${mfaType})` : ''} for user`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error disabling MFA:', error);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

// Generate new backup codes for user
router.post('/users/:id/mfa/backup-codes', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const codes = await identityService.generateBackupCodes(id);
    
    // Log action
    await identityService.logIdentityAction({
      actorType: 'admin',
      actorId: (req as any).admin?.id,
      actorEmail: (req as any).admin?.email,
      targetType: 'user',
      targetId: id,
      action: 'generate_backup_codes',
      actionCategory: 'security',
      description: 'Generated new MFA backup codes',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.json({ codes });
  } catch (error) {
    console.error('Error generating backup codes:', error);
    res.status(500).json({ error: 'Failed to generate backup codes' });
  }
});

// =====================================================
// SECURITY POLICIES
// =====================================================

// Get security policies
router.get('/security-policies', requirePermission('system', 'read'), async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.query;
    const policies = await identityService.getSecurityPolicies(applicationId as string);
    res.json({ policies });
  } catch (error) {
    console.error('Error getting security policies:', error);
    res.status(500).json({ error: 'Failed to get security policies' });
  }
});

// Get single security policy
router.get('/security-policies/:id', requirePermission('system', 'read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const policy = await identityService.getSecurityPolicy(id);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    res.json({ policy });
  } catch (error) {
    console.error('Error getting security policy:', error);
    res.status(500).json({ error: 'Failed to get security policy' });
  }
});

// Create security policy
router.post('/security-policies', requirePermission('system', 'manage'), async (req: Request, res: Response) => {
  try {
    const policy = await identityService.createSecurityPolicy(req.body);
    res.status(201).json({ policy });
  } catch (error) {
    console.error('Error creating security policy:', error);
    res.status(500).json({ error: 'Failed to create security policy' });
  }
});

// Update security policy
router.put('/security-policies/:id', requirePermission('system', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const policy = await identityService.updateSecurityPolicy(id, req.body);
    res.json({ policy });
  } catch (error) {
    console.error('Error updating security policy:', error);
    res.status(500).json({ error: 'Failed to update security policy' });
  }
});

// Delete security policy
router.delete('/security-policies/:id', requirePermission('system', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await identityService.deleteSecurityPolicy(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting security policy:', error);
    res.status(500).json({ error: 'Failed to delete security policy' });
  }
});

// =====================================================
// LOGIN HISTORY
// =====================================================

// Get login history
router.get('/login-history', requirePermission('audit', 'read'), async (req: Request, res: Response) => {
  try {
    const { userId, email, success, suspicious, startDate, endDate, limit, offset } = req.query;
    
    const { entries, total } = await identityService.getLoginHistory({
      userId: userId as string,
      email: email as string,
      success: success === 'true' ? true : success === 'false' ? false : undefined,
      suspicious: suspicious === 'true' ? true : suspicious === 'false' ? false : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });
    
    res.json({ entries, total });
  } catch (error) {
    console.error('Error getting login history:', error);
    res.status(500).json({ error: 'Failed to get login history' });
  }
});

// Get user login history
router.get('/users/:id/login-history', requirePermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit, offset } = req.query;
    
    const { entries, total } = await identityService.getLoginHistory({
      userId: id,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });
    
    res.json({ entries, total });
  } catch (error) {
    console.error('Error getting user login history:', error);
    res.status(500).json({ error: 'Failed to get login history' });
  }
});

// =====================================================
// OAUTH PROVIDERS
// =====================================================

// Get OAuth providers
router.get('/oauth-providers', requirePermission('system', 'read'), async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.query;
    const providers = await identityService.getOAuthProviders(applicationId as string);
    
    // Mask secrets
    const safeProviders = providers.map(p => ({
      ...p,
      clientSecret: p.clientSecret ? '••••••••' : null,
    }));
    
    res.json({ providers: safeProviders });
  } catch (error) {
    console.error('Error getting OAuth providers:', error);
    res.status(500).json({ error: 'Failed to get OAuth providers' });
  }
});

// Get single OAuth provider
router.get('/oauth-providers/:id', requirePermission('system', 'read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const provider = await identityService.getOAuthProvider(id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Mask secret
    res.json({
      provider: {
        ...provider,
        clientSecret: provider.clientSecret ? '••••••••' : null,
      },
    });
  } catch (error) {
    console.error('Error getting OAuth provider:', error);
    res.status(500).json({ error: 'Failed to get OAuth provider' });
  }
});

// Create OAuth provider
router.post('/oauth-providers', requirePermission('system', 'manage'), async (req: Request, res: Response) => {
  try {
    const provider = await identityService.createOAuthProvider(req.body);
    res.status(201).json({
      provider: {
        ...provider,
        clientSecret: '••••••••',
      },
    });
  } catch (error) {
    console.error('Error creating OAuth provider:', error);
    res.status(500).json({ error: 'Failed to create OAuth provider' });
  }
});

// Update OAuth provider
router.put('/oauth-providers/:id', requirePermission('system', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const provider = await identityService.updateOAuthProvider(id, req.body);
    res.json({
      provider: {
        ...provider,
        clientSecret: '••••••••',
      },
    });
  } catch (error) {
    console.error('Error updating OAuth provider:', error);
    res.status(500).json({ error: 'Failed to update OAuth provider' });
  }
});

// Delete OAuth provider
router.delete('/oauth-providers/:id', requirePermission('system', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await identityService.deleteOAuthProvider(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting OAuth provider:', error);
    res.status(500).json({ error: 'Failed to delete OAuth provider' });
  }
});

// =====================================================
// USER GROUPS
// =====================================================

// Get user groups
router.get('/groups', requirePermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.query;
    const groups = await identityService.getUserGroups(applicationId as string);
    res.json({ groups });
  } catch (error) {
    console.error('Error getting user groups:', error);
    res.status(500).json({ error: 'Failed to get user groups' });
  }
});

// Get single group
router.get('/groups/:id', requirePermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const group = await identityService.getUserGroup(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const members = await identityService.getGroupMembers(id);
    res.json({ group, members });
  } catch (error) {
    console.error('Error getting user group:', error);
    res.status(500).json({ error: 'Failed to get user group' });
  }
});

// Create user group
router.post('/groups', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const group = await identityService.createUserGroup(req.body);
    res.status(201).json({ group });
  } catch (error) {
    console.error('Error creating user group:', error);
    res.status(500).json({ error: 'Failed to create user group' });
  }
});

// Update user group
router.put('/groups/:id', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const group = await identityService.updateUserGroup(id, req.body);
    res.json({ group });
  } catch (error) {
    console.error('Error updating user group:', error);
    res.status(500).json({ error: 'Failed to update user group' });
  }
});

// Delete user group
router.delete('/groups/:id', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await identityService.deleteUserGroup(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user group:', error);
    res.status(500).json({ error: 'Failed to delete user group' });
  }
});

// Add user to group
router.post('/groups/:id/members', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    
    await identityService.addUserToGroup(id, userId, role, (req as any).admin?.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding user to group:', error);
    res.status(500).json({ error: 'Failed to add user to group' });
  }
});

// Remove user from group
router.delete('/groups/:groupId/members/:userId', requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { groupId, userId } = req.params;
    await identityService.removeUserFromGroup(groupId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing user from group:', error);
    res.status(500).json({ error: 'Failed to remove user from group' });
  }
});

// Get user's group memberships
router.get('/users/:id/groups', requirePermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const groups = await identityService.getUserGroupMemberships(id);
    res.json({ groups });
  } catch (error) {
    console.error('Error getting user groups:', error);
    res.status(500).json({ error: 'Failed to get user groups' });
  }
});

// =====================================================
// AUDIT LOG
// =====================================================

// Get audit log
router.get('/audit-log', requirePermission('audit', 'read'), async (req: Request, res: Response) => {
  try {
    const { actorId, targetId, action, actionCategory, startDate, endDate, limit, offset } = req.query;
    
    const { entries, total } = await identityService.getIdentityAuditLog({
      actorId: actorId as string,
      targetId: targetId as string,
      action: action as string,
      actionCategory: actionCategory as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });
    
    res.json({ entries, total });
  } catch (error) {
    console.error('Error getting audit log:', error);
    res.status(500).json({ error: 'Failed to get audit log' });
  }
});

// =====================================================
// ANALYTICS
// =====================================================

// Get user analytics
router.get('/analytics', requirePermission('analytics', 'read'), async (req: Request, res: Response) => {
  try {
    const { applicationId, startDate, endDate } = req.query;
    
    const analytics = await identityService.getUserAnalytics({
      applicationId: applicationId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    
    res.json(analytics);
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

export default router;
