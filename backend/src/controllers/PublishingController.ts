import { Response } from 'express';
import { supabase } from '../config/supabase';

export class PublishingController {
  /**
   * Get publishing workflow for a page
   */
  async getWorkflow(req: any, res: Response) {
    try {
      const { pageId } = req.params;

      const { data, error } = await supabase
        .from('publishing_workflows')
        .select('*')
        .eq('page_id', pageId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching workflow:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ workflow: data || null });
    } catch (error) {
      console.error('Error fetching workflow:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Create or update publishing workflow
   */
  async createWorkflow(req: any, res: Response) {
    try {
      const { pageId } = req.params;
      const { requiresApproval, approvers } = req.body;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if workflow exists
      const { data: existing } = await supabase
        .from('publishing_workflows')
        .select('id')
        .eq('page_id', pageId)
        .single();

      let data, error;

      if (existing) {
        // Update existing workflow
        ({ data, error } = await supabase
          .from('publishing_workflows')
          .update({
            requires_approval: requiresApproval,
            approval_status: requiresApproval ? 'pending' : null,
            updated_at: new Date().toISOString()
          })
          .eq('page_id', pageId)
          .select()
          .single());
      } else {
        // Create new workflow
        ({ data, error } = await supabase
          .from('publishing_workflows')
          .insert({
            page_id: pageId,
            requires_approval: requiresApproval || false,
            approval_status: requiresApproval ? 'pending' : null
          })
          .select()
          .single());
      }

      if (error) {
        console.error('Error creating/updating workflow:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ workflow: data });
    } catch (error) {
      console.error('Error creating/updating workflow:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Request approval for publishing
   */
  async requestApproval(req: any, res: Response) {
    try {
      const { pageId } = req.params;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get or create workflow
      let { data: workflow } = await supabase
        .from('publishing_workflows')
        .select('*')
        .eq('page_id', pageId)
        .single();

      if (!workflow) {
        // Create workflow if it doesn't exist
        const { data: newWorkflow, error: createError } = await supabase
          .from('publishing_workflows')
          .insert({
            page_id: pageId,
            requires_approval: true,
            approval_status: 'pending'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating workflow:', createError);
          return res.status(400).json({ error: createError.message });
        }

        workflow = newWorkflow;
      } else {
        // Update workflow status
        const { data: updatedWorkflow, error: updateError } = await supabase
          .from('publishing_workflows')
          .update({
            requires_approval: true,
            approval_status: 'pending',
            approved_by: null,
            approved_at: null,
            rejection_reason: null,
            updated_at: new Date().toISOString()
          })
          .eq('page_id', pageId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating workflow:', updateError);
          return res.status(400).json({ error: updateError.message });
        }

        workflow = updatedWorkflow;
      }

      // TODO: Send notification to approvers

      res.json({ 
        workflow,
        message: 'Approval requested successfully'
      });
    } catch (error) {
      console.error('Error requesting approval:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Approve page for publishing
   */
  async approvePage(req: any, res: Response) {
    try {
      const { pageId } = req.params;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Update workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('publishing_workflows')
        .update({
          approval_status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('page_id', pageId)
        .select()
        .single();

      if (workflowError) {
        console.error('Error approving page:', workflowError);
        return res.status(400).json({ error: workflowError.message });
      }

      // Publish the page
      const { data: page, error: publishError } = await supabase
        .from('pages')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', pageId)
        .select()
        .single();

      if (publishError) {
        console.error('Error publishing page:', publishError);
        return res.status(400).json({ error: publishError.message });
      }

      res.json({ 
        workflow,
        page,
        message: 'Page approved and published successfully'
      });
    } catch (error) {
      console.error('Error approving page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Reject page publishing
   */
  async rejectPage(req: any, res: Response) {
    try {
      const { pageId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const { data: workflow, error } = await supabase
        .from('publishing_workflows')
        .update({
          approval_status: 'rejected',
          approved_by: userId,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('page_id', pageId)
        .select()
        .single();

      if (error) {
        console.error('Error rejecting page:', error);
        return res.status(400).json({ error: error.message });
      }

      // TODO: Send notification to page creator

      res.json({ 
        workflow,
        message: 'Page rejected'
      });
    } catch (error) {
      console.error('Error rejecting page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get pages pending approval
   */
  async getPendingApprovals(req: any, res: Response) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const { data, error } = await supabase
        .from('publishing_workflows')
        .select(`
          *,
          pages (
            id,
            title,
            slug,
            description,
            status,
            created_by,
            updated_by,
            created_at,
            updated_at
          )
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })
        .range(parseInt(String(offset)), parseInt(String(offset)) + parseInt(String(limit)) - 1);

      if (error) {
        console.error('Error fetching pending approvals:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ pendingApprovals: data });
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get scheduled pages
   */
  async getScheduledPages(req: any, res: Response) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('status', 'scheduled')
        .order('scheduled_for', { ascending: true })
        .range(parseInt(String(offset)), parseInt(String(offset)) + parseInt(String(limit)) - 1);

      if (error) {
        console.error('Error fetching scheduled pages:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ scheduledPages: data });
    } catch (error) {
      console.error('Error fetching scheduled pages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get publishing statistics
   */
  async getPublishingStats(req: any, res: Response) {
    try {
      // Get counts for different statuses
      const { data: statusCounts, error: statusError } = await supabase
        .from('pages')
        .select('status');

      if (statusError) {
        console.error('Error fetching status counts:', statusError);
        return res.status(400).json({ error: statusError.message });
      }

      // Get pending approvals count
      const { data: pendingApprovals, error: approvalError } = await supabase
        .from('publishing_workflows')
        .select('id')
        .eq('approval_status', 'pending');

      const stats = {
        total: statusCounts.length,
        draft: statusCounts.filter(p => p.status === 'draft').length,
        scheduled: statusCounts.filter(p => p.status === 'scheduled').length,
        published: statusCounts.filter(p => p.status === 'published').length,
        archived: statusCounts.filter(p => p.status === 'archived').length,
        pendingApprovals: !approvalError ? (pendingApprovals?.length || 0) : 0
      };

      res.json({ stats });
    } catch (error) {
      console.error('Error fetching publishing stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
