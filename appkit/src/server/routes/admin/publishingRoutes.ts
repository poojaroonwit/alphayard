import { Router } from 'express';
import { PublishingController } from '../../controllers/admin/PublishingController';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = Router();
const publishingController = new PublishingController();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// Get publishing workflow for a page
router.get('/pages/:pageId/workflow', requirePermission('pages', 'view'), publishingController.getWorkflow.bind(publishingController));

// Create/update publishing workflow
router.post('/pages/:pageId/workflow', requirePermission('pages', 'edit'), publishingController.createWorkflow.bind(publishingController));

// Request approval for publishing
router.post('/pages/:pageId/request-approval', requirePermission('pages', 'edit'), publishingController.requestApproval.bind(publishingController));

// Approve page for publishing
router.post('/pages/:pageId/approve', requirePermission('pages', 'publish'), publishingController.approvePage.bind(publishingController));

// Reject page publishing
router.post('/pages/:pageId/reject', requirePermission('pages', 'publish'), publishingController.rejectPage.bind(publishingController));

// Get pages pending approval
router.get('/pending-approvals', requirePermission('pages', 'view'), publishingController.getPendingApprovals.bind(publishingController));

// Get scheduled pages
router.get('/scheduled-pages', requirePermission('pages', 'view'), publishingController.getScheduledPages.bind(publishingController));

// Get publishing statistics
router.get('/stats', requirePermission('analytics', 'view'), publishingController.getPublishingStats.bind(publishingController));

export default router;
