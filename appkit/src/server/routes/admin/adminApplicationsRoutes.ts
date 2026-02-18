import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import { ApplicationModel } from '../../models/ApplicationModel';
import storageService from '../../services/storageService';

const router = express.Router();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// @route   GET /api/admin/applications
// @desc    Get all applications
// @access  Private/Admin
router.get('/', requirePermission('applications', 'view'), async (req: Request, res: Response) => {
    try {
        const apps = await ApplicationModel.findAll();
        res.json({ applications: apps });
    } catch (error: any) {
        console.error('Get applications error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/applications/:id
// @desc    Get application by ID
// @access  Private/Admin
router.get('/:id', requirePermission('applications', 'view'), async (req: Request, res: Response) => {
    try {
        const app = await ApplicationModel.findById(req.params.id);
        if (!app) {
            return res.status(404).json({ message: 'Application not found' });
        }
        res.json(app);
    } catch (error: any) {
        console.error('Get application error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/admin/applications
// @desc    Create new application
// @access  Private/Admin
router.post('/', requirePermission('applications', 'create'), [
    body('name').notEmpty().trim(),
    body('slug').notEmpty().trim().isSlug(),
], async (req: any, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, slug, description, branding, settings } = req.body;

        // Check if slug exists
        const existing = await ApplicationModel.findBySlug(slug);
        if (existing) {
            return res.status(400).json({ message: 'Application with this slug already exists' });
        }

        const app = await ApplicationModel.create({
            name,
            slug,
            description,
            branding,
            settings
        });

        // Create initial version
        await ApplicationModel.createVersion(app.id, {
            branding: app.branding,
            settings: app.settings,
            status: 'published'
        });

        res.status(201).json(app);
    } catch (error: any) {
        console.error('Create application error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/admin/applications/:id
// @desc    Update application details
// @access  Private/Admin
router.put('/:id', authenticateAdmin as any, [
    body('name').optional().notEmpty().trim(),
    body('slug').optional().notEmpty().trim().isSlug(),
], async (req: any, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, slug, description, is_active, branding, settings } = req.body;

        // If slug is changing, check for uniqueness
        if (slug) {
            const existing = await ApplicationModel.findBySlug(slug);
            if (existing && existing.id !== req.params.id) {
                return res.status(400).json({ message: 'Application with this slug already exists' });
            }
        }

        const updated = await ApplicationModel.update(req.params.id, {
            name,
            slug,
            description,
            isActive: is_active,
            branding,
            settings
        });

        if (!updated) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.json(updated);
    } catch (error: any) {
        console.error('Update application error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/applications/:id/login-config
// @desc    Get login configuration for an application
// @access  Private/Admin
router.get('/:id/login-config', requirePermission('applications', 'view'), async (req: Request, res: Response) => {
    try {
        const { loginConfigService } = await import('../../services/loginConfigService');
        const config = await loginConfigService.getLoginConfig(req.params.id);
        res.json({ success: true, data: config });
    } catch (error: any) {
        console.error('Get login config error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/admin/applications/:id/login-config
// @desc    Update login configuration for an application
// @access  Private/Admin
router.put('/:id/login-config', requirePermission('applications', 'write'), [
    body().isObject().withMessage('Configuration must be an object')
], async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { loginConfigService } = await import('../../services/loginConfigService');
        
        // Validate configuration
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

// @route   POST /api/admin/applications/:id/login-config/clone/:targetId
// @desc    Clone login configuration from one app to another
// @access  Private/Admin
router.post('/:id/login-config/clone/:targetId', requirePermission('applications', 'write'), async (req: Request, res: Response) => {
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

// @route   POST /api/admin/applications/:id/login-config/reset
// @desc    Reset login configuration to defaults
// @access  Private/Admin
router.post('/:id/login-config/reset', requirePermission('applications', 'write'), async (req: Request, res: Response) => {
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

// @route   DELETE /api/admin/applications/:id
// @desc    Delete application (soft delete)
// @access  Private/Admin
router.delete('/:id', requirePermission('applications', 'delete'), async (req: Request, res: Response) => {
    try {
        const app = await ApplicationModel.findById(req.params.id);
        if (!app) {
            return res.status(404).json({ message: 'Application not found' });
        }

        await ApplicationModel.update(req.params.id, { isActive: false });
        res.json({ message: 'Application deleted successfully' });
    } catch (error: any) {
        console.error('Delete application error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// --- Versioning Routes ---

// @route   GET /api/admin/applications/:id/versions
// @desc    Get versions for an application
router.get('/:id/versions', requirePermission('applications', 'view'), async (req: Request, res: Response) => {
    try {
        const versions = await ApplicationModel.getVersions(req.params.id);
        res.json({ versions });
    } catch (error: any) {
        console.error('Get app versions error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/admin/applications/:id/versions
// @desc    Create a new draft version
router.post('/:id/versions', authenticateAdmin as any, async (req: Request, res: Response) => {
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

// @route   PUT /api/admin/applications/:id/versions/:versionId
// @desc    Update a draft version
router.put('/:id/versions/:versionId', requirePermission('applications', 'edit'), async (req: Request, res: Response) => {
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

// @route   POST /api/admin/applications/:id/versions/:versionId/publish
// @desc    Publish a version
router.post('/:id/versions/:versionId/publish', authenticateAdmin as any, async (req: Request, res: Response) => {
    try {
        await ApplicationModel.publishVersion(req.params.id, req.params.versionId);
        res.json({ message: 'Version published successfully' });
    } catch (error: any) {
        console.error('Publish app version error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/admin/applications/:id/upload
// @desc    Upload branding asset (logo, icon, background) for application - uses MinIO storage
router.post(
    '/:id/upload',
    requirePermission('applications', 'edit'),
    storageService.getMulterConfig({
        allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'],
        maxSize: 10 * 1024 * 1024, // 10MB max
        generateThumbnails: false,
        compressImages: true
    }).single('file'),
    async (req: any, res: Response) => {
        try {
            const file = req.file as Express.Multer.File;
            if (!file) {
                return res.status(400).json({ error: 'No file provided' });
            }

            const appId = req.params.id;
            const userId = req.admin?.id || req.user?.id || 'system';
            const { type = 'branding' } = req.body;

            // Upload to MinIO via storageService
            const uploaded = await storageService.uploadFile(file, userId, null, {
                folder: `applications/${appId}/${type}`,
                generateThumbnails: false
            });

            if (!uploaded || !uploaded.id) {
                return res.status(500).json({ error: 'Failed to upload file' });
            }

            // Return relative proxy URL for persistence
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
