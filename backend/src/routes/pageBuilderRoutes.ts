import { Router } from 'express';
import { PageBuilderController } from '../controllers/PageBuilderController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const pageBuilderController = new PageBuilderController();

// ==================== PAGE CRUD ROUTES ====================

// Get all pages (with filtering)
router.get('/pages', authenticateToken as any, pageBuilderController.getPages.bind(pageBuilderController));

// Get page by ID
router.get('/pages/:id', authenticateToken as any, pageBuilderController.getPageById.bind(pageBuilderController));

// Get published page by slug (public route)
router.get('/pages/slug/:slug', pageBuilderController.getPageBySlug.bind(pageBuilderController));

// Create new page
router.post('/pages', authenticateToken as any, pageBuilderController.createPage.bind(pageBuilderController));

// Update page
router.put('/pages/:id', authenticateToken as any, pageBuilderController.updatePage.bind(pageBuilderController));

// Delete page
router.delete('/pages/:id', authenticateToken as any, pageBuilderController.deletePage.bind(pageBuilderController));

// Duplicate page
router.post('/pages/:id/duplicate', authenticateToken as any, pageBuilderController.duplicatePage.bind(pageBuilderController));

// Preview page
router.get('/pages/:id/preview', authenticateToken as any, pageBuilderController.previewPage.bind(pageBuilderController));

// ==================== PUBLISHING ROUTES ====================

// Publish page
router.post('/pages/:id/publish', authenticateToken as any, pageBuilderController.publishPage.bind(pageBuilderController));

// Unpublish page
router.post('/pages/:id/unpublish', authenticateToken as any, pageBuilderController.unpublishPage.bind(pageBuilderController));

// Schedule page
router.post('/pages/:id/schedule', authenticateToken as any, pageBuilderController.schedulePage.bind(pageBuilderController));

// Process scheduled pages (cron job endpoint)
router.post('/pages/process-scheduled', authenticateToken as any, pageBuilderController.processScheduledPages.bind(pageBuilderController));

export default router;
