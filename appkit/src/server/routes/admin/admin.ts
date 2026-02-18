import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requireRole } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissionCheck';
import { auditAdminRequests } from '../../middleware/audit';
import emailService from '../../services/emailService';

// Sub-routers
import adminUsersRoutes from './adminUsersRoutes';
import adminCirclesRoutes from './adminCirclesRoutes';
import adminSocialRoutes from './adminSocialRoutes';
import adminApplicationsRoutes from './adminApplicationsRoutes';
import databaseExplorerRoutes from './databaseExplorer';
import rolesPermissionsRoutes from './rolesPermissions';
import identityRoutes from './identityRoutes';
import oauthClientsRoutes from './oauthClientsRoutes';
import ticketsRoutes from './tickets';

const router = express.Router();

// Apply audit middleware to admin router
router.use(auditAdminRequests());

// Mount sub-routers
router.use('/users', adminUsersRoutes);
router.use('/circles', adminCirclesRoutes);
router.use('/families', adminCirclesRoutes); // Alias for backward compatibility
router.use('/social', adminSocialRoutes);
router.use('/applications', adminApplicationsRoutes);
router.use('/database', databaseExplorerRoutes);
router.use('/identity', identityRoutes); // Identity management (sessions, devices, MFA, security policies, etc.)
router.use('/oauth-clients', oauthClientsRoutes); // OAuth 2.0 / SSO client management
router.use('/tickets', ticketsRoutes); // Support ticket management
router.use('/', rolesPermissionsRoutes); // Roles and permissions routes (includes /roles, /permissions, /users/:id/role)

// Admin middleware - require admin role
const requireAdmin = requireRole('admin');

// ============================
// Impersonation Routes
// ============================

// POST /api/admin/impersonate
router.post('/impersonate', authenticateAdmin as any, requirePermission('admin-users', 'manage'), async (req: any, res: Response) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        if (req.session) {
            req.session.impersonateUserId = userId;
        }
        res.json({ message: 'Impersonation started', userId });
    } catch (e) {
        console.error('Impersonate error', e);
        res.status(500).json({ error: 'Failed to impersonate' });
    }
});

// POST /api/admin/stop-impersonate
router.post('/stop-impersonate', authenticateAdmin as any, requirePermission('admin-users', 'manage'), async (req: any, res: Response) => {
    try {
        if (req.session) {
            delete req.session.impersonateUserId;
        }
        res.json({ message: 'Impersonation stopped' });
    } catch (e) {
        console.error('Stop impersonate error', e);
        res.status(500).json({ error: 'Failed to stop impersonation' });
    }
});

