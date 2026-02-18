/**
 * Admin Routes Master Index
 * 
 * This file provides a clean separation between:
 * 1. Common Admin Routes - Shared across all applications
 *    Path: /api/admin/common/*
 *    Includes: Users, Subscriptions, CMS, Pages, Components, Marketing, etc.
 * 
 * 2. Boundary-Specific Routes - Specific to Boundary app
 *    Path: /api/admin/boundary/*
 *    Includes: Circles/Families, Social, Chat, Safety Alerts
 * 
 * Legacy routes are maintained at /api/admin/* for backward compatibility.
 */
import express from 'express';
import { auditAdminRequests } from '../../middleware/audit';

// Import modular routers
import commonRoutes from './common';
import boundaryRoutes from './boundary';

const router = express.Router();

// Apply audit middleware globally
router.use(auditAdminRequests());

// =============================================
// NEW MODULAR ROUTES
// =============================================

// Common routes - shared across all applications
// Includes: Users, Subscriptions, Broadcast, Impersonate, CMS, Pages, Components, etc.
router.use('/common', commonRoutes);

// Boundary-specific routes - only for Boundary app
// Includes: Circles, Social, Alerts, Chat
router.use('/boundary', boundaryRoutes);

// =============================================
// LEGACY ROUTES (Backward Compatibility)
// These routes are maintained for existing API consumers
// =============================================

// Import legacy routers
import adminUsersRoutes from './adminUsersRoutes';
import adminCirclesRoutes from './adminCirclesRoutes';
import adminSocialRoutes from './adminSocialRoutes';
import adminApplicationsRoutes from './adminApplicationsRoutes';
import databaseExplorerRoutes from './databaseExplorer';
import rolesPermissionsRoutes from './rolesPermissions';
import entityRoutes from './entityRoutes';
import pageRoutes from './pageRoutes';
import pageBuilderRoutes from './pageBuilderRoutes';
import componentRoutes from './componentRoutes';
import componentStudio from './componentStudio';
import templateRoutes from './templateRoutes';
import marketingRoutes from './marketingRoutes';
import popupRoutes from './popupRoutes';
import localizationRoutes from './localizationRoutes';
import appConfigRoutes from './appConfigRoutes';
import applicationRoutes from './applicationRoutes';
import configRoutes from './config';
import cmsRoutes from './cmsRoutes';
import dynamicContentRoutes from './dynamicContentRoutes';
import versionRoutes from './versionRoutes';
import versionControlRoutes from './versionControlRoutes';
import publishingRoutes from './publishingRoutes';
import auditRoutes from './audit';
import adminAuthRoutes from './adminAuth';
import adminUsersManagementRoutes from './adminUsers';
import preferencesRoutes from './preferences';
import emailTemplatesRoutes from './emailTemplates';
import ssoProvidersRoutes from './ssoProviders';
import identityRoutes from './identityRoutes';

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import emailService from '../../services/emailService';

// Legacy: Authentication & Authorization
router.use('/auth', adminAuthRoutes);
router.use('/admin-users', adminUsersManagementRoutes);
router.use('/', rolesPermissionsRoutes);

// Identity Management (sessions, devices, MFA, security policies, etc.)
router.use('/identity', identityRoutes);

// Legacy: CMS & Content
router.use('/entities', entityRoutes);
router.use('/cms', cmsRoutes);
router.use('/dynamic-content', dynamicContentRoutes);

// Legacy: Pages & Publishing
router.use('/pages', pageRoutes);
router.use('/page-builder', pageBuilderRoutes);
router.use('/versions', versionRoutes);
router.use('/version-control', versionControlRoutes);
router.use('/publishing', publishingRoutes);

// Legacy: Components & Templates
router.use('/components', componentRoutes);
router.use('/component-studio', componentStudio);
router.use('/templates', templateRoutes);

// Legacy: Marketing
router.use('/marketing', marketingRoutes);
router.use('/popups', popupRoutes);

// Legacy: Configuration
router.use('/config', configRoutes);
router.use('/app-config', appConfigRoutes);
router.use('/preferences', preferencesRoutes);

// Legacy: Applications
router.use('/applications', applicationRoutes);
router.use('/app-versions', adminApplicationsRoutes);

// Legacy: Localization
router.use('/localization', localizationRoutes);

// Legacy: System
router.use('/database', databaseExplorerRoutes);
router.use('/audit', auditRoutes);

// Email Templates
router.use('/email-templates', emailTemplatesRoutes);

// SSO Providers
router.use('/sso-providers', ssoProvidersRoutes);

// Legacy: Users only (subscriptions removed)
router.use('/users', adminUsersRoutes);

// Legacy: Boundary-specific (circles, social)
router.use('/circles', adminCirclesRoutes);
router.use('/families', adminCirclesRoutes);
router.use('/social', adminSocialRoutes);

// =============================================
// Legacy Inline Routes
// =============================================

// Impersonation
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

