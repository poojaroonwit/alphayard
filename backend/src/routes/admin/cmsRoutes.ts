import { Router } from 'express';
import cmsController from '../../controllers/admin/CMSController';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Content Management Routes
router.get('/families/:circleId/content', authenticateToken as any, cmsController.getContent.bind(cmsController));
router.get('/content/:contentId', authenticateToken as any, cmsController.getContentById.bind(cmsController));
router.post('/families/:circleId/content', authenticateToken as any, cmsController.createContent.bind(cmsController));
router.put('/content/:contentId', authenticateToken as any, cmsController.updateContent.bind(cmsController));
router.delete('/content/:contentId', authenticateToken as any, cmsController.deleteContent.bind(cmsController));

// Content Interaction Routes
router.post('/content/:contentId/like', authenticateToken as any, cmsController.likeContent.bind(cmsController));
router.post('/content/:contentId/view', authenticateToken as any, cmsController.viewContent.bind(cmsController));
router.post('/content/:contentId/share', authenticateToken as any, cmsController.shareContent.bind(cmsController));

// Comment Routes
router.get('/content/:contentId/comments', authenticateToken as any, cmsController.getComments.bind(cmsController));
router.post('/content/:contentId/comments', authenticateToken as any, cmsController.createComment.bind(cmsController));

// Category Routes
router.get('/families/:circleId/categories', authenticateToken as any, cmsController.getCategories.bind(cmsController));
router.post('/families/:circleId/categories', authenticateToken as any, cmsController.createCategory.bind(cmsController));

// Analytics Routes
router.get('/families/:circleId/analytics/content', authenticateToken as any, cmsController.getContentAnalytics.bind(cmsController));
router.get('/families/:circleId/content/popular', authenticateToken as any, cmsController.getPopularContent.bind(cmsController));

export default router;

