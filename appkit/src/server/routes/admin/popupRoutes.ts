import express from 'express';
import { authenticateToken } from '../../middleware/auth';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import { PopupController } from '../../controllers/admin/PopupController';

const authMiddleware = authenticateToken as any;
const validatePopup = [] as any; // TODO: Implement validation

const router = express.Router();
const popupController = new PopupController();

// Public routes (for fetching active popups)
router.get('/active', popupController.getActivePopups);
router.post('/analytics', popupController.recordAnalytics);

// Protected routes (for user popup settings)
router.get('/user/:userId/settings', authMiddleware, popupController.getUserSettings);
router.put('/user/:userId/settings', authMiddleware, popupController.updateUserSettings);
router.post('/:popupId/shown', authMiddleware, popupController.markAsShown);

// Admin routes (for managing popups)
router.get('/', authenticateAdmin as any, requirePermission('marketing', 'view'), popupController.getAllPopups);
router.get('/:id', authenticateAdmin as any, requirePermission('marketing', 'view'), popupController.getPopupById);
router.post('/', authenticateAdmin as any, requirePermission('marketing', 'create'), validatePopup, popupController.createPopup);
router.put('/:id', authenticateAdmin as any, requirePermission('marketing', 'edit'), validatePopup, popupController.updatePopup);
router.delete('/:id', authenticateAdmin as any, requirePermission('marketing', 'delete'), popupController.deletePopup);

// Admin analytics routes
router.get('/analytics/overview', authenticateAdmin as any, requirePermission('analytics', 'view'), popupController.getAnalyticsOverview);
router.get('/analytics/:popupId', authenticateAdmin as any, requirePermission('analytics', 'view'), popupController.getPopupAnalytics);
router.get('/analytics/export', authenticateAdmin as any, requirePermission('analytics', 'export'), popupController.exportAnalytics);

export default router; 
