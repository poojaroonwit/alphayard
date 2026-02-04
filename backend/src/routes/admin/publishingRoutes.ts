import { Router } from 'express';
import { PublishingController } from '../../controllers/admin/PublishingController';
import { authenticateToken } from '../../middleware/auth';

const router = Router();
const publishingController = new PublishingController();

// Get publishing workflow for a page
router.get('/pages/:pageId/workflow', authenticateToken as any, publishingController.getWorkflow.bind(publishingController));

// Create/update publishing workflow
router.post('/pages/:pageId/workflow', authenticateToken as any, publishingController.createWorkflow.bind(publishingController));

// Request approval for publishing
router.post('/pages/:pageId/request-approval', authenticateToken as any, publishingController.requestApproval.bind(publishingController));

// Approve page for publishing
router.post('/pages/:pageId/approve', authenticateToken as any, publishingController.approvePage.bind(publishingController));

// Reject page publishing
router.post('/pages/:pageId/reject', authenticateToken as any, publishingController.rejectPage.bind(publishingController));

// Get pages pending approval
router.get('/pending-approvals', authenticateToken as any, publishingController.getPendingApprovals.bind(publishingController));

// Get scheduled pages
router.get('/scheduled-pages', authenticateToken as any, publishingController.getScheduledPages.bind(publishingController));

// Get publishing statistics
router.get('/stats', authenticateToken as any, publishingController.getPublishingStats.bind(publishingController));

export default router;
