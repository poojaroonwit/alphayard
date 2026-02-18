import { Router } from 'express';
import { adminUserController } from '../../controllers/admin/AdminUserController';
import { adminSSOController } from '../../controllers/admin/AdminSSOController';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth';

const router = Router();

// ==================== AUTH ROUTES ====================

// Login (public route)
router.post('/login', adminUserController.login.bind(adminUserController));

// SSO Login (public route)
router.post('/sso/:provider', adminSSOController.ssoLogin.bind(adminSSOController));

// Get current user (requires authentication)
router.get('/me', authenticateAdmin as any, adminUserController.getCurrentUser.bind(adminUserController));

// Change password (requires authentication)
router.post('/change-password', authenticateAdmin as any, adminUserController.changePassword.bind(adminUserController));

// ==================== USER MANAGEMENT ROUTES ====================

// List all admin users (requires users:read permission)
router.get(
    '/admin-users',
    authenticateAdmin as any,
    requirePermission('users:read') as any,
    adminUserController.listUsers.bind(adminUserController)
);

// Create new admin user (requires users:write permission)
router.post(
    '/admin-users',
    authenticateAdmin as any,
    requirePermission('users:write') as any,
    adminUserController.createUser.bind(adminUserController)
);

// Update admin user (requires users:write permission)
router.put(
    '/admin-users/:id',
    authenticateAdmin as any,
    requirePermission('users:write') as any,
    adminUserController.updateUser.bind(adminUserController)
);

// Delete admin user (requires users:write permission)
router.delete(
    '/admin-users/:id',
    authenticateAdmin as any,
    requirePermission('users:write') as any,
    adminUserController.deleteUser.bind(adminUserController)
);

// ==================== ROLE MANAGEMENT ROUTES ====================

// List all roles (requires roles:read permission)
router.get(
    '/roles',
    authenticateAdmin as any,
    requirePermission('roles:read') as any,
    adminUserController.listRoles.bind(adminUserController)
);

export default router;
