import { Router } from 'express';
import { VersionController } from '../../controllers/admin/VersionController';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = Router();
const versionController = new VersionController();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// Get version history for a page
router.get('/pages/:pageId/versions', requirePermission('pages', 'view'), versionController.getVersionHistory.bind(versionController));

// Get specific version by ID
router.get('/pages/:pageId/versions/:versionId', requirePermission('pages', 'view'), versionController.getVersion.bind(versionController));

// Get specific version by version number
router.get('/pages/:pageId/versions/number/:versionNumber', requirePermission('pages', 'view'), versionController.getVersionByNumber.bind(versionController));

// Preview a version
router.get('/pages/:pageId/versions/:versionId/preview', requirePermission('pages', 'view'), versionController.previewVersion.bind(versionController));

// Restore a version
router.post('/pages/:pageId/versions/:versionId/restore', requirePermission('pages', 'edit'), versionController.restoreVersion.bind(versionController));

// Compare two versions
router.get('/pages/:pageId/versions/compare', requirePermission('pages', 'view'), versionController.compareVersions.bind(versionController));

// Delete a version
router.delete('/pages/:pageId/versions/:versionId', requirePermission('pages', 'delete'), versionController.deleteVersion.bind(versionController));

export default router;
