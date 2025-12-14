import { Response } from 'express';
import { supabase } from '../config/supabase';

export class ComponentController {
  /**
   * Get all component definitions
   */
  async getComponents(req: any, res: Response) {
    try {
      const { category, isActive, search } = req.query;

      let query = supabase
        .from('component_definitions')
        .select('*');

      // Apply filters
      if (category) {
        query = query.eq('category', category);
      }
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive === 'true');
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Order by category and name
      query = query.order('category', { ascending: true });
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching components:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ components: data });
    } catch (error) {
      console.error('Error fetching components:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get component definition by ID
   */
  async getComponentById(req: any, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('component_definitions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching component:', error);
        return res.status(404).json({ error: 'Component not found' });
      }

      res.json({ component: data });
    } catch (error) {
      console.error('Error fetching component:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get component definition by name
   */
  async getComponentByName(req: any, res: Response) {
    try {
      const { name } = req.params;

      const { data, error } = await supabase
        .from('component_definitions')
        .select('*')
        .eq('name', name)
        .single();

      if (error) {
        console.error('Error fetching component:', error);
        return res.status(404).json({ error: 'Component not found' });
      }

      res.json({ component: data });
    } catch (error) {
      console.error('Error fetching component:', error);
      res.status(500).json({ error: 'Internal server error' });
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
      const { data: existing } = await supabase
        .from('component_definitions')
        .select('id')
        .eq('name', name)
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Component with this name already exists' });
      }

      const { data, error } = await supabase
        .from('component_definitions')
        .insert({
          name,
          category,
          icon: icon || null,
          description: description || null,
          schema,
          default_props: defaultProps || {},
          is_system: isSystem || false,
          is_active: true,
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating component:', error);
        return res.status(400).json({ error: error.message });
      }

      res.status(201).json({ component: data });
    } catch (error) {
      console.error('Error creating component:', error);
      res.status(500).json({ error: 'Internal server error' });
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
      const { data: existing } = await supabase
        .from('component_definitions')
        .select('is_system')
        .eq('id', id)
        .single();

      if (!existing) {
        return res.status(404).json({ error: 'Component not found' });
      }

      if (existing.is_system) {
        return res.status(403).json({ error: 'Cannot modify system components' });
      }

      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (name !== undefined) updateData.name = name;
      if (category !== undefined) updateData.category = category;
      if (icon !== undefined) updateData.icon = icon;
      if (description !== undefined) updateData.description = description;
      if (schema !== undefined) {
        // Validate schema structure
        if (!schema.properties || typeof schema.properties !== 'object') {
          return res.status(400).json({ error: 'Schema must contain a properties object' });
        }
        updateData.schema = schema;
      }
      if (defaultProps !== undefined) updateData.default_props = defaultProps;
      if (isActive !== undefined) updateData.is_active = isActive;

      const { data, error } = await supabase
        .from('component_definitions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating component:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ component: data });
    } catch (error) {
      console.error('Error updating component:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete a component definition
   */
  async deleteComponent(req: any, res: Response) {
    try {
      const { id } = req.params;

      // Check if component exists and is not a system component
      const { data: existing } = await supabase
        .from('component_definitions')
        .select('is_system, name')
        .eq('id', id)
        .single();

      if (!existing) {
        return res.status(404).json({ error: 'Component not found' });
      }

      if (existing.is_system) {
        return res.status(403).json({ error: 'Cannot delete system components' });
      }

      // Check if component is being used in any pages
      const { data: usages } = await supabase
        .from('page_components')
        .select('id')
        .eq('component_type', existing.name)
        .limit(1);

      if (usages && usages.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete component that is being used in pages',
          message: 'Remove this component from all pages before deleting'
        });
      }

      const { error } = await supabase
        .from('component_definitions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting component:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ message: 'Component deleted successfully' });
    } catch (error) {
      console.error('Error deleting component:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get component categories
   */
  async getCategories(req: any, res: Response) {
    try {
      const { data, error } = await supabase
        .from('component_definitions')
        .select('category')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching categories:', error);
        return res.status(400).json({ error: error.message });
      }

      // Get unique categories
      const categories = [...new Set(data.map(item => item.category))].sort();

      res.json({ categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Internal server error' });
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
