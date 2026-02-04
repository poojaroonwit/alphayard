import { Response } from 'express';
import { pool } from '../../config/database';

export class ComponentController {
  /**
   * Get all component definitions
   */
  async getComponents(req: any, res: Response) {
    try {
      const { category, isActive, search } = req.query;

      let sql = 'SELECT * FROM component_definitions WHERE 1=1';
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

      res.json({ components: rows });
    } catch (error: any) {
      console.error('Error fetching components:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Get component definition by ID
   */
  async getComponentById(req: any, res: Response) {
    try {
      const { id } = req.params;

      const { rows } = await pool.query(
        'SELECT * FROM component_definitions WHERE id = $1',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Component not found' });
      }

      res.json({ component: rows[0] });
    } catch (error: any) {
      console.error('Error fetching component:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Get component definition by name
   */
  async getComponentByName(req: any, res: Response) {
    try {
      const { name } = req.params;

      const { rows } = await pool.query(
        'SELECT * FROM component_definitions WHERE name = $1',
        [name]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Component not found' });
      }

      res.json({ component: rows[0] });
    } catch (error: any) {
      console.error('Error fetching component:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Create a new component definition
   */
  async createComponent(req: any, res: Response) {
    try {
      const { name, category, icon, description, schema, defaultProps, isSystem } = req.body;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!name || !category || !schema) {
        return res.status(400).json({ error: 'Name, category, and schema are required' });
      }

      // Validate schema structure
      if (!schema.properties || typeof schema.properties !== 'object') {
        return res.status(400).json({ error: 'Schema must contain a properties object' });
      }

      // Check if component name already exists
      const { rows: existing } = await pool.query(
        'SELECT id FROM component_definitions WHERE name = $1',
        [name]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Component with this name already exists' });
      }

      const { rows } = await pool.query(
        `INSERT INTO component_definitions (
          name, category, icon, description, schema, default_props, is_system, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          name, category, icon || null, description || null, schema, 
          defaultProps || {}, isSystem || false, true, userId
        ]
      );

      res.status(201).json({ component: rows[0] });
    } catch (error: any) {
      console.error('Error creating component:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Update a component definition
   */
  async updateComponent(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { name, category, icon, description, schema, defaultProps, isActive } = req.body;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if component exists and is not a system component
      const { rows: existingRows } = await pool.query(
        'SELECT is_system FROM component_definitions WHERE id = $1',
        [id]
      );

      if (existingRows.length === 0) {
        return res.status(404).json({ error: 'Component not found' });
      }

      const existing = existingRows[0];
      if (existing.is_system && !req.admin) { // Only admins can modify system components potentially, or block entirely
        return res.status(403).json({ error: 'Cannot modify system components' });
      }

      // Build dynamic update
      const updates: string[] = ['updated_at = NOW()'];
      const params: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        params.push(name);
      }
      if (category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        params.push(category);
      }
      if (icon !== undefined) {
        updates.push(`icon = $${paramIndex++}`);
        params.push(icon);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        params.push(description);
      }
      if (schema !== undefined) {
        if (!schema.properties || typeof schema.properties !== 'object') {
          return res.status(400).json({ error: 'Schema must contain a properties object' });
        }
        updates.push(`schema = $${paramIndex++}`);
        params.push(schema);
      }
      if (defaultProps !== undefined) {
        updates.push(`default_props = $${paramIndex++}`);
        params.push(defaultProps);
      }
      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        params.push(isActive);
      }

      params.push(id);
      const { rows } = await pool.query(
        `UPDATE component_definitions SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );

      res.json({ component: rows[0] });
    } catch (error: any) {
      console.error('Error updating component:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Delete a component definition
   */
  async deleteComponent(req: any, res: Response) {
    try {
      const { id } = req.params;

      // Check if component exists and is not a system component
      const { rows: existingRows } = await pool.query(
        'SELECT is_system, name FROM component_definitions WHERE id = $1',
        [id]
      );

      if (existingRows.length === 0) {
        return res.status(404).json({ error: 'Component not found' });
      }

      const existing = existingRows[0];
      if (existing.is_system) {
        return res.status(403).json({ error: 'Cannot delete system components' });
      }

      // Check if component is being used in any pages
      const { rows: usages } = await pool.query(
        'SELECT id FROM page_components WHERE component_type = $1 LIMIT 1',
        [existing.name]
      );

      if (usages.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete component that is being used in pages',
          message: 'Remove this component from all pages before deleting'
        });
      }

      await pool.query('DELETE FROM component_definitions WHERE id = $1', [id]);

      res.json({ message: 'Component deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting component:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Get component categories
   */
  async getCategories(req: any, res: Response) {
    try {
      const { rows } = await pool.query(
        'SELECT DISTINCT category FROM component_definitions WHERE is_active = true ORDER BY category ASC'
      );

      const categories = rows.map(item => item.category);

      res.json({ categories });
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Validate component schema
   */
  async validateSchema(req: any, res: Response) {
    try {
      const { schema } = req.body;

      if (!schema) {
        return res.status(400).json({ error: 'Schema is required' });
      }

      // Basic schema validation
      const errors: string[] = [];

      if (!schema.properties || typeof schema.properties !== 'object') {
        errors.push('Schema must contain a properties object');
      }

      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
          if (!prop.type) {
            errors.push(`Property "${key}" must have a type`);
          }
          if (!prop.label) {
            errors.push(`Property "${key}" must have a label`);
          }
          
          const validTypes = ['string', 'number', 'boolean', 'image', 'richtext', 'select', 'color', 'array', 'object'];
          if (prop.type && !validTypes.includes(prop.type)) {
            errors.push(`Property "${key}" has invalid type "${prop.type}". Valid types: ${validTypes.join(', ')}`);
          }

          if (prop.type === 'select' && (!prop.options || !Array.isArray(prop.options))) {
            errors.push(`Property "${key}" with type "select" must have an options array`);
          }
        });
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          valid: false,
          errors 
        });
      }

      res.json({ 
        valid: true,
        message: 'Schema is valid'
      });
    } catch (error) {
      console.error('Error validating schema:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
