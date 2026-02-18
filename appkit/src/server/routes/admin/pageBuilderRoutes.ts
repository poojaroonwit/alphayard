import { Router } from 'express';
import PageBuilderController from '../../controllers/admin/PageBuilderController';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = Router();
const pageBuilderController = PageBuilderController;

// ==================== PAGE CRUD ROUTES ====================

// Get all pages (with filtering)
router.get('/pages', authenticateAdmin as any, requirePermission('pages', 'view'), pageBuilderController.getPages.bind(pageBuilderController));

// Get page by ID
router.get('/pages/:id', authenticateAdmin as any, requirePermission('pages', 'view'), pageBuilderController.getPageById.bind(pageBuilderController));

// Get published page by slug (public route)
router.get('/pages/slug/:slug', pageBuilderController.getPageBySlug.bind(pageBuilderController));

// Create new page
router.post('/pages', authenticateAdmin as any, requirePermission('pages', 'create'), pageBuilderController.createPage.bind(pageBuilderController));

// Update page
router.put('/pages/:id', authenticateAdmin as any, requirePermission('pages', 'edit'), pageBuilderController.updatePage.bind(pageBuilderController));

// Delete page
router.delete('/pages/:id', authenticateAdmin as any, requirePermission('pages', 'delete'), pageBuilderController.deletePage.bind(pageBuilderController));

// Duplicate page
router.post('/pages/:id/duplicate', authenticateAdmin as any, requirePermission('pages', 'create'), pageBuilderController.duplicatePage.bind(pageBuilderController));

// Preview page
router.get('/pages/:id/preview', authenticateAdmin as any, requirePermission('pages', 'view'), pageBuilderController.previewPage.bind(pageBuilderController));

// ==================== PUBLISHING ROUTES ====================

// Publish page
router.post('/pages/:id/publish', authenticateAdmin as any, requirePermission('pages', 'publish'), pageBuilderController.publishPage.bind(pageBuilderController));

// Unpublish page
router.post('/pages/:id/unpublish', authenticateAdmin as any, requirePermission('pages', 'publish'), pageBuilderController.unpublishPage.bind(pageBuilderController));

// Schedule page
router.post('/pages/:id/schedule', authenticateAdmin as any, requirePermission('pages', 'publish'), pageBuilderController.schedulePage.bind(pageBuilderController));

// Process scheduled pages (cron job endpoint)
router.post('/pages/process-scheduled', authenticateAdmin as any, requirePermission('pages', 'publish'), pageBuilderController.processScheduledPages.bind(pageBuilderController));

export default router;
