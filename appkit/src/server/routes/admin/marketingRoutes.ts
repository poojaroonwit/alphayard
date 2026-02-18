import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = Router();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// Helper to get content type ID
async function getContentTypeId(name: string): Promise<string | null> {
  const rows = await prisma.$queryRawUnsafe<any[]>('SELECT id FROM content_types WHERE name = $1', name);
  return rows[0]?.id || null;
}

/**
 * GET /slides
 * Get all marketing slides
 */
router.get('/slides', requirePermission('marketing', 'view'), async (_req: Request, res: Response) => {
  try {
    const typeId = await getContentTypeId('marketing_slide');
    if (!typeId) return res.json({ slides: getFallbackSlides() });

    const data = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id, title, slug, content, status, priority, is_featured, created_at, updated_at
      FROM marketing_content
      WHERE content_type_id = $1
      ORDER BY priority ASC
    `, [typeId]);

    const slides = (data || []).map(item => {
      let slideData = {};
      try {
        slideData = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
      } catch (e) {
        console.error('Error parsing slide content:', e);
      }
      return {
        ...item,
        slideData
      };
    });

    res.json({ slides: slides.length > 0 ? slides : getFallbackSlides() });
  } catch (error) {
    console.error('Error in marketing slides endpoint:', error);
    res.json({ slides: getFallbackSlides() });
  }
});

/**
 * POST /slides
 * Create a new marketing slide
 */
router.post('/slides', requirePermission('marketing', 'create'), async (req: Request, res: Response) => {
  try {
    const { title, slug, slideData, status = 'published', priority = 0 } = req.body;
    const typeId = await getContentTypeId('marketing_slide');

    if (!typeId) return res.status(500).json({ error: 'Marketing slide content type not found' });

    const rows = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO marketing_content (title, slug, content, content_type_id, status, priority)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, title, slug, JSON.stringify(slideData), typeId, status, priority);

    res.status(201).json({ slide: rows[0] });
  } catch (error) {
    console.error('Error creating marketing slide:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /slides/:id
 * Update an existing marketing slide
 */
router.put('/slides/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, slug, slideData, status, priority } = req.body;

    const rows = await prisma.$queryRawUnsafe<any[]>(`
      UPDATE marketing_content
      SET title = COALESCE($1, title),
          slug = COALESCE($2, slug),
          content = COALESCE($3, content),
          status = COALESCE($4, status),
          priority = COALESCE($5, priority),
          updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, title, slug, slideData ? JSON.stringify(slideData) : null, status, priority, id);

    if (rows.length === 0) return res.status(404).json({ error: 'Slide not found' });

    res.json({ slide: rows[0] });
  } catch (error) {
    console.error('Error updating marketing slide:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /slides/:id
 * Delete a marketing slide
 */
router.delete('/slides/:id', requirePermission('marketing', 'delete'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rowCount = await prisma.$executeRawUnsafe('DELETE FROM marketing_content WHERE id = $1', id);
    
    if (rowCount === 0) return res.status(404).json({ error: 'Slide not found' });
    
    res.json({ message: 'Slide deleted successfully' });
  } catch (error) {
    console.error('Error deleting marketing slide:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /content
 * Get all marketing content
 */
router.get('/content', requirePermission('marketing', 'view'), async (req: Request, res: Response) => {
  try {
    const { type, featured } = req.query;

    let sql = `SELECT * FROM marketing_content WHERE status = 'published'`;
    const params: any[] = [];
    let pIdx = 1;

    if (type) {
      sql += ` AND content_type_id = $${pIdx++}`;
      params.push(type);
    }

    if (featured === 'true') {
      sql += ` AND is_featured = true`;
    }

    sql += ' ORDER BY priority DESC';

    const data = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
    res.json({ content: data || [] });
  } catch (error) {
    console.error('Error in marketing content endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Fallback slides when database is not available
 */
function getFallbackSlides() {
  return [
    {
      id: '1',
      title: 'Welcome to AppKit',
      slideData: {
        title: 'Welcome to AppKit',
        subtitle: 'Circle Management Made Simple',
        description: 'Connect, organize, and share with your circle in one beautiful app',
        icon: 'home',
        gradient: ['#667eea', '#764ba2'],
        features: ['Circle Calendar', 'Shared Tasks', 'Photo Albums'],
        slide_order: 1
      }
    },
    {
      id: '2',
      title: 'Stay Connected',
      slideData: {
        title: 'Stay Connected',
        subtitle: 'Real-time Communication',
        description: 'Chat, share locations, and stay in touch with circle members',
        icon: 'message-circle',
        gradient: ['#f093fb', '#f5576c'],
        features: ['Group Chat', 'Location Sharing', 'Safety Alerts'],
        slide_order: 2
      }
    }
  ];
}

export default router;