// ============================
// Dashboard Route
// ============================

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', authenticateAdmin as any, requirePermission('dashboard', 'view'), async (req: Request, res: Response) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period as string);

        // Get basic stats
        const basicsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM core.users) as total_users,
                (SELECT COUNT(*) FROM core.users WHERE is_active = true) as active_users,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'circle' AND status != 'deleted') as total_families,
                0 as active_subscriptions,
                (SELECT COALESCE(SUM(jsonb_array_length(COALESCE(branding->'screens', '[]'::jsonb))), 0) FROM core.applications WHERE is_active = true) as total_screens
        `;
        const basics = await prisma.$queryRawUnsafe<any[]>(basicsQuery);
        const { total_users, active_users, total_families, active_subscriptions, total_screens } = basics[0];

        // Get recent activity counts
        const recentQuery = `
            SELECT 
                (SELECT COUNT(*) FROM core.users WHERE created_at >= NOW() - INTERVAL '1 day' * $1) as recent_users,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'circle' AND created_at >= NOW() - INTERVAL '1 day' * $1) as recent_families,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'safety_alert' AND created_at >= NOW() - INTERVAL '1 day' * $1) as recent_alerts,
                (SELECT COUNT(*) FROM appkit.chat_messages WHERE created_at >= NOW() - INTERVAL '1 day' * $1) as recent_messages
        `;
        const recent = await prisma.$queryRawUnsafe<Array<{
            recent_users: bigint;
            recent_families: bigint;
            recent_alerts: bigint;
            recent_messages: bigint;
        }>>(recentQuery, days);
        const { recent_users, recent_families, recent_alerts, recent_messages } = recent[0];

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
        const userGrowth = await prisma.$queryRawUnsafe<Array<{
            year: number;
            month: number;
            day: number;
            count: bigint;
        }>>(growthQuery, days);

        res.json({
            stats: {
                totalUsers: Number(total_users),
                activeUsers: Number(active_users),
                totalFamilies: Number(total_families),
                activeSubscriptions: Number(active_subscriptions),
                totalScreens: Number(total_screens),
                recentUsers: Number(recent_users),
                recentFamilies: Number(recent_families),
                recentAlerts: Number(recent_alerts),
                recentMessages: Number(recent_messages),
                revenue: {
                    totalRevenue: parseFloat(String(revenue.total_revenue || 0)),
                    avgRevenue: parseFloat(String(revenue.avg_revenue || 0)),
                    subscriptionCount: Number(revenue.subscription_count || 0),
                },
            },
            userGrowth: userGrowth.map(row => ({
                _id: { year: Number(row.year), month: Number(row.month), day: Number(row.day) },
                count: Number(row.count)
            })),
        });
    } catch (error: any) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ============================
// Alerts Routes
// ============================

// @route   GET /api/admin/alerts
// @desc    Get emergency alerts
// @access  Private/Admin
router.get('/alerts', authenticateAdmin as any, async (req: Request, res: Response) => {
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
            prisma.$queryRawUnsafe<any[]>(alertsQuery, ...params, parseInt(limit as string), offset),
            prisma.$queryRawUnsafe<Array<{ count: bigint }>>(countQuery, ...params)
        ]);

        const total = parseInt(String(countRes[0].count));

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

// ============================
// System Info Routes
// ============================

// @route   GET /api/admin/system
// @desc    Get system information
// @access  Private/Admin
router.get('/system', authenticateAdmin as any, requirePermission('system', 'view'), async (req: Request, res: Response) => {
    try {
        // Check DB connection
        let dbStatus = 'disconnected';
        try {
            await prisma.$queryRaw`SELECT 1`;
            dbStatus = 'connected';
        } catch (e) {}

        const systemInfo = {
            nodeVersion: process.version,
            platform: process.platform,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            database: {
                connection: dbStatus,
            },
            redis: {
                connection: 'connected',
            },
        };

        res.json({ systemInfo });
    } catch (error: any) {
        console.error('Get system info error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ============================
// Broadcast Routes
// ============================

// @route   POST /api/admin/broadcast
// @desc    Send broadcast message
// @access  Private/Admin
router.post('/broadcast', authenticateAdmin as any, [
    body('title').notEmpty().trim(),
    body('message').notEmpty().trim(),
    body('type').isIn(['notification', 'email', 'both']),
    body('target').optional().isIn(['all', 'active', 'premium']),
], async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, message, type, target = 'all' } = req.body;

        let userQuery = 'SELECT id, email, first_name as "firstName" FROM core.users WHERE is_active = true';
        if (target === 'premium') {
            // Premium targeting not available - subscription tables removed
            // Fall back to all active users
            userQuery = 'SELECT id, email, first_name as "firstName" FROM core.users WHERE is_active = true';
        }

        const users = await prisma.$queryRawUnsafe<any[]>(userQuery);
        const results: any[] = [];

        for (const user of users) {
            try {
                if (type === 'email' || type === 'both') {
                    await emailService.sendEmail({
                        to: user.email,
                        subject: title,
                        template: 'admin-broadcast',
                        data: {
                            name: user.firstName,
                            message,
                        },
                    });
                }

                results.push({
                    userId: user.id,
                    email: user.email,
                    success: true,
                });
            } catch (error: any) {
                results.push({
                    userId: user.id,
                    email: user.email,
                    success: false,
                    error: error.message,
                });
            }
        }

        res.json({
            message: 'Broadcast sent successfully',
            results: {
                total: users.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                details: results,
            },
        });
    } catch (error: any) {
        console.error('Broadcast error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ============================
// Social Posts Routes (Legacy - kept for backward compatibility)
// ============================

// @route   GET /api/admin/social-posts
// @desc    Get all social posts for admin
// @access  Private/Admin
// @deprecated Use /admin/social/posts instead
router.get('/social-posts', authenticateAdmin as any, requirePermission('social', 'view'), async (req: Request, res: Response) => {
    try {
        const posts = await prisma.$queryRawUnsafe<any[]>(`
            SELECT sp.id, sp.data, sp.metadata, sp.created_at as "createdAt",
                   u.first_name as "firstName", u.last_name as "lastName", u.email as "userEmail",
                   f.data->>'name' as "circleName"
            FROM unified_entities sp
            LEFT JOIN core.users u ON sp.owner_id = u.id
            LEFT JOIN unified_entities f ON (sp.data->>'circle_id')::uuid = f.id
            WHERE sp.type = 'post' AND sp.status != 'deleted'
            ORDER BY sp.created_at DESC
        `);

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

// @route   DELETE /api/admin/social-posts/:id
// @desc    Delete a social post
// @access  Private/Admin
// @deprecated Use DELETE /admin/social/posts/:id instead
router.delete('/social-posts/:id', authenticateAdmin as any, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.$executeRawUnsafe("UPDATE unified_entities SET status = 'deleted' WHERE id = $1 AND type = 'post'", id);
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete admin social post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================
// Application Settings Routes
// ============================

// @route   POST /api/admin/application-settings
// @desc    Upsert application setting
// @access  Private/Admin
router.post('/application-settings', authenticateAdmin as any, requirePermission('settings', 'edit'), async (req: Request, res: Response) => {
    try {
        const { setting_key, setting_value, setting_type, category, description, is_public } = req.body;

        if (!setting_key) {
            return res.status(400).json({ error: 'setting_key is required' });
        }

        const valueStr = typeof setting_value === 'object' ? JSON.stringify(setting_value) : setting_value;

        // Write to public.app_settings (simple key-value, no application_id required)
        const result = await prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO public.app_settings (key, value)
             VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET
               value = EXCLUDED.value,
               updated_at = NOW()
             RETURNING *`,
            setting_key, valueStr
        );

        // Sync 'branding' key to BOTH core.applications and public.applications
        if (setting_key === 'branding') {
            try {
                const brandingObj = typeof setting_value === 'object' ? setting_value : JSON.parse(valueStr);
                const brandingJson = JSON.stringify(brandingObj);
                
                // Update core.applications (Prisma reads from here)
                await prisma.$executeRawUnsafe(
                    `UPDATE core.applications SET branding = $1::jsonb, updated_at = NOW() WHERE is_active = true`,
                    brandingJson
                );
                
                // Also update public.applications for backward compatibility
                try {
                    await prisma.$executeRawUnsafe(
                        `UPDATE public.applications SET branding = $1::jsonb, updated_at = NOW() WHERE is_active = true`,
                        brandingJson
                    );
                } catch (e) {
                    // public.applications might not exist, that's ok
                }
                
                console.log('[ApplicationSettings] Synced branding to core.applications');
            } catch (syncError: any) {
                console.error('[ApplicationSettings] Failed to sync branding:', syncError.message);
            }
        }

        res.json({ setting: result[0] });
    } catch (error: any) {
        console.error('Upsert application setting error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
