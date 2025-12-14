import { Response } from 'express';
import { supabase } from '../config/supabase';

export class PageBuilderController {
  // ==================== PAGE CRUD OPERATIONS ====================

  /**
   * Get all pages with optional filtering
   */
  async getPages(req: any, res: Response) {
    try {
      const query = req.query;

      let supabaseQuery = supabase
        .from('pages')
        .select(`
          *,
          page_components(
            id,
            component_type,
            position,
            props,
            styles,
            responsive_config
          )
        `);

      // Apply filters
      if (query.status) {
        supabaseQuery = supabaseQuery.eq('status', query.status);
      }
      if (query.parentId) {
        supabaseQuery = supabaseQuery.eq('parent_id', query.parentId);
      }
      if (query.templateId) {
        supabaseQuery = supabaseQuery.eq('template_id', query.templateId);
      }
      if (query.search) {
        supabaseQuery = supabaseQuery.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`);
      }
      if (query.createdBy) {
        supabaseQuery = supabaseQuery.eq('created_by', query.createdBy);
      }

      // Apply sorting
      const sortBy = String(query.sortBy || 'updated_at');
      const sortOrder = String(query.sortOrder || 'desc');
      supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const limit = parseInt(String(query.limit || 50), 10);
      const offset = parseInt(String(query.offset || 0), 10);
      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Error fetching pages:', error);
        return res.status(400).json({ error: error.message });
      }

      // Sort components by position
      const pages = data.map(page => ({
        ...page,
        page_components: page.page_components?.sort((a: any, b: any) => a.position - b.position) || []
      }));

      res.json({ pages });
    } catch (error) {
      console.error('Error fetching pages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get a single page by ID with all components
   */
  async getPageById(req: any, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('pages')
        .select(`
          *,
          page_components(
            id,
            component_type,
            position,
            props,
            styles,
            responsive_config,
            created_at,
            updated_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching page:', error);
        return res.status(404).json({ error: 'Page not found' });
      }

      // Sort components by position
      const page = {
        ...data,
        page_components: data.page_components?.sort((a: any, b: any) => a.position - b.position) || []
      };

      res.json({ page });
    } catch (error) {
      console.error('Error fetching page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get a published page by slug (for public rendering)
   */
  async getPageBySlug(req: any, res: Response) {
    try {
      const { slug } = req.params;

      const { data, error } = await supabase
        .from('pages')
        .select(`
          *,
          page_components(
            id,
            component_type,
            position,
            props,
            styles,
            responsive_config
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Error fetching page by slug:', error);
        return res.status(404).json({ error: 'Page not found' });
      }

      // Sort components by position
      const page = {
        ...data,
        page_components: data.page_components?.sort((a: any, b: any) => a.position - b.position) || []
      };

      res.json({ page });
    } catch (error) {
      console.error('Error fetching page by slug:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Create a new page
   */
  async createPage(req: any, res: Response) {
    try {
      const { title, slug, description, parentId, templateId, metadata, seoConfig, components } = req.body;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!title || !slug) {
        return res.status(400).json({ error: 'Title and slug are required' });
      }

      // Generate slug if not provided or sanitize provided slug
      const sanitizedSlug = slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug already exists for published pages
      const { data: existingPage } = await supabase
        .from('pages')
        .select('id, status')
        .eq('slug', sanitizedSlug)
        .eq('status', 'published')
        .single();

      if (existingPage) {
        return res.status(400).json({ error: 'A published page with this URL already exists' });
      }

      // Create page
      const { data: page, error: pageError } = await supabase
        .from('pages')
        .insert({
          title,
          slug: sanitizedSlug,
          description: description || null,
          parent_id: parentId || null,
          template_id: templateId || null,
          status: 'draft',
          metadata: metadata || {},
          seo_config: seoConfig || {},
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single();

      if (pageError) {
        console.error('Error creating page:', pageError);
        return res.status(400).json({ error: pageError.message });
      }

      // Add components if provided
      if (components && Array.isArray(components) && components.length > 0) {
        const componentData = components.map((comp: any, index: number) => ({
          page_id: page.id,
          component_type: comp.componentType,
          position: comp.position !== undefined ? comp.position : index,
          props: comp.props || {},
          styles: comp.styles || {},
          responsive_config: comp.responsiveConfig || {}
        }));

        const { error: componentsError } = await supabase
          .from('page_components')
          .insert(componentData);

        if (componentsError) {
          console.error('Error creating components:', componentsError);
          // Rollback page creation
          await supabase.from('pages').delete().eq('id', page.id);
          return res.status(400).json({ error: 'Failed to create page components' });
        }
      }

      // Fetch complete page with components
      const { data: completePage } = await supabase
        .from('pages')
        .select(`
          *,
          page_components(*)
        `)
        .eq('id', page.id)
        .single();

      res.status(201).json({ page: completePage });
    } catch (error) {
      console.error('Error creating page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update an existing page
   */
  async updatePage(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { title, slug, description, parentId, templateId, status, metadata, seoConfig, scheduledFor, expiresAt, components } = req.body;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Build update object
      const updateData: any = {
        updated_by: userId,
        updated_at: new Date().toISOString()
      };

      if (title !== undefined) updateData.title = title;
      if (slug !== undefined) {
        updateData.slug = slug
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      if (description !== undefined) updateData.description = description;
      if (parentId !== undefined) updateData.parent_id = parentId;
      if (templateId !== undefined) updateData.template_id = templateId;
      if (status !== undefined) updateData.status = status;
      if (metadata !== undefined) updateData.metadata = metadata;
      if (seoConfig !== undefined) updateData.seo_config = seoConfig;
      if (scheduledFor !== undefined) updateData.scheduled_for = scheduledFor;
      if (expiresAt !== undefined) updateData.expires_at = expiresAt;

      // Update page
      const { data: page, error: pageError } = await supabase
        .from('pages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (pageError) {
        console.error('Error updating page:', pageError);
        return res.status(400).json({ error: pageError.message });
      }

      // Update components if provided
      if (components && Array.isArray(components)) {
        // Delete existing components
        await supabase
          .from('page_components')
          .delete()
          .eq('page_id', id);

        // Insert new components
        if (components.length > 0) {
          const componentData = components.map((comp: any, index: number) => ({
            page_id: id,
            component_type: comp.componentType,
            position: comp.position !== undefined ? comp.position : index,
            props: comp.props || {},
            styles: comp.styles || {},
            responsive_config: comp.responsiveConfig || {}
          }));

          const { error: componentsError } = await supabase
            .from('page_components')
            .insert(componentData);

          if (componentsError) {
            console.error('Error updating components:', componentsError);
            return res.status(400).json({ error: 'Failed to update page components' });
          }
        }
      }

      // Fetch complete page with components
      const { data: completePage } = await supabase
        .from('pages')
        .select(`
          *,
          page_components(*)
        `)
        .eq('id', id)
        .single();

      res.json({ page: completePage });
    } catch (error) {
      console.error('Error updating page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete a page
   */
  async deletePage(req: any, res: Response) {
    try {
      const { id } = req.params;

      // Check if page has children
      const { data: children } = await supabase
        .from('pages')
        .select('id')
        .eq('parent_id', id);

      if (children && children.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete page with child pages',
          childCount: children.length
        });
      }

      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting page:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ message: 'Page deleted successfully' });
    } catch (error) {
      console.error('Error deleting page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Duplicate a page
   */
  async duplicatePage(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { newSlug } = req.body;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!newSlug) {
        return res.status(400).json({ error: 'New slug is required' });
      }

      // Call the duplicate_page function
      const { data, error } = await supabase
        .rpc('duplicate_page', {
          p_source_page_id: id,
          p_new_slug: newSlug,
          p_user_id: userId
        });

      if (error) {
        console.error('Error duplicating page:', error);
        return res.status(400).json({ error: error.message });
      }

      // Fetch the duplicated page
      const { data: duplicatedPage } = await supabase
        .from('pages')
        .select(`
          *,
          page_components(*)
        `)
        .eq('id', data)
        .single();

      res.status(201).json({ page: duplicatedPage });
    } catch (error) {
      console.error('Error duplicating page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Preview a page (returns page data without requiring published status)
   */
  async previewPage(req: any, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('pages')
        .select(`
          *,
          page_components(
            id,
            component_type,
            position,
            props,
            styles,
            responsive_config
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error previewing page:', error);
        return res.status(404).json({ error: 'Page not found' });
      }

      // Sort components by position
      const page = {
        ...data,
        page_components: data.page_components?.sort((a: any, b: any) => a.position - b.position) || []
      };

      res.json({ page });
    } catch (error) {
      console.error('Error previewing page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== PUBLISHING OPERATIONS ====================

  /**
   * Publish a page
   */
  async publishPage(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: page, error } = await supabase
        .from('pages')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error publishing page:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ page, message: 'Page published successfully' });
    } catch (error) {
      console.error('Error publishing page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Unpublish a page
   */
  async unpublishPage(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: page, error } = await supabase
        .from('pages')
        .update({
          status: 'draft',
          updated_by: userId
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error unpublishing page:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ page, message: 'Page unpublished successfully' });
    } catch (error) {
      console.error('Error unpublishing page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Schedule a page for publication
   */
  async schedulePage(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { scheduledFor, expiresAt } = req.body;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!scheduledFor) {
        return res.status(400).json({ error: 'Scheduled date is required' });
      }

      const { data: page, error } = await supabase
        .from('pages')
        .update({
          status: 'scheduled',
          scheduled_for: scheduledFor,
          expires_at: expiresAt || null,
          updated_by: userId
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error scheduling page:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ page, message: 'Page scheduled successfully' });
    } catch (error) {
      console.error('Error scheduling page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Process scheduled pages (to be called by cron job)
   */
  async processScheduledPages(req: any, res: Response) {
    try {
      // Auto-publish scheduled pages
      const { data: publishCount, error: publishError } = await supabase
        .rpc('auto_publish_scheduled_pages');

      if (publishError) {
        console.error('Error auto-publishing pages:', publishError);
      }

      // Auto-unpublish expired pages
      const { data: unpublishCount, error: unpublishError } = await supabase
        .rpc('auto_unpublish_expired_pages');

      if (unpublishError) {
        console.error('Error auto-unpublishing pages:', unpublishError);
      }

      res.json({
        message: 'Scheduled pages processed',
        published: publishCount || 0,
        unpublished: unpublishCount || 0
      });
    } catch (error) {
      console.error('Error processing scheduled pages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
