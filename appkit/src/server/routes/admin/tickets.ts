import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin as any);

// Get ticket statistics
router.get('/stats', requirePermission('tickets', 'view'), async (req: Request, res: Response) => {
  try {
    const statsResult = await prisma.$queryRawUnsafe<Array<{
      total: bigint;
      open: bigint;
      in_progress: bigint;
      resolved: bigint;
      closed: bigint;
      overdue: bigint;
    }>>(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE status = 'closed') as closed,
        COUNT(*) FILTER (WHERE status = 'open' AND created_at < NOW() - INTERVAL '48 hours') as overdue
      FROM support_tickets
    `);

    // Calculate average resolution time
    const avgResult = await prisma.$queryRawUnsafe<Array<{
      avg_hours: number;
    }>>(`
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_hours
      FROM support_tickets
      WHERE resolved_at IS NOT NULL
    `);

    const stats = statsResult[0];
    
    res.json({
      success: true,
      stats: {
        total: Number(stats.total || 0),
        open: Number(stats.open || 0),
        inProgress: Number(stats.in_progress || 0),
        resolved: Number(stats.resolved || 0),
        closed: Number(stats.closed || 0),
        overdue: Number(stats.overdue || 0),
        avgResolutionTime: Math.round(Number(avgResult[0]?.avg_hours || 0))
      }
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ticket stats' });
  }
});

// Get all tickets with filters
router.get('/', requirePermission('tickets', 'view'), async (req: Request, res: Response) => {
  try {
    const { status, type, priority, search, limit = 50, offset = 0, assignedTo } = req.query;
    
    let query = `
      SELECT t.*,
             r.first_name as reporter_first_name, r.last_name as reporter_last_name, r.email as reporter_email,
             a.first_name as assigned_first_name, a.last_name as assigned_last_name, a.email as assigned_email,
             c.name as circle_name
      FROM support_tickets t
      LEFT JOIN core.users r ON t.reporter_id = r.id
      LEFT JOIN admin.admin_users a ON t.assigned_to = a.id
      LEFT JOIN appkit.circles c ON t.circle_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND t.status = $${paramIndex++}`;
    }
    if (type && type !== 'all') {
      params.push(type);
      query += ` AND t.type = $${paramIndex++}`;
    }
    if (priority && priority !== 'all') {
      params.push(priority);
      query += ` AND t.priority = $${paramIndex++}`;
    }
    if (assignedTo) {
      params.push(assignedTo);
      query += ` AND t.assigned_to = $${paramIndex++}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      paramIndex++;
    }

    query += ` ORDER BY 
      CASE t.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END,
      t.created_at DESC
    `;

    params.push(limit, offset);
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;

    const result = await prisma.$queryRawUnsafe<any[]>(query, ...params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM support_tickets t WHERE 1=1`;
    const countParams: any[] = [];
    let countParamIndex = 1;
    
    if (status && status !== 'all') {
      countParams.push(status);
      countQuery += ` AND t.status = $${countParamIndex++}`;
    }
    if (type && type !== 'all') {
      countParams.push(type);
      countQuery += ` AND t.type = $${countParamIndex++}`;
    }
    if (priority && priority !== 'all') {
      countParams.push(priority);
      countQuery += ` AND t.priority = $${countParamIndex++}`;
    }
    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND (t.title ILIKE $${countParamIndex} OR t.description ILIKE $${countParamIndex})`;
    }

    const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(countQuery, ...countParams);

    const tickets = result.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      priority: row.priority,
      status: row.status,
      reporter: {
        id: row.reporter_id,
        name: `${row.reporter_first_name || ''} ${row.reporter_last_name || ''}`.trim(),
        email: row.reporter_email,
        circleId: row.circle_id,
        circleName: row.circle_name
      },
      assignedTo: row.assigned_to ? {
        id: row.assigned_to,
        name: `${row.assigned_first_name || ''} ${row.assigned_last_name || ''}`.trim(),
        email: row.assigned_email
      } : null,
      tags: row.tags || [],
      attachments: row.attachments || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at
    }));

    res.json({
      success: true,
      tickets,
      total: Number(countResult[0].count),
      limit: Number(limit as string),
      offset: Number(offset as string)
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
  }
});