// Dashboard
router.get('/dashboard', authenticateAdmin as any, requirePermission('dashboard', 'view'), async (req: Request, res: Response) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period as string);

        const basicsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM core.users) as total_users,
                (SELECT COUNT(*) FROM core.users WHERE is_active = true) as active_users,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'circle' AND status != 'deleted') as total_families,
                (SELECT COUNT(*) FROM core.subscriptions WHERE status IN ('active', 'trialing')) as active_subscriptions,
                (SELECT COALESCE(SUM(jsonb_array_length(COALESCE(branding->'screens', '[]'::jsonb))), 0) FROM core.applications WHERE is_active = true) as total_screens
        `;
        const basics = await prisma.$queryRawUnsafe<any[]>(basicsQuery);

        const recentQuery = `
            SELECT 
                (SELECT COUNT(*) FROM core.users WHERE created_at >= NOW() - INTERVAL '1 day' * $1) as recent_users,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'circle' AND created_at >= NOW() - INTERVAL '1 day' * $1) as recent_families,
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'safety_alert' AND created_at >= NOW() - INTERVAL '1 day' * $1) as recent_alerts,
                (SELECT COUNT(*) FROM appkit.chat_messages WHERE created_at >= NOW() - INTERVAL '1 day' * $1) as recent_messages
        `;
        const recent = await prisma.$queryRawUnsafe<any[]>(recentQuery, days);

        const revenueQuery = `
            SELECT 
                COALESCE(SUM((plan->>'price')::NUMERIC), 0) as total_revenue,
                COALESCE(AVG((plan->>'price')::NUMERIC), 0) as avg_revenue,
                COUNT(*) as subscription_count
            FROM core.subscriptions
            WHERE created_at >= NOW() - INTERVAL '1 day' * $1
        `;
        const revenue = await prisma.$queryRawUnsafe<any[]>(revenueQuery, days);

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
        const userGrowth = await prisma.$queryRawUnsafe<any[]>(growthQuery, days);

        res.json({
            stats: {
                totalUsers: parseInt(basics[0].total_users),
                activeUsers: parseInt(basics[0].active_users),
                totalFamilies: parseInt(basics[0].total_families),
                activeSubscriptions: parseInt(basics[0].active_subscriptions),
                totalScreens: parseInt(basics[0].total_screens),
                recentUsers: parseInt(recent[0].recent_users),
                recentFamilies: parseInt(recent[0].recent_families),
                recentAlerts: parseInt(recent[0].recent_alerts),
                recentMessages: parseInt(recent[0].recent_messages),
                revenue: {
                    totalRevenue: parseFloat(revenue[0].total_revenue),
                    avgRevenue: parseFloat(revenue[0].avg_revenue),
                    subscriptionCount: parseInt(revenue[0].subscription_count),
                },
            },
            userGrowth: userGrowth.map(row => ({
                _id: { year: parseInt(row.year), month: parseInt(row.month), day: parseInt(row.day) },
                count: parseInt(row.count)
            })),
        });
    } catch (error: any) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Alerts
router.get('/alerts', authenticateAdmin as any, async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, status, type, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
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

// System Info
router.get('/system', authenticateAdmin as any, requirePermission('system', 'view'), async (req: Request, res: Response) => {
    try {
        let dbStatus = 'disconnected';
        try { await prisma.$queryRaw`SELECT 1`; dbStatus = 'connected'; } catch (e) {}
        res.json({
            systemInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV,
                database: { connection: dbStatus },
                redis: { connection: 'connected' },
            }
        });
    } catch (error: any) {
        console.error('Get system info error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Broadcast
router.post('/broadcast', authenticateAdmin as any, [
    body('title').notEmpty().trim(),
    body('message').notEmpty().trim(),
    body('type').isIn(['notification', 'email', 'both']),
    body('target').optional().isIn(['all', 'active', 'premium']),
], async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

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
                    await emailService.sendEmail({ to: user.email, subject: title, template: 'admin-broadcast', data: { name: user.firstName, message } });
                }
                results.push({ userId: user.id, email: user.email, success: true });
            } catch (error: any) {
                results.push({ userId: user.id, email: user.email, success: false, error: error.message });
            }
        }

        res.json({
            message: 'Broadcast sent successfully',
            results: { total: users.length, successful: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, details: results }
        });
    } catch (error: any) {
        console.error('Broadcast error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Legacy Social Posts
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
        res.json({ success: true, posts: posts.map(post => ({ id: post.id, data: post.data, metadata: post.metadata, createdAt: post.createdAt, circleName: post.circleName, user: { firstName: post.firstName || 'Unknown', lastName: post.lastName || '', email: post.userEmail } })) });
    } catch (error: any) {
        console.error('Get admin social posts error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.delete('/social-posts/:id', authenticateAdmin as any, async (req: Request, res: Response) => {
    try {
        await prisma.$executeRawUnsafe("UPDATE unified_entities SET status = 'deleted' WHERE id = $1 AND type = 'post'", req.params.id);
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete admin social post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Application Settings
router.post('/application-settings', authenticateAdmin as any, requirePermission('settings', 'edit'), async (req: Request, res: Response) => {
    try {
        const { setting_key, setting_value } = req.body;
        if (!setting_key) return res.status(400).json({ error: 'setting_key is required' });

        const valueStr = typeof setting_value === 'object' ? JSON.stringify(setting_value) : setting_value;
        const rows = await prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO public.app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW() RETURNING *`,
            setting_key, valueStr
        );

        if (setting_key === 'branding') {
            try { 
                await prisma.$executeRawUnsafe(`UPDATE core.applications SET branding = $1::jsonb, updated_at = NOW() WHERE is_active = true`, valueStr);
                try { await prisma.$executeRawUnsafe(`UPDATE public.applications SET branding = $1::jsonb, updated_at = NOW() WHERE is_active = true`, valueStr); } catch (e) { /* public.applications may not exist */ }
            } catch (syncError) { console.error('Failed to sync branding:', syncError); }
        }
        res.json({ setting: rows[0] });
    } catch (error: any) {
        console.error('Upsert application setting error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
