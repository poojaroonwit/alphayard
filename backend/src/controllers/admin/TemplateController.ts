import { Response } from 'express';
import { pool } from '../../config/database';

export class TemplateController {
  /**
   * Get all templates
   */
  async getTemplates(req: any, res: Response) {
    try {
      const { category, isActive, search } = req.query;

      let sql = 'SELECT * FROM templates WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      // Apply filters
      if (category) {
        sql += ` AND category = $${paramIndex++}`;
        params.push(category);
      }
      if (isActive !== undefined) {
        sql += ` AND is_active = $${paramIndex++}`;
        params.push(isActive === 'true');
      }
      if (search) {
        sql += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Order by category and name
      sql += ' ORDER BY category ASC, name ASC';

      const { rows } = await pool.query(sql, params);

      res.json({ templates: rows });
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(req: any, res: Response) {
    try {
      const { id } = req.params;

      const { rows } = await pool.query(
        'SELECT * FROM templates WHERE id = $1',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json({ template: rows[0] });
    } catch (error: any) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(req: any, res: Response) {
    try {
      const { name, description, category, thumbnail, components, metadata, isSystem } = req.body;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!name || !components) {
        return res.status(400).json({ error: 'Name and components are required' });
      }

      if (!Array.isArray(components)) {
        return res.status(400).json({ error: 'Components must be an array' });
      }

      const { rows } = await pool.query(
        `INSERT INTO templates (
          name, description, category, thumbnail, components, metadata, is_system, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          name, description || null, category || 'custom', thumbnail || null, 
          JSON.stringify(components), metadata || {}, isSystem || false, true, userId
        ]
      );

      res.status(201).json({ template: rows[0] });
    } catch (error: any) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Create template from existing page
   */
  async createTemplateFromPage(req: any, res: Response) {
    try {
      const { pageId, name, description, category, thumbnail } = req.body;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!pageId || !name) {
        return res.status(400).json({ error: 'Page ID and name are required' });
      }

      // Get page components
      const { rows: components } = await pool.query(
        `SELECT component_type, position, props, styles, responsive_config 
         FROM page_components 
         WHERE page_id = $1 
         ORDER BY position ASC`,
        [pageId]
      );

      // Transform components to template format
      const templateComponents = components.map((comp: any) => ({
        componentType: comp.component_type,
        position: comp.position,
        props: comp.props,
        styles: comp.styles,
        responsiveConfig: comp.responsive_config
      }));

      // Create template
      const { rows } = await pool.query(
        `INSERT INTO templates (
          name, description, category, thumbnail, components, metadata, is_system, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          name, description || null, category || 'custom', thumbnail || null, 
          JSON.stringify(templateComponents), {}, false, true, userId
        ]
      );

      res.status(201).json({ template: rows[0] });
    } catch (error: any) {
      console.error('Error creating template from page:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Update a template
   */
  async updateTemplate(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, category, thumbnail, components, metadata, isActive } = req.body;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if template exists and is not a system template
      const { rows: existingRows } = await pool.query(
        'SELECT is_system FROM templates WHERE id = $1',
        [id]
      );

      if (existingRows.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const existing = existingRows[0];
      if (existing.is_system && !req.admin) {
        return res.status(403).json({ error: 'Cannot modify system templates' });
      }

      // Build dynamic update
      const updates: string[] = ['updated_at = NOW()'];
      const params: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) { updates.push(`name = $${paramIndex++}`); params.push(name); }
      if (description !== undefined) { updates.push(`description = $${paramIndex++}`); params.push(description); }
      if (category !== undefined) { updates.push(`category = $${paramIndex++}`); params.push(category); }
      if (thumbnail !== undefined) { updates.push(`thumbnail = $${paramIndex++}`); params.push(thumbnail); }
      if (components !== undefined) {
        if (!Array.isArray(components)) {
          return res.status(400).json({ error: 'Components must be an array' });
        }
        updates.push(`components = $${paramIndex++}`);
        params.push(JSON.stringify(components));
      }
      if (metadata !== undefined) { updates.push(`metadata = $${paramIndex++}`); params.push(metadata); }
      if (isActive !== undefined) { updates.push(`is_active = $${paramIndex++}`); params.push(isActive); }

      params.push(id);
      const { rows } = await pool.query(
        `UPDATE templates SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );

      res.json({ template: rows[0] });
    } catch (error: any) {
      console.error('Error updating template:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(req: any, res: Response) {
    try {
      const { id } = req.params;

      // Check if template exists and is not a system template
      const { rows: existingRows } = await pool.query(
        'SELECT is_system FROM templates WHERE id = $1',
        [id]
      );

      if (existingRows.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const existing = existingRows[0];
      if (existing.is_system) {
        return res.status(403).json({ error: 'Cannot delete system templates' });
      }

      // Check if template is being used
      const { rows: usages } = await pool.query(
        'SELECT id FROM pages WHERE template_id = $1 LIMIT 1',
        [id]
      );

      if (usages.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete template that is being used',
          message: 'This template is used by one or more pages'
        });
      }

      await pool.query('DELETE FROM templates WHERE id = $1', [id]);

      res.json({ message: 'Template deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Get template categories
   */
  async getCategories(req: any, res: Response) {
    try {
      const { rows } = await pool.query(
        'SELECT DISTINCT category FROM templates WHERE is_active = true ORDER BY category ASC'
      );

      const categories = rows.map(item => item.category);

      res.json({ categories });
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Preview template (returns template with component definitions)
   */
  async previewTemplate(req: any, res: Response) {
    try {
      const { id } = req.params;

      // Get template
      const { rows: templateRows } = await pool.query(
        'SELECT * FROM templates WHERE id = $1',
        [id]
      );

      if (templateRows.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const template = templateRows[0];

      // Get component definitions for all components in template
      const components = Array.isArray(template.components) ? template.components : [];
      const componentTypes = components.map((comp: any) => comp.componentType);
      const uniqueComponentTypes = [...new Set(componentTypes)];

      if (uniqueComponentTypes.length === 0) {
        return res.json({ 
          template,
          componentDefinitions: []
        });
      }

      const { rows: componentDefs } = await pool.query(
        'SELECT * FROM component_definitions WHERE name = ANY($1)',
        [uniqueComponentTypes]
      );

      res.json({ 
        template,
        componentDefinitions: componentDefs
      });
    } catch (error: any) {
      console.error('Error previewing template:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
}