// Get single ticket with comments
router.get('/:id', requirePermission('tickets', 'view'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ticketResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT t.*,
             r.first_name as reporter_first_name, r.last_name as reporter_last_name, r.email as reporter_email,
             a.first_name as assigned_first_name, a.last_name as assigned_last_name, a.email as assigned_email,
             c.name as circle_name
      FROM support_tickets t
      LEFT JOIN core.users r ON t.reporter_id = r.id
      LEFT JOIN admin.admin_users a ON t.assigned_to = a.id
      LEFT JOIN appkit.circles c ON t.circle_id = c.id
      WHERE t.id = $1
    `, id);

    if (ticketResult.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    // Get comments
    const commentsResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT c.*, 
             COALESCE(u.first_name, au.first_name) as author_first_name,
             COALESCE(u.last_name, au.last_name) as author_last_name,
             CASE WHEN au.id IS NOT NULL THEN 'admin' ELSE 'user' END as author_role
      FROM ticket_comments c
      LEFT JOIN core.users u ON c.author_id = u.id AND c.author_type = 'user'
      LEFT JOIN admin.admin_users au ON c.author_id = au.id AND c.author_type = 'admin'
      WHERE c.ticket_id = $1
      ORDER BY c.created_at ASC
    `, id);

    const row = ticketResult[0];
    const ticket = {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      priority: row.priority,
      status: row.status,
      reporter: {
        id: row.reporter_id,
        name: `${row.reporter_first_name || ''} ${row.reporter_last_name || ''}`.trim(),
        email: row.reporter_email,
        circleId: row.circle_id,
        circleName: row.circle_name
      },
      assignedTo: row.assigned_to ? {
        id: row.assigned_to,
        name: `${row.assigned_first_name || ''} ${row.assigned_last_name || ''}`.trim(),
        email: row.assigned_email
      } : null,
      tags: row.tags || [],
      attachments: row.attachments || [],
      comments: commentsResult.map(c => ({
        id: c.id,
        content: c.content,
        author: {
          id: c.author_id,
          name: `${c.author_first_name || ''} ${c.author_last_name || ''}`.trim(),
          role: c.author_role
        },
        isInternal: c.is_internal,
        createdAt: c.created_at
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at
    };

    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ticket' });
  }
});

// Create ticket
router.post('/', requirePermission('tickets', 'create'), async (req: Request, res: Response) => {
  try {
    const { title, description, type, priority, reporterId, circleId, tags, attachments } = req.body;
    const id = uuidv4();

    const result = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO support_tickets (id, title, description, type, priority, status, reporter_id, circle_id, tags, attachments, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'open', $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, id, title, description, type || 'other', priority || 'medium', reporterId, circleId, tags || [], attachments || []);

    res.json({ success: true, ticket: result[0] });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ success: false, error: 'Failed to create ticket' });
  }
});

// Update ticket
router.put('/:id', requirePermission('tickets', 'edit'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, type, priority, status, assignedTo, tags } = req.body;

    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) { updates.push(`title = $${paramIndex++}`); values.push(title); }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(description); }
    if (type !== undefined) { updates.push(`type = $${paramIndex++}`); values.push(type); }
    if (priority !== undefined) { updates.push(`priority = $${paramIndex++}`); values.push(priority); }
    if (status !== undefined) { 
      updates.push(`status = $${paramIndex++}`); 
      values.push(status);
      if (status === 'resolved' || status === 'closed') {
        updates.push(`resolved_at = NOW()`);
      }
    }
    if (assignedTo !== undefined) { updates.push(`assigned_to = $${paramIndex++}`); values.push(assignedTo || null); }
    if (tags !== undefined) { updates.push(`tags = $${paramIndex++}`); values.push(tags); }

    values.push(id);

    const result = await prisma.$queryRawUnsafe<any[]>(`
      UPDATE support_tickets SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, ...values);

    if (result.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.json({ success: true, ticket: result[0] });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ success: false, error: 'Failed to update ticket' });
  }
});

// Assign ticket
router.patch('/:id/assign', requirePermission('tickets', 'edit'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const result = await prisma.$queryRawUnsafe<any[]>(`
      UPDATE support_tickets 
      SET assigned_to = $1, status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, assignedTo, id);

    if (result.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.json({ success: true, ticket: result[0] });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({ success: false, error: 'Failed to assign ticket' });
  }
});

// Add comment to ticket
router.post('/:id/comments', requirePermission('tickets', 'edit'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, isInternal = false } = req.body;
    const adminUser = (req as any).adminUser;
    const commentId = uuidv4();

    const result = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO ticket_comments (id, ticket_id, author_id, author_type, content, is_internal, created_at)
      VALUES ($1, $2, $3, 'admin', $4, $5, NOW())
      RETURNING *
    `, commentId, id, adminUser?.id, content, isInternal);

    // Update ticket updated_at
    await prisma.$executeRawUnsafe(`UPDATE support_tickets SET updated_at = NOW() WHERE id = $1`, id);

    res.json({ 
      success: true, 
      comment: {
        id: result[0].id,
        content: result[0].content,
        author: {
          id: adminUser?.id,
          name: adminUser?.name || 'Admin',
          role: 'admin'
        },
        isInternal: result[0].is_internal,
        createdAt: result[0].created_at
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

// Delete ticket
router.delete('/:id', requirePermission('tickets', 'delete'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete comments first
    await prisma.$executeRawUnsafe(`DELETE FROM ticket_comments WHERE ticket_id = $1`, id);
    
    // Delete ticket
    const result = await prisma.$queryRawUnsafe<any[]>(`DELETE FROM support_tickets WHERE id = $1 RETURNING id`, id);

    if (result.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ success: false, error: 'Failed to delete ticket' });
  }
});

// Get tickets count (for badge)
router.get('/count/open', async (req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
      SELECT COUNT(*) as count FROM support_tickets WHERE status IN ('open', 'in_progress')
    `);
    res.json({ success: true, count: parseInt(String(result[0].count)) });
  } catch (error) {
    console.error('Error getting ticket count:', error);
    res.json({ success: true, count: 0 });
  }
});

export default router;
