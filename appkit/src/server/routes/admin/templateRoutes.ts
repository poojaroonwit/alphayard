import { Router } from 'express';
import { TemplateController } from '../../controllers/admin/TemplateController';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = Router();
const templateController = new TemplateController();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// Get all templates
router.get('/templates', requirePermission('templates', 'view'), templateController.getTemplates.bind(templateController));

// Get template categories
router.get('/templates/categories', requirePermission('templates', 'view'), templateController.getCategories.bind(templateController));

// Get template by ID
router.get('/templates/:id', requirePermission('templates', 'view'), templateController.getTemplateById.bind(templateController));

// Preview template
router.get('/templates/:id/preview', requirePermission('templates', 'view'), templateController.previewTemplate.bind(templateController));

// Create new template
router.post('/templates', requirePermission('templates', 'create'), templateController.createTemplate.bind(templateController));

// Create template from page
router.post('/templates/from-page', requirePermission('templates', 'create'), templateController.createTemplateFromPage.bind(templateController));

// Update template
router.put('/templates/:id', requirePermission('templates', 'edit'), templateController.updateTemplate.bind(templateController));

// Delete template
router.delete('/templates/:id', requirePermission('templates', 'delete'), templateController.deleteTemplate.bind(templateController));

export default router;
