import express from 'express';
import { authenticateToken } from '../../middleware/auth';
import { socialMediaService } from '../../services/socialMediaService';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);

/**
 * Mapping helper for SocialPost
 * Maps unified entity format to mobile app format
 */
const mapToMobileFormat = (post: any) => {
    // Unified entities store data in attributes/data field
    const attrs = post.attributes || post.data || {};
    const authorName = attrs.author_name || attrs.authorName || 'User';
    
    return {
        id: post.id,
        author: {
            name: authorName,
            avatar: attrs.author_avatar || attrs.avatar || null,
            isVerified: true,
        },
        content: attrs.content || '',
        timestamp: post.createdAt || post.created_at,
        likes: attrs.like_count || attrs.likes_count || attrs.likes || 0,
        comments: attrs.comments_count || attrs.comments || 0,
        shares: attrs.shares_count || attrs.shares || 0,
        isLiked: false, // Default to false, real implementation should check social_post_likes
        media: attrs.media_urls?.[0] || attrs.mediaUrls?.[0] ? {
            type: (attrs.type === 'video' || attrs.post_type === 'video') ? 'video' : 'image',
            url: attrs.media_urls?.[0] || attrs.mediaUrls?.[0]
        } : undefined,
        location: attrs.location || null,
        tags: attrs.tags || [],
    };
};

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

