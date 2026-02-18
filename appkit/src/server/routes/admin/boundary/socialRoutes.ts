import express, { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { authenticateAdmin } from '../../../middleware/adminAuth';
import { requirePermission } from '../../../middleware/permissionCheck';
import socialMediaService from '../../../services/socialMediaService';

const router = express.Router();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// @route   GET /api/admin/boundary/social/posts
// @desc    Get all social posts with moderation info
// @access  Private/Admin
router.get('/posts', requirePermission('social', 'view'), async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, status, search, circleId } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = "WHERE type = 'social-posts'";
        const params: any[] = [];
        let paramIndex = 1;

        if (status && status !== 'all') {
            whereClause += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        } else {
            whereClause += ` AND status != 'deleted'`;
        }

        if (search) {
            whereClause += ` AND (data->>'content' ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (circleId) {
            whereClause += ` AND data->>'circleId' = $${paramIndex}`;
            params.push(circleId);
            paramIndex++;
        }

        const countQuery = `SELECT COUNT(*) FROM unified_entities ${whereClause}`;
        const countRows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            countQuery, ...params
        );
        const total = parseInt(countRows[0].count.toString());

        const query = `
            SELECT 
                ue.id,
                ue.data->>'content' as content,
                ue.data->>'circleId' as circle_id,
                ue.data->'media' as media,
                ue.owner_id as author_id,
                ue.status,
                ue.created_at,
                ue.updated_at,
                u.email as author_email,
                u.first_name as author_first_name,
                u.last_name as author_last_name,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'social-comments' AND data->>'postId' = ue.id::text) as comment_count,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'social-likes' AND data->>'postId' = ue.id::text) as like_count
            FROM unified_entities ue
            LEFT JOIN core.users u ON ue.owner_id = u.id
            ${whereClause}
            ORDER BY ue.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(limitNum, offset);

        const rows = await prisma.$queryRawUnsafe(query, ...params) as any[];

        res.json({
            posts: rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error: any) {
        console.error('Get social posts error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/boundary/social/posts/:id
// @desc    Get social post details
// @access  Private/Admin
router.get('/posts/:id', requirePermission('social', 'view'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const rows = await prisma.$queryRawUnsafe(`
            SELECT 
                ue.*,
                u.email as author_email,
                u.first_name as author_first_name,
                u.last_name as author_last_name,
                u.avatar_url as author_avatar
            FROM unified_entities ue
            LEFT JOIN core.users u ON ue.owner_id = u.id
            WHERE ue.id = $1 AND ue.type = 'social-posts'
        `, id) as any[];

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Get comments
        const comments = await prisma.$queryRawUnsafe(`
            SELECT 
                ue.id,
                ue.data->>'content' as content,
                ue.owner_id as author_id,
                ue.created_at,
                u.email as author_email,
                u.first_name,
                u.last_name
            FROM unified_entities ue
            LEFT JOIN core.users u ON ue.owner_id = u.id
            WHERE ue.type = 'social-comments' AND ue.data->>'postId' = $1
            ORDER BY ue.created_at DESC
            LIMIT 50
        `, id) as any[];

        res.json({
            post: rows[0],
            comments
        });
    } catch (error: any) {
        console.error('Get social post details error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/admin/boundary/social/posts/:id
// @desc    Update/moderate social post
// @access  Private/Admin
router.put('/posts/:id', requirePermission('social', 'moderate'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, moderationNote } = req.body;

        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (status) {
            updates.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (moderationNote) {
            updates.push(`data = jsonb_set(data, '{moderationNote}', $${paramIndex}::jsonb)`);
            params.push(JSON.stringify(moderationNote));
            paramIndex++;
        }

        updates.push('updated_at = NOW()');
        params.push(id);

        const query = `
            UPDATE unified_entities 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex} AND type = 'social-posts'
            RETURNING *
        `;

        const rows = await prisma.$queryRawUnsafe(query, ...params) as any[];

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(rows[0]);
    } catch (error: any) {
        console.error('Update social post error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/admin/boundary/social/posts/:id
// @desc    Delete social post (soft delete)
// @access  Private/Admin
router.delete('/posts/:id', requirePermission('social', 'delete'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await socialMediaService.deletePost(id);
        res.json({ message: 'Post deleted successfully' });
    } catch (error: any) {
        console.error('Delete social post error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/admin/boundary/social/comments/:id
// @desc    Delete social comment
// @access  Private/Admin
router.delete('/comments/:id', requirePermission('social', 'delete'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.$executeRawUnsafe(`
            UPDATE unified_entities 
            SET status = 'deleted', updated_at = NOW()
            WHERE id = $1 AND type = 'social-comments'
        `, id);

        res.json({ message: 'Comment deleted successfully' });
    } catch (error: any) {
        console.error('Delete social comment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/boundary/social/stats
// @desc    Get social media statistics
// @access  Private/Admin
router.get('/stats', requirePermission('social', 'view'), async (req: Request, res: Response) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period as string);

        const rows = await prisma.$queryRawUnsafe(`
            SELECT 
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'social-posts' AND status != 'deleted') as total_posts,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'social-comments' AND status != 'deleted') as total_comments,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'social-likes') as total_likes,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'social-posts' AND created_at >= NOW() - INTERVAL '1 day' * $1) as recent_posts,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'social-posts' AND status = 'flagged') as flagged_posts
        `, days) as any[];

        res.json(rows[0]);
    } catch (error: any) {
        console.error('Get social stats error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/boundary/social/reports
// @desc    Get reported content
// @access  Private/Admin
router.get('/reports', requirePermission('social', 'moderate'), async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, status = 'pending' } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        const rows = await prisma.$queryRawUnsafe(`
            SELECT 
                ue.id,
                ue.data->>'contentId' as content_id,
                ue.data->>'contentType' as content_type,
                ue.data->>'reason' as reason,
                ue.data->>'description' as description,
                ue.owner_id as reporter_id,
                ue.status,
                ue.created_at,
                u.email as reporter_email
            FROM unified_entities ue
            LEFT JOIN core.users u ON ue.owner_id = u.id
            WHERE ue.type = 'content-report' AND ue.status = $1
            ORDER BY ue.created_at DESC
            LIMIT $2 OFFSET $3
        `, status, limitNum, offset) as any[];

        res.json({ reports: rows });
    } catch (error: any) {
        console.error('Get social reports error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/admin/boundary/social/reports/:id
// @desc    Handle content report
// @access  Private/Admin
router.put('/reports/:id', requirePermission('social', 'moderate'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { action, note } = req.body; // action: 'dismiss', 'remove_content', 'warn_user', 'ban_user'

        await prisma.$executeRawUnsafe(`
            UPDATE unified_entities 
            SET 
                status = 'resolved',
                data = data || $1::jsonb,
                updated_at = NOW()
            WHERE id = $2 AND type = 'content-report'
        `, JSON.stringify({ action, resolutionNote: note, resolvedAt: new Date().toISOString() }), id);

        res.json({ message: 'Report handled successfully' });
    } catch (error: any) {
        console.error('Handle social report error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
