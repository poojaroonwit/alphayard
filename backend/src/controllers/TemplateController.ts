import { Response } from 'express';
import { supabase } from '../config/supabase';

export class TemplateController {
  /**
   * Get all templates
   */
  async getTemplates(req: any, res: Response) {
    try {
      const { category, isActive, search } = req.query;

      let query = supabase
        .from('templates')
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
        console.error('Error fetching templates:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ templates: data });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(req: any, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching template:', error);
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json({ template: data });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: 'Internal server error' });
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

      const { data, error } = await supabase
        .from('templates')
        .insert({
          name,
          description: description || null,
          category: category || 'custom',
          thumbnail: thumbnail || null,
          components,
          metadata: metadata || {},
          is_system: isSystem || false,
          is_active: true,
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        return res.status(400).json({ error: error.message });
      }

      res.status(201).json({ template: data });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Internal server error' });
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
      const { data: components, error: componentsError } = await supabase
        .from('page_components')
        .select('component_type, position, props, styles, responsive_config')
        .eq('page_id', pageId)
        .order('position', { ascending: true });

      if (componentsError) {
        console.error('Error fetching page components:', componentsError);
        return res.status(400).json({ error: 'Failed to fetch page components' });
      }

      // Transform components to template format
      const templateComponents = components.map((comp: any) => ({
        componentType: comp.component_type,
        position: comp.position,
        props: comp.props,
        styles: comp.styles,
        responsiveConfig: comp.responsive_config
      }));

      // Create template
      const { data, error } = await supabase
        .from('templates')
        .insert({
          name,
          description: description || null,
          category: category || 'custom',
          thumbnail: thumbnail || null,
          components: templateComponents,
          metadata: {},
          is_system: false,
          is_active: true,
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        return res.status(400).json({ error: error.message });
      }

      res.status(201).json({ template: data });
    } catch (error) {
      console.error('Error creating template from page:', error);
      res.status(500).json({ error: 'Internal server error' });
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
      const { data: existing } = await supabase
        .from('templates')
        .select('is_system')
        .eq('id', id)
        .single();

      if (!existing) {
        return res.status(404).json({ error: 'Template not found' });
      }

      if (existing.is_system) {
        return res.status(403).json({ error: 'Cannot modify system templates' });
      }

      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
      if (components !== undefined) {
        if (!Array.isArray(components)) {
          return res.status(400).json({ error: 'Components must be an array' });
        }
        updateData.components = components;
      }
      if (metadata !== undefined) updateData.metadata = metadata;
      if (isActive !== undefined) updateData.is_active = isActive;

      const { data, error } = await supabase
        .from('templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating template:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ template: data });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(req: any, res: Response) {
    try {
      const { id } = req.params;

      // Check if template exists and is not a system template
      const { data: existing } = await supabase
        .from('templates')
        .select('is_system')
        .eq('id', id)
        .single();

      if (!existing) {
        return res.status(404).json({ error: 'Template not found' });
      }

      if (existing.is_system) {
        return res.status(403).json({ error: 'Cannot delete system templates' });
      }

      // Check if template is being used
      const { data: usages } = await supabase
        .from('pages')
        .select('id')
        .eq('template_id', id)
        .limit(1);

      if (usages && usages.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete template that is being used',
          message: 'This template is used by one or more pages'
        });
      }

      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting template:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get template categories
   */
  async getCategories(req: any, res: Response) {
    try {
      const { data, error } = await supabase
        .from('templates')
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
   * Preview template (returns template with component definitions)
   */
  async previewTemplate(req: any, res: Response) {
    try {
      const { id } = req.params;

      // Get template
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

      if (templateError) {
        console.error('Error fetching template:', templateError);
        return res.status(404).json({ error: 'Template not found' });
      }

      // Get component definitions for all components in template
      const componentTypes = template.components.map((comp: any) => comp.componentType);
      const uniqueComponentTypes = [...new Set(componentTypes)];

      const { data: componentDefs, error: componentError } = await supabase
        .from('component_definitions')
        .select('*')
        .in('name', uniqueComponentTypes);

      if (componentError) {
        console.error('Error fetching component definitions:', componentError);
      }

      res.json({ 
        template,
        componentDefinitions: componentDefs || []
      });
    } catch (error) {
      console.error('Error previewing template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
