import { Router } from 'express';
import { TemplateController } from '../controllers/TemplateController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const templateController = new TemplateController();

// Get all templates
router.get('/templates', authenticateToken as any, templateController.getTemplates.bind(templateController));

// Get template categories
router.get('/templates/categories', authenticateToken as any, templateController.getCategories.bind(templateController));

// Get template by ID
router.get('/templates/:id', authenticateToken as any, templateController.getTemplateById.bind(templateController));

// Preview template
router.get('/templates/:id/preview', authenticateToken as any, templateController.previewTemplate.bind(templateController));

// Create new template
router.post('/templates', authenticateToken as any, templateController.createTemplate.bind(templateController));

// Create template from page
router.post('/templates/from-page', authenticateToken as any, templateController.createTemplateFromPage.bind(templateController));

// Update template
router.put('/templates/:id', authenticateToken as any, templateController.updateTemplate.bind(templateController));

// Delete template
router.delete('/templates/:id', authenticateToken as any, templateController.deleteTemplate.bind(templateController));

export default router;
