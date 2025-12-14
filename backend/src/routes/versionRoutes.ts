import { Router } from 'express';
import { VersionController } from '../controllers/VersionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const versionController = new VersionController();

// Get version history for a page
router.get('/pages/:pageId/versions', authenticateToken as any, versionController.getVersionHistory.bind(versionController));

// Get specific version by ID
router.get('/pages/:pageId/versions/:versionId', authenticateToken as any, versionController.getVersion.bind(versionController));

// Get specific version by version number
router.get('/pages/:pageId/versions/number/:versionNumber', authenticateToken as any, versionController.getVersionByNumber.bind(versionController));

// Preview a version
router.get('/pages/:pageId/versions/:versionId/preview', authenticateToken as any, versionController.previewVersion.bind(versionController));

// Restore a version
router.post('/pages/:pageId/versions/:versionId/restore', authenticateToken as any, versionController.restoreVersion.bind(versionController));

// Compare two versions
router.get('/pages/:pageId/versions/compare', authenticateToken as any, versionController.compareVersions.bind(versionController));

// Delete a version
router.delete('/pages/:pageId/versions/:versionId', authenticateToken as any, versionController.deleteVersion.bind(versionController));

export default router;
