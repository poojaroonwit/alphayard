import express from 'express';
import { authenticateToken } from '../../middleware/auth';
import { socialMediaService } from '../../services/socialMediaService';
import { prisma } from '../../lib/prisma';
import storageService from '../../services/storageService';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);

// =============================================
// MEDIA UPLOAD FOR SOCIAL POSTS
// =============================================

/**
 * POST /api/social-media/upload
 * Upload media for social posts - uses S3/MinIO storage
 */
router.post(
  '/upload',
  storageService.getMulterConfig({
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'],
    maxSize: 50 * 1024 * 1024, // 50MB max for videos
  }).single('file'),
  async (req: any, res: any) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, error: 'No file provided' });
      }

      const userId = req.user?.id || 'system';
      const circleId = req.body.circleId || req.user?.circleId || null;

      // Upload to S3/MinIO
      const uploaded = await storageService.uploadFile(file, userId, circleId, {
        folder: 'social/posts'
      });

      if (!uploaded || !uploaded.url) {
        return res.status(500).json({ success: false, error: 'Upload failed' });
      }

      res.json({
        success: true,
        data: {
          id: uploaded.id,
          url: uploaded.url,
          type: file.mimetype.startsWith('video/') ? 'video' : 'image',
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size
        }
      });
    } catch (error: any) {
      console.error('Social media upload error:', error);
      res.status(500).json({ success: false, error: error.message || 'Upload failed' });
    }
  }
);

// =============================================
// FAMILIES
// =============================================

/**
 * GET /api/social-media/families
 * Get all families for the authenticated user
 */
