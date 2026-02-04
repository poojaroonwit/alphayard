import { Router } from 'express';
import { pool } from '../../config/database';
import { mockContentService } from '../../services/mockContentService';
import { authenticateToken } from '../../middleware/auth';
import { authenticateAdmin } from '../../middleware/adminAuth';

const router = Router();

// Content Pages CRUD
router.get('/pages', authenticateToken as any, async (req, res) => {
  try {
    const { type, status, page = 1, page_size = 20, search } = req.query;

    let sql = `
      SELECT cp.*, 
             ca.views, ca.clicks, ca.conversions
      FROM content_pages cp
      LEFT JOIN content_analytics ca ON cp.id = ca.page_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (type && type !== 'all') {
      sql += ` AND cp.type = $${pIdx++}`;
      params.push(type);
    }

    if (status && status !== 'all') {
      sql += ` AND cp.status = $${pIdx++}`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (cp.title ILIKE $${pIdx} OR cp.slug ILIKE $${pIdx})`;
      params.push(`%${search}%`);
      pIdx++;
    }

    sql += ` ORDER BY cp.updated_at DESC`;

    // Pagination
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * limit;
    sql += ` LIMIT $${pIdx++} OFFSET $${pIdx++}`;
    params.push(limit, offset);

    const { rows: pages } = await pool.query(sql, params);
    res.json({ pages: pages || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pages/:id', authenticateToken as any, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(`
      SELECT cp.*, 
             ca.views, ca.clicks, ca.conversions
      FROM content_pages cp
      LEFT JOIN content_analytics ca ON cp.id = ca.page_id
      WHERE cp.id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Content page not found' });
    }

    res.json({ page: rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pages', authenticateAdmin, async (req, res) => {
  try {
    const {
      title,
      slug,
      type,
      status = 'draft',
      components = [],
      mobile_display = {}
    } = req.body;

    if (!title || !slug || !type) {
      return res.status(400).json({ error: 'Title, slug, and type are required' });
    }

    try {
      const { rows } = await pool.query(`
        INSERT INTO content_pages (title, slug, type, status, components, mobile_display, created_by, updated_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `, [
        title, slug, type, status,
        JSON.stringify(components),
        JSON.stringify(mobile_display),
        (req as any).admin?.id || (req as any).user?.id || 'admin',
        (req as any).admin?.id || (req as any).user?.id || 'admin'
      ]);

      res.status(201).json({ page: rows[0] });
    } catch (dbError) {
      console.warn('Database error, using mock service:', dbError);

      // Fallback to mock service
      const page = await mockContentService.createPage({
        title,
        slug,
        type,
        status,
        components,
        mobile_display,
        created_by: (req as any).admin?.id || (req as any).user?.id || 'admin',
        updated_by: (req as any).admin?.id || (req as any).user?.id || 'admin'
      });

      res.status(201).json({ page });
    }
  } catch (error: any) {
    console.error('Content creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/pages/:id', authenticateToken as any, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      type,
      status,
      components,
      mobile_display
    } = req.body;

    const sets: string[] = ['updated_at = NOW()'];
    const params: any[] = [id];
    let pIdx = 2;

    if (title !== undefined) { sets.push(`title = $${pIdx++}`); params.push(title); }
    if (slug !== undefined) { sets.push(`slug = $${pIdx++}`); params.push(slug); }
    if (type !== undefined) { sets.push(`type = $${pIdx++}`); params.push(type); }
    if (status !== undefined) { sets.push(`status = $${pIdx++}`); params.push(status); }
    if (components !== undefined) { sets.push(`components = $${pIdx++}`); params.push(JSON.stringify(components)); }
    if (mobile_display !== undefined) { sets.push(`mobile_display = $${pIdx++}`); params.push(JSON.stringify(mobile_display)); }

    const { rows } = await pool.query(
      `UPDATE content_pages SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({ page: rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/pages/:id', authenticateToken as any, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM content_pages WHERE id = $1', [id]);

    res.json({ message: 'Content page deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Dashboard - Public endpoint for content loading
router.get('/admin/content', async (req, res) => {
  try {
    const { type, status, page = 1, page_size = 20, search } = req.query;

    // Mock data for demo purposes when database is not available
    const mockPages = [
      {
        id: '1',
        title: 'Welcome to Bondarys',
        slug: 'welcome',
        type: 'page',
        status: 'published',
        content: 'Welcome to the Bondarys circle management platform!',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '2',
        title: 'Getting Started Guide',
        slug: 'getting-started',
        type: 'guide',
        status: 'published',
        content: 'Learn how to get started with Bondarys in just a few steps.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '3',
        title: 'circle Safety Tips',
        slug: 'safety-tips',
        type: 'article',
        status: 'draft',
        content: 'Important safety tips for your circle.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin',
        updated_by: 'admin'
      }
    ];

    try {
      let sql = 'SELECT * FROM content_pages WHERE 1=1';
      const params: any[] = [];
      let pIdx = 1;

      if (type && type !== 'all') {
        sql += ` AND type = $${pIdx++}`;
        params.push(type);
      }
      if (status && status !== 'all') {
        sql += ` AND status = $${pIdx++}`;
        params.push(status);
      }
      if (search) {
        sql += ` AND (title ILIKE $${pIdx} OR slug ILIKE $${pIdx})`;
        params.push(`%${search}%`);
        pIdx++;
      }

      sql += ' ORDER BY updated_at DESC';
      sql += ` LIMIT $${pIdx++} OFFSET $${pIdx++}`;
      params.push(Number(page_size), (Number(page) - 1) * Number(page_size));

      const { rows: pages } = await pool.query(sql, params);
      res.json({ pages: pages || [] });
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError);

      // Filter mock data based on parameters
      let filteredPages = mockPages;

      if (type && type !== 'all') {
        filteredPages = filteredPages.filter(p => p.type === type);
      }

      if (status && status !== 'all') {
        filteredPages = filteredPages.filter(p => p.status === status);
      }

      if (search) {
        const searchLower = String(search).toLowerCase();
        filteredPages = filteredPages.filter(p =>
          p.title.toLowerCase().includes(searchLower) ||
          p.slug.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const fromIndex = (Number(page) - 1) * Number(page_size);
      const toIndex = fromIndex + Number(page_size);
      const paginatedPages = filteredPages.slice(fromIndex, toIndex);

      res.json({ pages: paginatedPages });
    }
  } catch (error: any) {
    console.error('Admin content endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mobile App Content Integration
router.get('/mobile/content', async (req, res) => {
  try {
    const {
      type,
      show_on_login,
      show_on_home,
      show_on_news,
      show_as_popup
    } = req.query;

    let sql = `SELECT * FROM content_pages WHERE status = 'published'`;
    const params: any[] = [];
    let pIdx = 1;

    if (type) {
      sql += ` AND type = $${pIdx++}`;
      params.push(type);
    }
    if (show_on_login === 'true') {
      sql += ` AND mobile_display->>'showOnLogin' = 'true'`;
    }
    if (show_on_home === 'true') {
      sql += ` AND mobile_display->>'showOnHome' = 'true'`;
    }
    if (show_on_news === 'true') {
      sql += ` AND mobile_display->>'showOnNews' = 'true'`;
    }
    if (show_as_popup === 'true') {
      sql += ` AND mobile_display->>'showAsPopup' = 'true'`;
    }

    sql += ' ORDER BY created_at DESC';

    const { rows: content } = await pool.query(sql, params);
    res.json({ content: content || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Content Analytics
router.get('/pages/:id/analytics', authenticateToken as any, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      'SELECT * FROM content_analytics WHERE page_id = $1',
      [id]
    );

    const analytics = rows[0];

    res.json({
      analytics: analytics || {
        views: 0,
        clicks: 0,
        conversions: 0,
        last_viewed: null
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pages/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const { timestamp } = req.body;

    // Upsert analytics record using native SQL
    await pool.query(`
      INSERT INTO content_analytics (page_id, views, last_viewed)
      VALUES ($1, 1, $2)
      ON CONFLICT (page_id) 
      DO UPDATE SET 
        views = content_analytics.views + 1,
        last_viewed = $2
    `, [id, timestamp || new Date().toISOString()]);

    res.json({ message: 'View tracked successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Content Templates
router.get('/templates', authenticateToken as any, async (req, res) => {
  try {
    const { rows: templates } = await pool.query(
      'SELECT * FROM content_templates WHERE is_active = true ORDER BY name'
    );

    res.json({ templates: templates || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/templates/:id/create', authenticateToken as any, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug } = req.body;

    // Get template
    const { rows: templates } = await pool.query(
      'SELECT * FROM content_templates WHERE id = $1',
      [id]
    );

    const template = templates[0];

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Create page from template
    const { rows: pages } = await pool.query(
      `INSERT INTO content_pages (title, slug, type, status, components, mobile_display, created_by, updated_by, created_at, updated_at)
       VALUES ($1, $2, $3, 'draft', $4, $5, $6, $6, NOW(), NOW())
       RETURNING *`,
      [
        title || template.name,
        slug || `${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        template.type,
        JSON.stringify(template.components),
        JSON.stringify(template.mobile_display || {}),
        (req as any).user?.id
      ]
    );

    res.status(201).json({ page: pages[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve content by mobile route name
router.get('/by-route/:route', async (req, res) => {
  const route = req.params.route;
  try {
    const { rows: pages } = await pool.query(
      'SELECT * FROM content_pages WHERE route = $1 ORDER BY updated_at DESC LIMIT 1',
      [route]
    );

    res.json({ page: pages?.[0] || null });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

