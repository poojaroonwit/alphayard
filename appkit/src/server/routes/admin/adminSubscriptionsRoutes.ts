import express, { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = express.Router();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// @route   GET /api/admin/subscriptions
// @desc    Get all subscriptions with pagination
// @access  Private/Admin
router.get('/', requirePermission('subscriptions', 'view'), async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = 'WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (status) {
            whereClause += ` AND s.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (search) {
            whereClause += ` AND (u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        const countQuery = `
            SELECT COUNT(*) FROM core.subscriptions s
            LEFT JOIN core.users u ON s.user_id = u.id
            ${whereClause}
        `;
        const countRows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(countQuery, ...params);
        const total = parseInt(String(countRows[0].count));

        const query = `
            SELECT 
                s.id,
                s.user_id,
                s.status,
                s.plan,
                s.current_period_start,
                s.current_period_end,
                s.cancel_at_period_end,
                s.created_at,
                s.updated_at,
                u.email,
                u.first_name,
                u.last_name
            FROM core.subscriptions s
            LEFT JOIN core.users u ON s.user_id = u.id
            ${whereClause}
            ORDER BY s.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(limitNum, offset);

        const rows = await prisma.$queryRawUnsafe<any[]>(query, ...params);

        res.json({
            subscriptions: rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error: any) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/subscriptions/:id
// @desc    Get subscription details
// @access  Private/Admin
router.get('/:id', requirePermission('subscriptions', 'view'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const rows = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                s.*,
                u.email,
                u.first_name,
                u.last_name,
                u.phone_number as phone
            FROM core.subscriptions s
            LEFT JOIN core.users u ON s.user_id = u.id
            WHERE s.id = $1
        `, id);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        // Get payment history
        const payments = await prisma.$queryRawUnsafe<any[]>(`
            SELECT * FROM payments 
            WHERE subscription_id = $1 
            ORDER BY created_at DESC
            LIMIT 10
        `, id);

        res.json({
            subscription: rows[0],
            payments
        });
    } catch (error: any) {
        console.error('Get subscription details error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/admin/subscriptions/:id
// @desc    Update subscription
// @access  Private/Admin
router.put('/:id', authenticateAdmin as any, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, plan, current_period_end, cancel_at_period_end } = req.body;

        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (status !== undefined) {
            updates.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (plan !== undefined) {
            updates.push(`plan = $${paramIndex}`);
            params.push(JSON.stringify(plan));
            paramIndex++;
        }

        if (current_period_end !== undefined) {
            updates.push(`current_period_end = $${paramIndex}`);
            params.push(current_period_end);
            paramIndex++;
        }

        if (cancel_at_period_end !== undefined) {
            updates.push(`cancel_at_period_end = $${paramIndex}`);
            params.push(cancel_at_period_end);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        updates.push('updated_at = NOW()');
        params.push(id);

        const query = `
            UPDATE core.subscriptions 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const rows = await prisma.$queryRawUnsafe<any[]>(query, ...params);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        res.json(rows[0]);
    } catch (error: any) {
        console.error('Update subscription error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/admin/subscriptions/:id/cancel
// @desc    Cancel subscription
// @access  Private/Admin
router.post('/:id/cancel', requirePermission('subscriptions', 'edit'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { immediate = false } = req.body;

        if (immediate) {
            await prisma.$executeRawUnsafe(`
                UPDATE core.subscriptions 
                SET status = 'canceled', updated_at = NOW()
                WHERE id = $1
            `, id);
        } else {
            await prisma.$executeRawUnsafe(`
                UPDATE core.subscriptions 
                SET cancel_at_period_end = true, updated_at = NOW()
                WHERE id = $1
            `, id);
        }

        res.json({ message: 'Subscription canceled' });
    } catch (error: any) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/admin/subscriptions/:id/reactivate
// @desc    Reactivate canceled subscription
// @access  Private/Admin
router.post('/:id/reactivate', authenticateAdmin as any, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.$executeRawUnsafe(`
            UPDATE core.subscriptions 
            SET status = 'active', cancel_at_period_end = false, updated_at = NOW()
            WHERE id = $1
        `, id);

        res.json({ message: 'Subscription reactivated' });
    } catch (error: any) {
        console.error('Reactivate subscription error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/subscriptions/stats
// @desc    Get subscription statistics
// @access  Private/Admin
router.get('/stats/overview', requirePermission('subscriptions', 'view'), async (req: Request, res: Response) => {
    try {
        const rows = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'active') as active_count,
                COUNT(*) FILTER (WHERE status = 'trialing') as trialing_count,
                COUNT(*) FILTER (WHERE status = 'canceled') as canceled_count,
                COUNT(*) FILTER (WHERE status = 'past_due') as past_due_count,
                COUNT(*) as total_count,
                COALESCE(SUM((plan->>'price')::NUMERIC) FILTER (WHERE status = 'active'), 0) as monthly_revenue
            FROM core.subscriptions
        `);

        res.json(rows[0]);
    } catch (error: any) {
        console.error('Get subscription stats error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