router.get('/families', async (req: any, res: any) => {
  try {
    const families = await socialMediaService.getFamilies();
    res.json({ success: true, data: families });
  } catch (error) {
    console.error('Error fetching families:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =============================================
// SOCIAL POSTS
// =============================================

/**
 * GET /api/social-media/posts
 * Query params:
 * - circleId: string (optional, 'all' for all families)
 * - status: string (optional, 'all' for all statuses)
 * - type: string (optional, 'all' for all types)
 * - reported: boolean (optional)
 * - search: string (optional)
 * - limit: number (optional, default 50)
 * - offset: number (optional, default 0)
 * - lat: number (optional, latitude for location filter)
 * - lng: number (optional, longitude for location filter)
 * - distance: number (optional, distance in km for location filter)
 * - sortBy: 'recent' | 'nearby' | 'popular' (optional)
 * - locationType: 'hometown' | 'workplace' | 'school' | 'all' (optional)
 */
router.get('/posts', async (req: any, res: any) => {
  try {
    const {
      circleId,
      status,
      type,
      reported,
      search,
      limit,
      offset,
      lat,
      lng,
      distance,
      sortBy,
      locationType
    } = req.query;

    console.log('[SocialPosts] Request params:', { circleId, limit, offset });

    const filters = {
      status: status as string,
      type: type as string,
      reported: reported === 'true' ? true : reported === 'false' ? false : undefined,
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      // Location-based filtering
      latitude: lat ? parseFloat(lat as string) : undefined,
      longitude: lng ? parseFloat(lng as string) : undefined,
      distanceKm: distance ? parseFloat(distance as string) : undefined,
      sortBy: sortBy as 'recent' | 'nearby' | 'popular' | undefined,
      locationType: locationType as 'hometown' | 'workplace' | 'school' | 'all' | undefined
    };

    const posts = await socialMediaService.getPosts(circleId as string, filters);
    console.log('[SocialPosts] Returning', posts.length, 'posts');
    // Return entities as-is - mobile app will unwrap them using unwrapEntity()
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/social-media/posts/:id
 * Get a specific post by ID
 */
router.get('/posts/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const post = await socialMediaService.getPostById(id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/social-media/posts
 * Create a new post
 */
router.post('/posts', async (req: any, res: any) => {
  try {
    console.log('Creating post. Body:', req.body);
    const postData = {
      ...req.body,
      circle_id: req.body.circle_id || req.body.circleId,
      author_id: req.user.id
    };

    if (!postData.circle_id) {
      console.error('Missing circle_id in createPost request');
      return res.status(400).json({ success: false, error: 'circle_id is required' });
    }

    const post = await socialMediaService.createPost(postData);
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/social-media/posts/:id
 * Update a post
 */
router.put('/posts/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const post = await socialMediaService.updatePost(id, req.body);
    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /api/social-media/posts/:id
 * Delete a post
 */
router.delete('/posts/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await socialMediaService.deletePost(id);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =============================================
// SOCIAL COMMENTS
// =============================================

/**
 * GET /api/social-media/posts/:postId/comments
 * Get comments for a specific post
 */
router.get('/posts/:postId/comments', async (req: any, res: any) => {
  try {
    const { postId } = req.params;
    const comments = await socialMediaService.getComments(postId);
    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/social-media/posts/:postId/comments
 * Create a new comment
 */
router.post('/posts/:postId/comments', async (req: any, res: any) => {
  try {
    const { postId } = req.params;
    const commentData = {
      post_id: postId,
      author_id: req.user.id,
      content: req.body.content,
      media: req.body.media, // content: { type, url }
      parentId: req.body.parentId // Optional parent ID for replies
    };

    const comment = await socialMediaService.createComment(commentData);
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /api/social-media/comments/:id
 * Delete a comment
 */
router.delete('/comments/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await socialMediaService.deleteComment(id);
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =============================================
// SOCIAL REPORTS
// =============================================

/**
 * GET /api/social-media/reports
 * Get all reports (optionally filtered by postId)
 */
router.get('/reports', async (req: any, res: any) => {
  try {
    const { postId } = req.query;
    const reports = await socialMediaService.getReports(postId as string);
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/social-media/reports
 * Create a new report
 */
router.post('/reports', async (req: any, res: any) => {
  try {
    const reportData = {
      ...req.body,
      reporter_id: req.user.id
    };

    const report = await socialMediaService.createReport(reportData);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/social-media/reports/:id/status
 * Update report status
 */
router.put('/reports/:id/status', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const report = await socialMediaService.updateReportStatus(id, status, req.user.id);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =============================================
// SOCIAL ACTIVITIES
// =============================================

/**
 * GET /api/social-media/posts/:postId/activities
 * Get activities for a specific post
 */
router.get('/posts/:postId/activities', async (req: any, res: any) => {
  try {
    const { postId } = req.params;
    const activities = await socialMediaService.getActivities(postId);
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/social-media/posts/:postId/activities
 * Create a new activity
 */
router.post('/posts/:postId/activities', async (req: any, res: any) => {
  try {
    const { postId } = req.params;
    const activityData = {
      postId: postId,
      userId: req.user.id,
      activityType: req.body.action,
      metadata: req.body.details
    };

    const activity = await socialMediaService.createActivity(activityData);
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =============================================
// LIKES
// =============================================

/**
 * POST /api/social-media/posts/:postId/like
 * Like a post
 */
router.post('/posts/:postId/like', async (req: any, res: any) => {
  try {
    const { postId } = req.params;
    await socialMediaService.likePost(postId, req.user.id);
    res.json({ success: true, message: 'Post liked successfully' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /api/social-media/posts/:postId/like
 * Unlike a post
 */
router.delete('/posts/:postId/like', async (req: any, res: any) => {
  try {
    const { postId } = req.params;
    await socialMediaService.unlikePost(postId, req.user.id);
    res.json({ success: true, message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/social-media/comments/:commentId/like
 * Like a comment
 */
router.post('/comments/:commentId/like', async (req: any, res: any) => {
  try {
    const { commentId } = req.params;
    await socialMediaService.likeComment(commentId, req.user.id);
    res.json({ success: true, message: 'Comment liked successfully' });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /api/social-media/comments/:commentId/like
 * Unlike a comment
 */
router.delete('/comments/:commentId/like', async (req: any, res: any) => {
  try {
    const { commentId } = req.params;
    await socialMediaService.unlikeComment(commentId, req.user.id);
    res.json({ success: true, message: 'Comment unliked successfully' });
  } catch (error) {
    console.error('Error unliking comment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =============================================
// ANALYTICS
// =============================================

/**
 * GET /api/social-media/posts/:postId/analytics
 * Get analytics for a specific post
 */
router.get('/posts/:postId/analytics', async (req: any, res: any) => {
  try {
    const { postId } = req.params;
    const analytics = await socialMediaService.getPostAnalytics(postId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching post analytics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/social-media/families/:circleId/analytics
 * Get analytics for a circle
 */
router.get('/families/:circleId/analytics', async (req: any, res: any) => {
  try {
    const { circleId } = req.params;
    const analytics = await socialMediaService.getCircleAnalytics(circleId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching circle analytics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// =============================================
// MISC (Merged from mock)
// =============================================

/**
 * GET /api/social/trending-tags
 * Get trending tags from actual post content
 */
router.get('/trending-tags', async (req: any, res: any) => {
  try {
    const { limit = 10, days = 7 } = req.query;
    
    // Extract hashtags from recent posts and count occurrences
    const result = await prisma.$queryRaw<any[]>`
      WITH hashtags AS (
        SELECT 
          LOWER(TRIM(tag)) as tag,
          COUNT(*) as count
        FROM entities e,
        LATERAL (
          SELECT regexp_matches(e.attributes->>'content', '#([A-Za-z0-9_]+)', 'g') as matches
        ) r,
        LATERAL unnest(r.matches) as tag
        WHERE e.type_name = 'social-posts'
        AND e.deleted_at IS NULL
        AND e.created_at > NOW() - INTERVAL '1 day' * ${parseInt(days as string)}
        GROUP BY LOWER(TRIM(tag))
        ORDER BY count DESC
        LIMIT ${parseInt(limit as string)}
      )
      SELECT tag, count FROM hashtags
    `;

    // If no tags found in posts, return default suggestions
    let tags = result.map(row => row.tag);
    
    if (tags.length === 0) {
      // Check for any tags in the database
      const anyTagsResult = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT LOWER(TRIM(tag)) as tag
        FROM entities e,
        LATERAL (
          SELECT regexp_matches(e.attributes->>'content', '#([A-Za-z0-9_]+)', 'g') as matches
        ) r,
        LATERAL unnest(r.matches) as tag
        WHERE e.type_name = 'social-posts'
        AND e.deleted_at IS NULL
        ORDER BY tag
        LIMIT ${parseInt(limit as string)}
      `;
      
      tags = anyTagsResult.map(row => row.tag);
      
      // If still no tags, return default suggestions
      if (tags.length === 0) {
        tags = ['family', 'vacation', 'weekend', 'dinner', 'celebration', 'memories', 'together', 'love'];
      }
    }

    res.json({
      success: true,
      tags,
      counts: result.reduce((acc: any, row) => {
        acc[row.tag] = parseInt(row.count);
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Get trending tags error:', error);
    // Return default tags on error
    res.json({
      success: true,
      tags: ['family', 'vacation', 'groceries', 'weekend', 'planning'],
      counts: {}
    });
  }
});

/**
 * GET /api/social/nearby
 * Query params:
 * - lat, lng: number (required)
 * - radiusKm: number in km (default 1, supports 1,5,10,custom)
 * - workplace, hometown, school, university: optional string filters
 * - limit: number (default 50)
 */
router.get('/nearby', async (req: any, res: any) => {
  try {
    const lat = parseFloat(String(req.query.lat ?? ''));
    const lng = parseFloat(String(req.query.lng ?? ''));
    const radiusKm = parseFloat(String(req.query.radiusKm ?? '1'));
    const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10) || 50, 100);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, error: 'lat and lng are required numbers' });
    }
    const radiusMeters = Math.max(0, radiusKm) * 1000;

    // Optional profile filters
    const workplace = (req.query.workplace as string) || undefined;
    const hometown = (req.query.hometown as string) || undefined;
    const school = (req.query.school as string) || (req.query.university as string) || undefined;

    // Direct SQL for nearby users using Unified Entities
    let sql = `
      SELECT DISTINCT ON (e.owner_id) 
             e.owner_id AS id, u.first_name AS "firstName", u.last_name AS "lastName", 
             u.avatar_url AS "avatarUrl", u.avatar_url AS "avatar",
             ST_Distance(e.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance_m
      FROM unified_entities e
      JOIN core.users u ON e.owner_id = u.id
      WHERE e.type = 'location_history' AND e.location IS NOT NULL
        AND ST_DWithin(e.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
    `;
    const params: any[] = [lng, lat, radiusMeters];
    let pIdx = 4;

    if (workplace) {
      sql += ` AND u.workplace ILIKE $${pIdx++}`;
      params.push(`%${workplace}%`);
    }
    if (hometown) {
      sql += ` AND u.hometown ILIKE $${pIdx++}`;
      params.push(`%${hometown}%`);
    }
    if (school) {
      sql += ` AND (u.school ILIKE $${pIdx} OR u.university ILIKE $${pIdx})`;
      params.push(`%${school}%`);
      pIdx++;
    }

    sql += ` ORDER BY e.owner_id, e.created_at DESC LIMIT $${pIdx}`;
    params.push(limit);

    const rows = await prisma.$queryRawUnsafe<any[]>(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Nearby users error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/social/profile-filters
 * Returns filter options from existing users (distinct workplace, hometown, school/university)
 */
router.get('/profile-filters', async (_req: any, res: any) => {
  try {
    // Attempt to read distinct values
    const [workRes, homeRes, schoolRes] = await Promise.all([
      prisma.$queryRaw<any[]>`SELECT DISTINCT workplace FROM core.users WHERE workplace IS NOT NULL AND workplace != '' LIMIT 200`,
      prisma.$queryRaw<any[]>`SELECT DISTINCT hometown FROM core.users WHERE hometown IS NOT NULL AND hometown != '' LIMIT 200`,
      prisma.$queryRaw<any[]>`SELECT DISTINCT school, university FROM core.users LIMIT 200`
    ]);

    const workplaces = workRes.map((r: any) => r.workplace);
    const hometowns = homeRes.map((r: any) => r.hometown);
    const schools = schoolRes
      .flatMap((r: any) => [r.school, r.university])
      .filter(Boolean);

    return res.json({
      success: true, data: {
        workplaces: Array.from(new Set(workplaces)),
        hometowns: Array.from(new Set(hometowns)),
        schools: Array.from(new Set(schools))
      }
    });
  } catch (err) {
    console.error('Profile filters error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

