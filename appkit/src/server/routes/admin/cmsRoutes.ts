import { Router } from 'express';
import cmsController from '../../controllers/admin/CMSController';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = Router();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// Content Management Routes
router.get('/families/:circleId/content', requirePermission('content', 'view'), cmsController.getContent.bind(cmsController));
router.get('/content/:contentId', requirePermission('content', 'view'), cmsController.getContentById.bind(cmsController));
router.post('/families/:circleId/content', requirePermission('content', 'create'), cmsController.createContent.bind(cmsController));
router.put('/content/:contentId', requirePermission('content', 'edit'), cmsController.updateContent.bind(cmsController));
router.delete('/content/:contentId', requirePermission('content', 'delete'), cmsController.deleteContent.bind(cmsController));

// Content Interaction Routes
router.post('/content/:contentId/like', requirePermission('content', 'view'), cmsController.likeContent.bind(cmsController));
router.post('/content/:contentId/view', requirePermission('content', 'view'), cmsController.viewContent.bind(cmsController));
router.post('/content/:contentId/share', requirePermission('content', 'view'), cmsController.shareContent.bind(cmsController));

// Comment Routes
router.get('/content/:contentId/comments', requirePermission('content', 'view'), cmsController.getComments.bind(cmsController));
router.post('/content/:contentId/comments', requirePermission('content', 'create'), cmsController.createComment.bind(cmsController));

// Category Routes
router.get('/families/:circleId/categories', requirePermission('content', 'view'), cmsController.getCategories.bind(cmsController));
router.post('/families/:circleId/categories', requirePermission('content', 'create'), cmsController.createCategory.bind(cmsController));

// Analytics Routes
router.get('/families/:circleId/analytics/content', requirePermission('analytics', 'view'), cmsController.getContentAnalytics.bind(cmsController));
router.get('/families/:circleId/content/popular', requirePermission('content', 'view'), cmsController.getPopularContent.bind(cmsController));

export default router;

