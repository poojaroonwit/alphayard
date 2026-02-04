import express from 'express';
import { authenticateToken } from '../../middleware/auth';
import { socialMediaService } from '../../services/socialMediaService';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);

/**
 * Mapping helper for SocialPost
 */
const mapToMobileFormat = (post: any) => ({
    id: post.id,
    author: {
        name: `${post.author?.first_name || ''} ${post.author?.last_name || ''}`.trim() || 'User',
        avatar: post.author?.avatar_url || null,
        isVerified: true,
    },
    content: post.content,
    timestamp: post.created_at,
    likes: post.likes_count || 0,
    comments: post.comments_count || 0,
    shares: post.shares_count || 0,
    isLiked: false, // Default to false, real implementation should check social_post_likes
    media: post.media_urls?.[0] ? {
        type: post.type === 'video' ? 'video' : 'image',
        url: post.media_urls[0]
    } : undefined,
    location: post.location,
    tags: post.tags || [],
});

/**
 * GET /api/social/posts
 */
router.get('/posts', async (req: any, res: any) => {
    try {
        const { circleId, limit, offset } = req.query;
        const filters = {
            limit: limit ? parseInt(limit as string) : 20,
            offset: offset ? parseInt(offset as string) : 0,
            status: 'active'
        };

        const posts = await socialMediaService.getPosts(circleId as string, filters);

        res.json({
            success: true,
            posts: posts.map(mapToMobileFormat)
        });
    } catch (error) {
        console.error('Mobile posts fetch error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/social/posts
 */
router.post('/posts', async (req: any, res: any) => {
    try {
        const { content, circleId, media, location, tags } = req.body;

        const postData = {
            circle_id: circleId,
            author_id: req.user.id,
            content: content,
            type: media?.type || 'text',
            media_urls: media?.url ? [media.url] : [],
            location: location,
            tags: tags || [],
            visibility: 'circle' as const
        };

        const post = await socialMediaService.createPost(postData);

        res.json({
            success: true,
            post: mapToMobileFormat(post)
        });
    } catch (error) {
        console.error('Mobile post create error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/social/trending-tags
 */
router.get('/trending-tags', async (req: any, res: any) => {
    try {
        // For now return hardcoded tags or add a method to service
        res.json({
            success: true,
            tags: ['circle', 'vacation', 'groceries', 'weekend', 'planning']
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;

