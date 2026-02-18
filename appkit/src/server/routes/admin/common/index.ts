/**
 * Common Admin Routes
 * These routes are shared across all applications and can be reused
 * Includes: CMS, Pages, Components, Templates, Marketing, Localization, 
 * Users, Subscriptions, Broadcast, Impersonation, etc.
 */
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../../../lib/prisma';
import { authenticateAdmin } from '../../../middleware/adminAuth';
import { requirePermission } from '../../../middleware/permissionCheck';
import { auditAdminRequests } from '../../../middleware/audit';
import emailService from '../../../services/emailService';

// Import common admin routers (from parent directory)
import entityRoutes from '../entityRoutes';
import pageRoutes from '../pageRoutes';
import pageBuilderRoutes from '../pageBuilderRoutes';
import componentRoutes from '../componentRoutes';
import componentStudio from '../componentStudio';
import templateRoutes from '../templateRoutes';
import marketingRoutes from '../marketingRoutes';
import popupRoutes from '../popupRoutes';
import localizationRoutes from '../localizationRoutes';
import appConfigRoutes from '../appConfigRoutes';
import applicationRoutes from '../applicationRoutes';
import adminApplicationsRoutes from '../adminApplicationsRoutes';
import configRoutes from '../config';
import cmsRoutes from '../cmsRoutes';
import dynamicContentRoutes from '../dynamicContentRoutes';
import versionRoutes from '../versionRoutes';
import versionControlRoutes from '../versionControlRoutes';
import publishingRoutes from '../publishingRoutes';
import databaseExplorerRoutes from '../databaseExplorer';
import auditRoutes from '../audit';
import adminAuthRoutes from '../adminAuth';
import adminUsersManagementRoutes from '../adminUsers';
import rolesPermissionsRoutes from '../rolesPermissions';
import preferencesRoutes from '../preferences';

// Common routes for all apps (Users only - subscriptions removed)
import adminUsersRoutes from '../adminUsersRoutes';

const router = express.Router();

// Apply audit middleware
router.use(auditAdminRequests());

// =============================================
// Authentication & Authorization
// =============================================
router.use('/auth', adminAuthRoutes);
router.use('/admin-users', adminUsersManagementRoutes);
router.use('/', rolesPermissionsRoutes); // Roles and permissions (/roles, /permissions)

// =============================================
// Users Management (Mobile/App Users)
// =============================================
router.use('/users', adminUsersRoutes);

// =============================================
// Impersonation Routes
// =============================================

// POST /api/admin/common/impersonate
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

// POST /api/admin/common/stop-impersonate
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

// =============================================
// Broadcast Routes
// =============================================

// @route   POST /api/admin/common/broadcast
// @desc    Send broadcast message to app users
// @access  Private/Admin
router.post('/broadcast', authenticateAdmin as any, requirePermission('notifications', 'send'), [
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

        let users: Array<{ id: string; email: string; firstName: string }>;
        if (target === 'premium') {
            // Premium targeting not available - subscription tables removed
            // Fall back to all active users
            users = await prisma.user.findMany({
                where: {
                    isActive: true
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true
                }
            });
        } else {
            users = await prisma.user.findMany({
                where: {
                    isActive: true
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true
                }
            });
        }

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

// =============================================
// Dashboard Route (Common stats)
// =============================================

// @route   GET /api/admin/common/dashboard
// @desc    Get common admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', authenticateAdmin as any, requirePermission('dashboard', 'view'), async (req: Request, res: Response) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period as string);

        // Get basic stats
        const [totalUsers, activeUsers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } })
        ]);
        const activeSubscriptions = 0;

        // Get total screens from applications branding
        const applications = await prisma.application.findMany({
            where: { isActive: true },
            select: { branding: true }
        });
        const totalScreens = applications.reduce((sum, app) => {
            const branding = app.branding as any;
            const screens = branding?.screens || [];
            return sum + (Array.isArray(screens) ? screens.length : 0);
        }, 0);

        // Get recent activity counts
        const recentUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Revenue stats not available - subscription tables removed
        const revenue = {
            total_revenue: 0,
            avg_revenue: 0,
            subscription_count: 0,
        };

        // Get user growth by day
        const userGrowth = await prisma.$queryRaw<Array<{
            year: number;
            month: number;
            day: number;
            count: bigint;
        }>>`
            SELECT 
                EXTRACT(YEAR FROM created_at)::INTEGER as year,
                EXTRACT(MONTH FROM created_at)::INTEGER as month,
                EXTRACT(DAY FROM created_at)::INTEGER as day,
                COUNT(*)::BIGINT as count
            FROM core.users
            WHERE created_at >= NOW() - INTERVAL '1 day' * ${days}
            GROUP BY year, month, day
            ORDER BY year, month, day
        `;

        res.json({
            stats: {
                totalUsers,
                activeUsers,
                activeSubscriptions,
                totalScreens,
                recentUsers,
                revenue: {
                    totalRevenue: parseFloat(String(revenue.total_revenue || 0)),
                    avgRevenue: parseFloat(String(revenue.avg_revenue || 0)),
                    subscriptionCount: Number(revenue.subscription_count || 0),
                },
            },
            userGrowth: userGrowth.map(row => ({
                _id: { year: row.year, month: row.month, day: row.day },
                count: Number(row.count)
            })),
        });
    } catch (error: any) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// =============================================
// System Info Routes
// =============================================

// @route   GET /api/admin/common/system
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

// =============================================
// Content Management System (CMS)
// =============================================
router.use('/entities', entityRoutes);
router.use('/cms', cmsRoutes);
router.use('/dynamic-content', dynamicContentRoutes);

// =============================================
// Page Management
// =============================================
router.use('/pages', pageRoutes);
router.use('/page-builder', pageBuilderRoutes);
router.use('/versions', versionRoutes);
router.use('/version-control', versionControlRoutes);
router.use('/publishing', publishingRoutes);

// =============================================
// Components & Templates
// =============================================
router.use('/components', componentRoutes);
router.use('/component-studio', componentStudio);
router.use('/templates', templateRoutes);

// =============================================
// Marketing & Popups
// =============================================
router.use('/marketing', marketingRoutes);
router.use('/popups', popupRoutes);

// =============================================
// Configuration & Settings
// =============================================
router.use('/config', configRoutes);
router.use('/app-config', appConfigRoutes);
router.use('/preferences', preferencesRoutes);

// =============================================
// Applications Management
// =============================================
router.use('/applications', applicationRoutes);
router.use('/app-versions', adminApplicationsRoutes);

// =============================================
// Localization
// =============================================
router.use('/localization', localizationRoutes);

// =============================================
// System & Database
// =============================================
router.use('/database', databaseExplorerRoutes);
router.use('/audit', auditRoutes);

export default router;
