/**
 * Boundary App-Specific Admin Routes
 * These routes are specific to the Boundary application
 * Includes: Circles/Families, Social, Chat, Safety Alerts, etc.
 * 
 * Note: Users, Subscriptions, Broadcast, and Impersonation are in common routes
 */
import express, { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { authenticateAdmin } from '../../../middleware/adminAuth';
import { requirePermission } from '../../../middleware/permissionCheck';
import { auditAdminRequests } from '../../../middleware/audit';

// Import boundary-specific routers (local files)
import circlesRoutes from './circlesRoutes';
import socialRoutes from './socialRoutes';

const router = express.Router();

// Apply audit middleware
router.use(auditAdminRequests());

// =============================================
// Circles/Families Management
// =============================================
router.use('/circles', circlesRoutes);
router.use('/families', circlesRoutes); // Alias for backward compatibility

// =============================================
// Social Media Management
// =============================================
router.use('/social', socialRoutes);

// =============================================
// Dashboard Route (Boundary-specific stats)
// =============================================

// @route   GET /api/admin/boundary/dashboard
// @desc    Get Boundary app dashboard stats (includes circles, social, chat)
// @access  Private/Admin
router.get('/dashboard', authenticateAdmin as any, requirePermission('dashboard', 'view'), async (req: Request, res: Response) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period as string);

        // Get Boundary-specific stats
        const basicsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM core.users) as total_users,
                (SELECT COUNT(*) FROM core.users WHERE is_active = true) as active_users,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'circle' AND status != 'deleted') as total_families,
                0 as active_subscriptions,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'post' AND status != 'deleted') as total_posts,
                (SELECT COUNT(*) FROM appkit.chat_messages) as total_messages
        `;
        const basics = await prisma.$queryRawUnsafe(basicsQuery) as any[];
        const { total_users, active_users, total_families, active_subscriptions, total_posts, total_messages } = basics[0];

        // Get recent activity counts
        const recentQuery = `
            SELECT 
                (SELECT COUNT(*) FROM core.users WHERE created_at >= NOW() - INTERVAL '1 day' * $1) as recent_users,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'circle' AND created_at >= NOW() - INTERVAL '1 day' * $1) as recent_families,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'safety_alert' AND created_at >= NOW() - INTERVAL '1 day' * $1) as recent_alerts,
                (SELECT COUNT(*) FROM appkit.chat_messages WHERE created_at >= NOW() - INTERVAL '1 day' * $1) as recent_messages,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'post' AND created_at >= NOW() - INTERVAL '1 day' * $1) as recent_posts
        `;
        const recent = await prisma.$queryRawUnsafe(recentQuery, days) as any[];
        const { recent_users, recent_families, recent_alerts, recent_messages, recent_posts } = recent[0];

        // Revenue stats not available - subscription tables removed
        const revenue = {
            total_revenue: 0,
            avg_revenue: 0,
            subscription_count: 0,
        };

        // Get user growth by day
        const growthQuery = `
            SELECT 
                EXTRACT(YEAR FROM created_at) as year,
                EXTRACT(MONTH FROM created_at) as month,
                EXTRACT(DAY FROM created_at) as day,
                COUNT(*) as count
            FROM core.users
            WHERE created_at >= NOW() - INTERVAL '1 day' * $1
            GROUP BY year, month, day
            ORDER BY year, month, day
        `;
        const userGrowth = await prisma.$queryRawUnsafe(growthQuery, days) as any[];

        res.json({
            stats: {
                totalUsers: parseInt(total_users),
                activeUsers: parseInt(active_users),
                totalFamilies: parseInt(total_families),
                activeSubscriptions: parseInt(active_subscriptions),
                totalPosts: parseInt(total_posts),
                totalMessages: parseInt(total_messages),
                recentUsers: parseInt(recent_users),
                recentFamilies: parseInt(recent_families),
                recentAlerts: parseInt(recent_alerts),
                recentMessages: parseInt(recent_messages),
                recentPosts: parseInt(recent_posts),
                revenue: {
                    totalRevenue: parseFloat(String(revenue.total_revenue || 0)),
                    avgRevenue: parseFloat(String(revenue.avg_revenue || 0)),
                    subscriptionCount: Number(revenue.subscription_count || 0),
                },
            },
            userGrowth: userGrowth.map(row => ({
                _id: { year: parseInt(row.year), month: parseInt(row.month), day: parseInt(row.day) },
                count: parseInt(row.count)
            })),
        });
    } catch (error: any) {
        console.error('Boundary dashboard error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// =============================================
// Alerts Routes (Safety Incidents - Boundary specific)
// =============================================

// @route   GET /api/admin/boundary/alerts
// @desc    Get emergency alerts
// @access  Private/Admin
router.get('/alerts', authenticateAdmin as any, requirePermission('alerts', 'view'), async (req: Request, res: Response) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            type,
            sortBy = 'created_at',
            sortOrder = 'desc',
        } = req.query;

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        let whereClause = 'WHERE 1=1';
        const params: any[] = [];
        let paramIdx = 1;

        if (status) {
            whereClause += ` AND sa.is_acknowledged = $${paramIdx}`;
            params.push(status === 'resolved' || status === 'acknowledged');
            paramIdx++;
        }

        if (type) {
            whereClause += ` AND sa.type = $${paramIdx}`;
            params.push(type);
            paramIdx++;
        }

        const sortField = ['created_at'].includes(sortBy as string) ? sortBy : 'created_at';
        const direction = (sortOrder as string).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const alertsQuery = `
            SELECT sa.id, sa.data, sa.metadata, sa.created_at, sa.status,
                   u.email as user_email,
                   u.first_name || ' ' || u.last_name as user_name
            FROM unified_entities sa
            JOIN core.users u ON sa.owner_id = u.id
            ${whereClause} AND sa.type = 'safety_alert'
            ORDER BY sa.${sortField} ${direction}
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;

        const countQuery = `SELECT COUNT(*) FROM unified_entities sa ${whereClause} AND sa.type = 'safety_alert'`;

        const [alertsRes, countRes] = await Promise.all([
            prisma.$queryRawUnsafe(alertsQuery, ...params, parseInt(limit as string), offset) as Promise<any[]>,
            prisma.$queryRawUnsafe<Array<{ count: bigint }>>(countQuery, ...params)
        ]);

        const total = parseInt(countRes[0].count.toString());

        res.json({
            alerts: alertsRes,
            totalPages: Math.ceil(total / parseInt(limit as string)),
            currentPage: parseInt(page as string),
            total,
        });
    } catch (error: any) {
        console.error('Get alerts error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// =============================================
// Social Posts Routes (Legacy - kept for backward compatibility)
// =============================================

// @route   GET /api/admin/boundary/social-posts
// @desc    Get all social posts for admin
// @access  Private/Admin
// @deprecated Use /admin/boundary/social/posts instead
router.get('/social-posts', authenticateAdmin as any, requirePermission('social', 'view'), async (req: Request, res: Response) => {
    try {
        const posts = await prisma.$queryRawUnsafe(`
            SELECT sp.id, sp.data, sp.metadata, sp.created_at as "createdAt",
                   u.first_name as "firstName", u.last_name as "lastName", u.email as "userEmail",
                   f.data->>'name' as "circleName"
            FROM unified_entities sp
            LEFT JOIN core.users u ON sp.owner_id = u.id
            LEFT JOIN unified_entities f ON (sp.data->>'circle_id')::uuid = f.id
            WHERE sp.type = 'post' AND sp.status != 'deleted'
            ORDER BY sp.created_at DESC
        `) as any[];

        const formattedPosts = posts.map(post => ({
            id: post.id,
            data: post.data,
            metadata: post.metadata,
            createdAt: post.createdAt,
            circleName: post.circleName,
            user: {
                firstName: post.firstName || 'Unknown',
                lastName: post.lastName || '',
                email: post.userEmail
            }
        }));

        res.json({ success: true, posts: formattedPosts });
    } catch (error: any) {
        console.error('Get admin social posts error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/admin/boundary/social-posts/:id
// @desc    Delete a social post
// @access  Private/Admin
// @deprecated Use DELETE /admin/boundary/social/posts/:id instead
router.delete('/social-posts/:id', authenticateAdmin as any, requirePermission('social', 'delete'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.$executeRawUnsafe("UPDATE unified_entities SET status = 'deleted' WHERE id = $1 AND type = 'post'", id);
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete admin social post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
