/**
 * Email Templates Admin Routes
 * CRUD operations for managing email templates
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { emailTemplateService } from '../../services/emailTemplateService';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken as any);
router.use(requireAdmin as any);

/**
 * GET /admin/email-templates
 * List all email templates with optional filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      category,
      isActive,
      search,
      page = '1',
      limit = '50',
    } = req.query;

    const options = {
      category: category as string | undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search: search as string | undefined,
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 100),
    };

    const result = await emailTemplateService.getTemplates(options);
    res.json(result);
  } catch (error: any) {
    console.error('Error listing email templates:', error);
    res.status(500).json({ error: error.message || 'Failed to list templates' });
  }
});

/**
 * GET /admin/email-templates/categories
 * Get all template categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await emailTemplateService.getCategories();
    res.json({ categories });
  } catch (error: any) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: error.message || 'Failed to get categories' });
  }
});

/**
 * GET /admin/email-templates/:id
 * Get a single template by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await emailTemplateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error: any) {
    console.error('Error getting template:', error);
    res.status(500).json({ error: error.message || 'Failed to get template' });
  }
});

/**
 * POST /admin/email-templates
 * Create a new template
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const {
      slug,
      name,
      description,
      category,
      subject,
      htmlContent,
      textContent,
      variables,
      sampleData,
      isActive,
    } = req.body;

    // Validate required fields
    if (!slug || !name || !subject || !htmlContent) {
      return res.status(400).json({
        error: 'Missing required fields: slug, name, subject, htmlContent',
      });
    }

    const template = await emailTemplateService.createTemplate({
      slug,
      name,
      description,
      category,
      subject,
      htmlContent,
      textContent,
      variables,
      sampleData,
      isActive,
    }, userId);

    res.status(201).json({ template });
  } catch (error: any) {
    console.error('Error creating template:', error);
    res.status(400).json({ error: error.message || 'Failed to create template' });
  }
});

/**
 * PUT /admin/email-templates/:id
 * Update an existing template
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const {
      name,
      description,
      category,
      subject,
      htmlContent,
      textContent,
      variables,
      sampleData,
      isActive,
      changeNote,
    } = req.body;

    const template = await emailTemplateService.updateTemplate(id, {
      name,
      description,
      category,
      subject,
      htmlContent,
      textContent,
      variables,
      sampleData,
      isActive,
      changeNote,
    }, userId);

    res.json({ template });
  } catch (error: any) {
    console.error('Error updating template:', error);
    res.status(400).json({ error: error.message || 'Failed to update template' });
  }
});

/**
 * DELETE /admin/email-templates/:id
 * Delete a template (system templates cannot be deleted)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await emailTemplateService.deleteTemplate(id);
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    res.status(400).json({ error: error.message || 'Failed to delete template' });
  }
});

/**
 * POST /admin/email-templates/:id/duplicate
 * Duplicate a template
 */
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { slug, name } = req.body;

    if (!slug || !name) {
      return res.status(400).json({ error: 'Missing required fields: slug, name' });
    }

    const template = await emailTemplateService.duplicateTemplate(id, slug, name, userId);
    res.status(201).json({ template });
  } catch (error: any) {
    console.error('Error duplicating template:', error);
    res.status(400).json({ error: error.message || 'Failed to duplicate template' });
  }
});

/**
 * GET /admin/email-templates/:id/versions
 * Get version history for a template
 */
router.get('/:id/versions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const versions = await emailTemplateService.getTemplateVersions(id);
    res.json({ versions });
  } catch (error: any) {
    console.error('Error getting template versions:', error);
    res.status(500).json({ error: error.message || 'Failed to get versions' });
  }
});

/**
 * POST /admin/email-templates/:id/restore/:version
 * Restore a specific version
 */
router.post('/:id/restore/:version', async (req: Request, res: Response) => {
  try {
    const { id, version } = req.params;
    const userId = (req as any).user?.id;

    const template = await emailTemplateService.restoreVersion(id, parseInt(version), userId);
    res.json({ template });
  } catch (error: any) {
    console.error('Error restoring template version:', error);
    res.status(400).json({ error: error.message || 'Failed to restore version' });
  }
});

/**
 * POST /admin/email-templates/:id/preview
 * Preview a template with sample data
 */
router.post('/:id/preview', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = req.body;

    const rendered = await emailTemplateService.previewTemplate(id, data);
    res.json(rendered);
  } catch (error: any) {
    console.error('Error previewing template:', error);
    res.status(400).json({ error: error.message || 'Failed to preview template' });
  }
});

/**
 * POST /admin/email-templates/:id/send-test
 * Send a test email using this template
 */
router.post('/:id/send-test', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { to, data } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Missing required field: to (email address)' });
    }

    const success = await emailTemplateService.sendTestEmail(id, to, data);
    
    if (success) {
      res.json({ success: true, message: `Test email sent to ${to}` });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send test email' });
    }
  } catch (error: any) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: error.message || 'Failed to send test email' });
  }
});

/**
 * POST /admin/email-templates/render
 * Render a template by slug (for testing)
 */
router.post('/render', async (req: Request, res: Response) => {
  try {
    const { slug, data } = req.body;

    if (!slug) {
      return res.status(400).json({ error: 'Missing required field: slug' });
    }

    const rendered = await emailTemplateService.renderTemplate(slug, data || {});
    res.json(rendered);
  } catch (error: any) {
    console.error('Error rendering template:', error);
    res.status(400).json({ error: error.message || 'Failed to render template' });
  }
});

export default router;
