import express from 'express';
import { prisma } from '../../../lib/prisma';
import { authenticateAdmin } from '../../../middleware/adminAuth';
import { requirePermission } from '../../../middleware/permissionCheck';
import { body, query, validationResult } from 'express-validator';

const router = express.Router();

// Apply admin auth to all routes
router.use(authenticateAdmin);

// @route   GET /api/admin/boundary/social
// @desc    Get all social posts with pagination
// @access  Private/Admin
router.get('/', requirePermission('social', 'view'), async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', status, type } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;
        
        let whereClause = "WHERE type = 'post' AND status != 'deleted'";
        const params: any[] = [];
        let paramIndex = 1;
        
        if (search) {
            whereClause += ` AND (data->>'content' ILIKE $${paramIndex} OR data->>'title' ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        if (status) {
            whereClause += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        
        if (type) {
            whereClause += ` AND data->>'type' = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        
        const countQuery = `SELECT COUNT(*) FROM unified_entities ${whereClause}`;
        const countRows = await prisma.$queryRawUnsafe(countQuery, ...params);
        const total = parseInt((countRows as any)[0].count.toString());
        
        const query = `
            SELECT 
                id,
                data->>'title' as title,
                data->>'content' as content,
                data->>'type' as type,
                data->>'media' as media,
                owner_id,
                status,
                created_at,
                updated_at,
                (SELECT COUNT(*) FROM entity_relations WHERE target_id = unified_entities.id AND relation_type = 'like') as likes_count,
                (SELECT COUNT(*) FROM entity_relations WHERE target_id = unified_entities.id AND relation_type = 'comment') as comments_count
            FROM unified_entities
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        params.push(limitNum, offset);
        const posts = await prisma.$queryRawUnsafe(query, ...params);
        
        res.json({
            posts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching social posts:', error);
        res.status(500).json({ error: 'Failed to fetch social posts' });
    }
});

// @route   GET /api/admin/boundary/social/:id
// @desc    Get social post by ID with comments
// @access  Private/Admin
router.get('/:id', requirePermission('social', 'view'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const post = await prisma.$queryRawUnsafe(`
            SELECT 
                ue.*,
                data->>'title' as title,
                data->>'content' as content,
                data->>'type' as type,
                data->>'media' as media,
                data->>'tags' as tags,
                data->>'location' as location
            FROM unified_entities ue
            WHERE ue.id = $1 AND ue.type = 'post' AND ue.status != 'deleted'
        `, id);
        
        if (!post || (post as any[]).length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Get comments
        const comments = await prisma.$queryRawUnsafe(`
            SELECT 
                ue.*,
                u.email,
                u.data->>'firstName' as first_name,
                u.data->>'lastName' as last_name,
                u.data->>'avatar' as avatar
            FROM unified_entities ue
            JOIN core.users u ON ue.owner_id = u.id::text
            WHERE ue.data->>'postId' = $1 AND ue.type = 'comment' AND ue.status != 'deleted'
            ORDER BY ue.created_at ASC
        `, id);
        
        // Get likes
        const likes = await prisma.$queryRawUnsafe(`
            SELECT 
                u.id,
                u.email,
                u.data->>'firstName' as first_name,
                u.data->>'lastName' as last_name
            FROM entity_relations er
            JOIN core.users u ON er.source_id = u.id::text
            WHERE er.target_id = $1 AND er.relation_type = 'like'
        `, id);
        
        res.json({
            post: (post as any[])[0],
            comments,
            likes: (likes as any[]).length
        });
    } catch (error) {
        console.error('Error fetching social post:', error);
        res.status(500).json({ error: 'Failed to fetch social post' });
    }
});

// @route   PUT /api/admin/boundary/social/:id/status
// @desc    Update social post status
// @access  Private/Admin
router.put('/:id/status', [
    body('status').isIn(['active', 'inactive', 'suspended', 'flagged']).withMessage('Invalid status')
], requirePermission('social', 'manage'), async (req: any, res: any) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { id } = req.params;
        const { status } = req.body;
        
        const result = await prisma.$queryRawUnsafe(`
            UPDATE unified_entities 
            SET status = $1, updated_at = NOW()
            WHERE id = $2 AND type = 'post'
            RETURNING id, status
        `, status, id);
        
        if (!result || (result as any[]).length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        res.json({
            message: 'Post status updated successfully',
            post: (result as any[])[0]
        });
    } catch (error) {
        console.error('Error updating post status:', error);
        res.status(500).json({ error: 'Failed to update post status' });
    }
});

// @route   DELETE /api/admin/boundary/social/:id
// @desc    Delete social post (soft delete)
// @access  Private/Admin
router.delete('/:id', requirePermission('social', 'delete'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await prisma.$queryRawUnsafe(`
            UPDATE unified_entities 
            SET status = 'deleted', updated_at = NOW()
            WHERE id = $1 AND type = 'post'
            RETURNING id
        `, id);
        
        if (!result || (result as any[]).length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        res.json({
            message: 'Post deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// @route   GET /api/admin/boundary/social/stats
// @desc    Get social media statistics
// @access  Private/Admin
router.get('/stats', requirePermission('social', 'view'), async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period as string);
        
        const stats = await prisma.$queryRawUnsafe(`
            SELECT 
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'post' AND status != 'deleted') as total_posts,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'post' AND status = 'active') as active_posts,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'post' AND created_at >= NOW() - INTERVAL '${days} days') as recent_posts,
                (SELECT COUNT(*) FROM entity_relations WHERE relation_type = 'like') as total_likes,
                (SELECT COUNT(*) FROM entity_relations WHERE relation_type = 'comment') as total_comments,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'comment' AND status != 'deleted') as total_comments_posts
        `);
        
        res.json({
            stats: (stats as any[])[0],
            period: days
        });
    } catch (error) {
        console.error('Error fetching social stats:', error);
        res.status(500).json({ error: 'Failed to fetch social stats' });
    }
});

export default router;
