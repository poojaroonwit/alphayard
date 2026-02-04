import { Response } from 'express';
import { pool } from '../../config/database';

export class ComponentStudioController {
  /**
   * Get Component Studio Sidebar (Categories + Styles)
   */
  async getSidebar(req: any, res: Response) {
    try {
      const categoriesResult = await pool.query('SELECT * FROM component_categories ORDER BY position ASC');
      const stylesResult = await pool.query('SELECT * FROM component_styles WHERE is_active = true ORDER BY name ASC');

      const sections = categoriesResult.rows.map(category => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        description: category.description,
        components: stylesResult.rows
          .filter(style => style.category_id === category.id)
          .map(style => ({
            id: style.id,
            name: style.name,
            definitionId: style.definition_id,
            styles: style.styles,
            config: style.config,
            mobileConfig: style.mobile_config,
            isSystem: style.is_system
          }))
      }));

      res.json({ sections });
    } catch (error: any) {
      console.error('Error fetching Component Studio sidebar:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Create a new component style variant
   */
  async createStyle(req: any, res: Response) {
    try {
      const { categoryId, definitionId, name, styles, config, mobileConfig } = req.body;

      if (!categoryId || !name) {
        return res.status(400).json({ error: 'Category ID and Name are required' });
      }

      const result = await pool.query(
        `INSERT INTO component_styles (category_id, definition_id, name, styles, config, mobile_config) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [categoryId, definitionId, name, styles || {}, config || {}, mobileConfig || {}]
      );

      res.status(201).json({ style: result.rows[0] });
    } catch (error: any) {
      console.error('Error creating component style:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Update an existing component style
   */
  async updateStyle(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { name, styles, config, mobileConfig, isActive } = req.body;

      const { rows: existing } = await pool.query('SELECT * FROM component_styles WHERE id = $1', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Component style not found' });
      }

      const result = await pool.query(
        `UPDATE component_styles 
         SET name = COALESCE($1, name),
             styles = COALESCE($2, styles),
             config = COALESCE($3, config),
             mobile_config = COALESCE($4, mobile_config),
             is_active = COALESCE($5, is_active),
             updated_at = NOW()
         WHERE id = $6 
         RETURNING *`,
        [name, styles, config, mobileConfig, isActive, id]
      );

      res.json({ style: result.rows[0] });
    } catch (error: any) {
      console.error('Error updating component style:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Duplicate a component style
   */
  async duplicateStyle(req: any, res: Response) {
    try {
      const { id } = req.params;

      const { rows } = await pool.query('SELECT * FROM component_styles WHERE id = $1', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Component style not found' });
      }

      const source = rows[0];
      const result = await pool.query(
        `INSERT INTO component_styles (category_id, definition_id, name, styles, config, mobile_config) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [source.category_id, source.definition_id, `${source.name} (Copy)`, source.styles, source.config, source.mobile_config]
      );

      res.status(201).json({ style: result.rows[0] });
    } catch (error: any) {
      console.error('Error duplicating component style:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Delete a component style
   */
  async deleteStyle(req: any, res: Response) {
    try {
      const { id } = req.params;

      const result = await pool.query('DELETE FROM component_styles WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Component style not found' });
      }

      res.json({ message: 'Component style deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting component style:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
}
