import { Router, Request, Response } from 'express';
import { pool } from '../config/database';

const router = Router();

/**
 * GET /cms/marketing/slides
 * Get marketing slides for onboarding/login screens
 */
router.get('/slides', async (_req: Request, res: Response) => {
  try {
    const { rows: data } = await pool.query(`
      SELECT 
        id, title, slug, content, status, priority, is_featured, created_at, updated_at, slide_data
      FROM marketing_content
      WHERE status = 'published' AND content_type_id = 'marketing_slide'
      ORDER BY slide_order ASC
    `);

    // Transform data to match expected format
    const slides = (data || []).map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      content: item.content,
      status: item.status,
      priority: item.priority,
      is_featured: item.is_featured,
      created_at: item.created_at,
      updated_at: item.updated_at,
      slideData: item.slide_data
    }));

    res.json({ slides: slides.length > 0 ? slides : getFallbackSlides() });
  } catch (error) {
    console.error('Error in marketing slides endpoint:', error);
    res.json({ slides: getFallbackSlides() });
  }
});

/**
 * GET /cms/marketing/content
 * Get all marketing content
 */
router.get('/content', async (req: Request, res: Response) => {
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

    const { rows: data } = await pool.query(sql, params);
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
      title: 'Welcome to Bondarys',
      subtitle: 'Family Management Made Simple',
      description: 'Connect, organize, and share with your family in one beautiful app',
      icon: 'home',
      gradient: ['#667eea', '#764ba2'],
      features: ['Family Calendar', 'Shared Tasks', 'Photo Albums'],
      slide_order: 1,
      slideData: {
        id: '1',
        title: 'Welcome to Bondarys',
        subtitle: 'Family Management Made Simple',
        description: 'Connect, organize, and share with your family in one beautiful app',
        icon: 'home',
        gradient: ['#667eea', '#764ba2'],
        features: ['Family Calendar', 'Shared Tasks', 'Photo Albums'],
        slide_order: 1
      }
    },
    {
      id: '2',
      title: 'Stay Connected',
      subtitle: 'Real-time Communication',
      description: 'Chat, share locations, and stay in touch with family members',
      icon: 'message-circle',
      gradient: ['#f093fb', '#f5576c'],
      features: ['Group Chat', 'Location Sharing', 'Safety Alerts'],
      slide_order: 2,
      slideData: {
        id: '2',
        title: 'Stay Connected',
        subtitle: 'Real-time Communication',
        description: 'Chat, share locations, and stay in touch with family members',
        icon: 'message-circle',
        gradient: ['#f093fb', '#f5576c'],
        features: ['Group Chat', 'Location Sharing', 'Safety Alerts'],
        slide_order: 2
      }
    },
    {
      id: '3',
      title: 'Organize Together',
      subtitle: 'Shared Planning Tools',
      description: 'Manage tasks, events, and memories as a family',
      icon: 'calendar',
      gradient: ['#4facfe', '#00f2fe'],
      features: ['Event Planning', 'Task Management', 'Memory Sharing'],
      slide_order: 3,
      slideData: {
        id: '3',
        title: 'Organize Together',
        subtitle: 'Shared Planning Tools',
        description: 'Manage tasks, events, and memories as a family',
        icon: 'calendar',
        gradient: ['#4facfe', '#00f2fe'],
        features: ['Event Planning', 'Task Management', 'Memory Sharing'],
        slide_order: 3
      }
    }
  ];
}

export default router;
