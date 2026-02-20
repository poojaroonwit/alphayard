import express from 'express';
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
router.get('/dashboard', authenticateAdmin, requirePermission('dashboard', 'view'), async (req, res) => {
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
                (SELECT COUNT(*) FROM unified_entities WHERE type = 'post' AND status = 'active') as active_posts,
                (SELECT COUNT(*) FROM entity_relations WHERE relation_type = 'like') as total_likes,
                (SELECT COUNT(*) FROM entity_relations WHERE relation_type = 'comment') as total_comments
        `;
        
        const basics = await prisma.$queryRawUnsafe(basicsQuery);
        
        // Get recent activity
        const activityQuery = `
            SELECT 
                date_trunc('day', created_at) as date,
                COUNT(*) as new_users
            FROM core.users 
            WHERE created_at >= NOW() - INTERVAL '${days} days'
            GROUP BY date_trunc('day', created_at)
            ORDER BY date DESC
        `;
        
        const userActivity = await prisma.$queryRawUnsafe(activityQuery);
        
        // Get family growth
        const familyGrowthQuery = `
            SELECT 
                date_trunc('day', created_at) as date,
                COUNT(*) as new_families
            FROM unified_entities 
            WHERE type = 'circle' AND created_at >= NOW() - INTERVAL '${days} days'
            GROUP BY date_trunc('day', created_at)
            ORDER BY date DESC
        `;
        
        const familyActivity = await prisma.$queryRawUnsafe(familyGrowthQuery);
        
        // Get social activity
        const socialActivityQuery = `
            SELECT 
                date_trunc('day', created_at) as date,
                COUNT(*) as new_posts
            FROM unified_entities 
            WHERE type = 'post' AND created_at >= NOW() - INTERVAL '${days} days'
            GROUP BY date_trunc('day', created_at)
            ORDER BY date DESC
        `;
        
        const socialActivity = await prisma.$queryRawUnsafe(socialActivityQuery);
        
        res.json({
            basics: (basics as any[])[0],
            charts: {
                userActivity,
                familyActivity,
                socialActivity
            },
            period: days
        });
    } catch (error) {
        console.error('Error fetching boundary dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

export default router;
