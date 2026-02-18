import express, { Response } from 'express';
import { ApplicationModel } from '../../models/ApplicationModel';
import { authenticateAdmin, AdminRequest } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import { body, param, validationResult } from 'express-validator';
import { validateRequest } from '../../middleware/validation';
import ApplicationService from '../../services/ApplicationService';
import storageService from '../../services/storageService';

const router = express.Router();

// All application management routes require admin authentication
router.use(authenticateAdmin as any);

// ============================================================================
// Application CRUD Routes
// ============================================================================

// List all applications (for super admins) or admin's applications
router.get('/', requirePermission('applications', 'view'), async (req: AdminRequest, res: Response) => {
    try {
        // Super admins see all applications
        if (req.admin?.isSuperAdmin) {
            const applications = await ApplicationService.getAllApplications(true);
            return res.json({ applications });
        }
        
        // Regular admins see only their assigned applications
        if (req.admin?.adminId) {
            const applications = await ApplicationService.getAdminApplications(req.admin.adminId);
            return res.json({ applications });
        }
        
        // Fallback to all applications
        const applications = await ApplicationModel.findAll();
        res.json({ applications });
    } catch (error) {
        console.error('List applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// Get admin's assigned applications (for app switcher)
router.get('/my-apps', async (req: AdminRequest, res: Response) => {
    try {
        const adminId = req.admin?.adminId || req.admin?.id;
        if (!adminId) {
            return res.status(401).json({ error: 'Admin ID not found' });
        }

        // Super admins get all active applications
        if (req.admin?.isSuperAdmin) {
            const applications = await ApplicationService.getActiveApplications();
            return res.json({ applications });
        }

        // Regular admins get their assigned applications
        const applications = await ApplicationService.getAdminApplications(adminId);
        res.json({ applications });
    } catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// Get single application
router.get('/:id', requirePermission('applications', 'view'), async (req: any, res: Response) => {
    try {
        const application = await ApplicationService.getApplicationById(req.params.id);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json({ application });
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({ error: 'Failed to fetch application' });
    }
});

// Create new application
router.post('/', [
    body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
    body('slug').trim().isLength({ min: 1 }).withMessage('Slug is required'),
], validateRequest, requirePermission('applications', 'create'), async (req: AdminRequest, res: Response) => {
    try {
        const application = await ApplicationService.createApplication(req.body);
        
        // Auto-assign the creating admin to the new application
        if (application && req.admin?.adminId) {
            await ApplicationService.assignAdminToApplication({
                adminUserId: req.admin.adminId,
                applicationId: application.id,
                role: 'super_admin',
                isPrimary: false,
                grantedBy: req.admin.adminId
            });
        }
        
        res.status(201).json({ application });
    } catch (error: any) {
        console.error('Create application error:', error);
        if (error.message?.includes('already exists')) {
            return res.status(400).json({ error: 'Slug already exists' });
        }
        res.status(500).json({ error: 'Failed to create application' });
    }
});

// Update application
router.put('/:id', requirePermission('applications', 'edit'), async (req: any, res: Response) => {
    try {
        const application = await ApplicationService.updateApplication(req.params.id, req.body);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json({ application });
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ error: 'Failed to update application' });
    }
});

// Delete (deactivate) application
router.delete('/:id', requirePermission('applications', 'delete'), async (req: any, res: Response) => {
    try {
        const success = await ApplicationService.deleteApplication(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json({ success: true, message: 'Application deactivated' });
    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({ error: 'Failed to delete application' });
    }
});

// ============================================================================
// Application Statistics
// ============================================================================

router.get('/:id/stats', requirePermission('applications', 'view'), async (req: any, res: Response) => {
    try {
        const stats = await ApplicationService.getApplicationStats(req.params.id);
        if (!stats) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json({ stats });
    } catch (error) {
        console.error('Get application stats error:', error);
        res.status(500).json({ error: 'Failed to fetch application stats' });
    }
});

// ============================================================================
// User-Application Assignment Routes
// ============================================================================

// Get users for an application
router.get('/:id/users', requirePermission('applications', 'view'), async (req: any, res: Response) => {
    try {
        const { limit, offset, status } = req.query;
        const result = await ApplicationService.getApplicationUsers(req.params.id, {
            limit: parseInt(limit) || 50,
            offset: parseInt(offset) || 0,
            status: status as string
        });
        res.json(result);
    } catch (error) {
        console.error('Get application users error:', error);
        res.status(500).json({ error: 'Failed to fetch application users' });
    }
});

// Assign user to application
router.post('/:id/users', [
    body('user_id').isUUID().withMessage('Valid user ID is required'),
    body('role').optional().isIn(['member', 'moderator', 'admin']).withMessage('Invalid role'),
], validateRequest, requirePermission('applications', 'edit'), async (req: any, res: Response) => {
    try {
        const { user_id, role = 'member' } = req.body;
        const success = await ApplicationService.assignUserToApplication({
            userId: user_id,
            applicationId: req.params.id,
            role,
            status: 'active'
        });
        
        if (!success) {
            return res.status(400).json({ error: 'Failed to assign user' });
        }
        
        res.json({ success: true, message: 'User assigned to application' });
    } catch (error) {
        console.error('Assign user to application error:', error);
        res.status(500).json({ error: 'Failed to assign user' });
    }
});

// Update user's role in application
router.put('/:id/users/:userId', [
    body('role').isIn(['member', 'moderator', 'admin']).withMessage('Invalid role'),
], validateRequest, requirePermission('applications', 'edit'), async (req: any, res: Response) => {
    try {
        const success = await ApplicationService.updateUserApplicationRole(
            req.params.userId,
            req.params.id,
            req.body.role
        );
        
        if (!success) {
            return res.status(404).json({ error: 'User assignment not found' });
        }
        
        res.json({ success: true, message: 'User role updated' });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Remove user from application
router.delete('/:id/users/:userId', requirePermission('applications', 'edit'), async (req: any, res: Response) => {
    try {
        const success = await ApplicationService.removeUserFromApplication(
            req.params.userId,
            req.params.id
        );
        
        if (!success) {
            return res.status(404).json({ error: 'User assignment not found' });
        }
        
        res.json({ success: true, message: 'User removed from application' });
    } catch (error) {
        console.error('Remove user from application error:', error);
        res.status(500).json({ error: 'Failed to remove user' });
    }
});

// Suspend user's access
router.post('/:id/users/:userId/suspend', requirePermission('applications', 'edit'), async (req: any, res: Response) => {
    try {
        const success = await ApplicationService.suspendUserApplicationAccess(
            req.params.userId,
            req.params.id
        );
        
        if (!success) {
            return res.status(404).json({ error: 'User assignment not found' });
        }
        
        res.json({ success: true, message: 'User access suspended' });
    } catch (error) {
        console.error('Suspend user access error:', error);
        res.status(500).json({ error: 'Failed to suspend user' });
    }
});

// ============================================================================
// Admin-Application Assignment Routes
// ============================================================================

// Get admins for an application
router.get('/:id/admins', requirePermission('applications', 'view'), async (req: any, res: Response) => {
    try {
        const admins = await ApplicationService.getApplicationAdmins(req.params.id);
        res.json({ admins });
    } catch (error) {
        console.error('Get application admins error:', error);
        res.status(500).json({ error: 'Failed to fetch application admins' });
    }
});

// Assign admin to application
router.post('/:id/admins', [
    body('admin_user_id').isUUID().withMessage('Valid admin user ID is required'),
    body('role').optional().isIn(['viewer', 'editor', 'admin', 'super_admin']).withMessage('Invalid role'),
], validateRequest, requirePermission('admin-users', 'manage'), async (req: AdminRequest, res: Response) => {
    try {
        const { admin_user_id, role = 'admin', permissions = [], is_primary = false } = req.body;
        const success = await ApplicationService.assignAdminToApplication({
            adminUserId: admin_user_id,
            applicationId: req.params.id,
            role,
            permissions,
            isPrimary: is_primary,
            grantedBy: req.admin?.adminId
        });
        
        if (!success) {
            return res.status(400).json({ error: 'Failed to assign admin' });
        }
        
        res.json({ success: true, message: 'Admin assigned to application' });
    } catch (error) {
        console.error('Assign admin to application error:', error);
        res.status(500).json({ error: 'Failed to assign admin' });
    }
});

// Remove admin from application
router.delete('/:id/admins/:adminId', requirePermission('admin-users', 'manage'), async (req: any, res: Response) => {
    try {
        const success = await ApplicationService.removeAdminFromApplication(
            req.params.adminId,
            req.params.id
        );
        
        if (!success) {
            return res.status(404).json({ error: 'Admin assignment not found' });
        }
        
        res.json({ success: true, message: 'Admin removed from application' });
    } catch (error) {
        console.error('Remove admin from application error:', error);
        res.status(500).json({ error: 'Failed to remove admin' });
    }
});

// Set admin's primary application
router.post('/:id/admins/:adminId/set-primary', requirePermission('admin-users', 'manage'), async (req: any, res: Response) => {
    try {
        const success = await ApplicationService.setAdminPrimaryApplication(
            req.params.adminId,
            req.params.id
        );
        
        if (!success) {
            return res.status(404).json({ error: 'Admin assignment not found' });
        }
        
        res.json({ success: true, message: 'Primary application updated' });
    } catch (error) {
        console.error('Set primary application error:', error);
        res.status(500).json({ error: 'Failed to set primary application' });
    }
});

// ============================================================================
// Versioning Routes
// ============================================================================

// Get versions for an application
router.get('/:id/versions', requirePermission('applications', 'view'), async (req: express.Request, res: Response) => {
    try {
        const versions = await ApplicationModel.getVersions(req.params.id);
        res.json({ versions });
    } catch (error: any) {
        console.error('Get app versions error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create a new draft version
router.post('/:id/versions', authenticateAdmin as any, async (req: express.Request, res: Response) => {
    try {
        const { branding, settings } = req.body;
        let initialData = { branding, settings };

        if (!branding && !settings) {
            const app = await ApplicationModel.findById(req.params.id);
            if (!app) return res.status(404).json({ message: 'App not found' });
            initialData = { branding: app.branding, settings: app.settings };
        }

        const version = await ApplicationModel.createVersion(req.params.id, {
            ...initialData,
            status: 'draft'
        });
        res.status(201).json(version);
    } catch (error: any) {
        console.error('Create app version error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update a draft version
router.put('/:id/versions/:versionId', requirePermission('applications', 'edit'), async (req: express.Request, res: Response) => {
    try {
        const { branding, settings, status } = req.body;
        const version = await ApplicationModel.updateVersion(req.params.versionId, { branding, settings, status });

        if (!version) return res.status(404).json({ message: 'Version not found' });
        res.json(version);
    } catch (error: any) {
        console.error('Update app version error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Publish a version
router.post('/:id/versions/:versionId/publish', authenticateAdmin as any, async (req: express.Request, res: Response) => {
    try {
        await ApplicationModel.publishVersion(req.params.id, req.params.versionId);
        res.json({ message: 'Version published successfully' });
    } catch (error: any) {
        console.error('Publish app version error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ============================================================================
// Login Configuration Routes
// ============================================================================

// Get login configuration
router.get('/:id/login-config', requirePermission('applications', 'view'), async (req: express.Request, res: Response) => {
    try {
        const { loginConfigService } = await import('../../services/loginConfigService');
        const config = await loginConfigService.getLoginConfig(req.params.id);
        res.json({ success: true, data: config });
    } catch (error: any) {
        console.error('Get login config error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update login configuration
router.put('/:id/login-config', requirePermission('applications', 'write'), [
    body().isObject().withMessage('Configuration must be an object')
], async (req: express.Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { loginConfigService } = await import('../../services/loginConfigService');
        const validation = loginConfigService.validateLoginConfig(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid configuration',
                errors: validation.errors
            });
        }

        const updatedConfig = await loginConfigService.updateLoginConfig(req.params.id, req.body);
        res.json({
            success: true,
            data: updatedConfig,
            message: 'Login configuration updated successfully'
        });
    } catch (error: any) {
        console.error('Update login config error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update login configuration'
        });
    }
});

// Clone login configuration
router.post('/:id/login-config/clone/:targetId', requirePermission('applications', 'write'), async (req: express.Request, res: Response) => {
    try {
        const { loginConfigService } = await import('../../services/loginConfigService');
        if (req.params.id === req.params.targetId) {
            return res.status(400).json({
                success: false,
                message: 'Source and target applications cannot be the same'
            });
        }

        const clonedConfig = await loginConfigService.cloneLoginConfig(req.params.id, req.params.targetId);
        res.json({
            success: true,
            data: clonedConfig,
            message: 'Login configuration cloned successfully'
        });
    } catch (error: any) {
        console.error('Clone login config error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to clone login configuration'
        });
    }
});

// Reset login configuration
router.post('/:id/login-config/reset', requirePermission('applications', 'write'), async (req: express.Request, res: Response) => {
    try {
        const { loginConfigService } = await import('../../services/loginConfigService');
        const resetConfig = await loginConfigService.resetLoginConfig(req.params.id);
        res.json({
            success: true,
            data: resetConfig,
            message: 'Login configuration reset to defaults successfully'
        });
    } catch (error: any) {
        console.error('Reset login config error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to reset login configuration'
        });
    }
});

// ============================================================================
// Asset Upload Routes
// ============================================================================

// Upload branding asset
router.post(
    '/:id/upload',
    requirePermission('applications', 'edit'),
    storageService.getMulterConfig({
        allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'],
        maxSize: 10 * 1024 * 1024,
        compressImages: true
    }).single('file'),
    async (req: any, res: Response) => {
        try {
            const file = req.file as Express.Multer.File;
            if (!file) {
                return res.status(400).json({ error: 'No file provided' });
            }

            const appId = req.params.id;
            const userId = req.admin?.id || (req as any).user?.id || 'system';
            const { type = 'branding' } = req.body;

            const uploaded = await storageService.uploadFile(file, userId, null, {
                folder: `applications/${appId}/${type}`,
                generateThumbnails: false
            });

            if (!uploaded || !uploaded.id) {
                return res.status(500).json({ error: 'Failed to upload file' });
            }

            const proxyUrl = `/api/v1/storage/proxy/${uploaded.id}`;
            res.json({
                url: proxyUrl,
                id: uploaded.id,
                fileName: file.originalname,
                mimeType: file.mimetype,
                size: file.size
            });
        } catch (error: any) {
            console.error('Application upload error:', error);
            res.status(500).json({ error: 'Upload failed', message: error.message });
        }
    }
);

export default router;
