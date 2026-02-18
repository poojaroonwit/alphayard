import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import { UserModel } from '../../models/UserModel';
import emailService from '../../services/emailService';

const router = express.Router();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// Validation middleware
const validateUserUpdate = [
    body('firstName').optional().notEmpty().trim(),
    body('lastName').optional().notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['user', 'admin', 'moderator', 'super_admin']),
    body('status').optional().isIn(['active', 'inactive', 'suspended']),
    body('is_active').optional().isBoolean(),
    body('metadata').optional().isObject(),
    body('phone').optional().trim(),
];

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private/Admin
router.get('/', requirePermission('users', 'view'), async (req: Request, res: Response) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            role,
            status,
            circle,
            subscription,
            sortBy = 'created_at',
            sortOrder = 'desc',
        } = req.query;

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        const params: any[] = [];
        let paramIdx = 1;
        let whereClause = 'WHERE 1=1';

        if (search) {
            whereClause += ` AND (u.email ILIKE $${paramIdx} OR u.first_name ILIKE $${paramIdx} OR u.last_name ILIKE $${paramIdx})`;
            params.push(`%${search}%`);
            paramIdx++;
        }

        if (role) {
            whereClause += ` AND u.preferences->>'role' = $${paramIdx}`;
            params.push(role);
            paramIdx++;
        }

        if (status) {
            // Check if status is a known status string or boolean
            if (['active', 'inactive', 'pending', 'suspended', 'banned'].includes(status as string)) {
                 whereClause += ` AND u.is_active = $${paramIdx}`;
                 params.push(status === 'active');
            } else {
                 whereClause += ` AND u.is_active = $${paramIdx}`;
                 params.push(status === 'active' || status === 'true');
            }
            paramIdx++;
        }

        if (req.query.app) {
            whereClause += ` AND EXISTS (
                SELECT 1 FROM unified_entities ue 
                JOIN core.applications a ON a.id = ue.application_id 
                WHERE ue.owner_id = u.id AND a.name = $${paramIdx}
            )`;
            params.push(req.query.app);
            paramIdx++;
        }

        // Attribute filter (key:value)
        if (req.query.attribute) {
            const attr = req.query.attribute as string;
            const separatorIndex = attr.indexOf(':');
            
            if (separatorIndex > 0) {
                const key = attr.substring(0, separatorIndex);
                const value = attr.substring(separatorIndex + 1);
                
                whereClause += ` AND u.preferences->>$${paramIdx} ILIKE $${paramIdx + 1}`;
                params.push(key, `%${value}%`);
                paramIdx += 2;
            } else {
                 // Search values in common metadata fields
                 whereClause += ` AND (u.preferences::text ILIKE $${paramIdx})`;
                 params.push(`%${attr}%`);
                 paramIdx++;
            }
        }

        if (circle === 'true') {
            whereClause += ` AND EXISTS (SELECT 1 FROM entity_relations er WHERE er.source_id = u.id AND er.relation_type = 'member_of')`;
        } else if (circle === 'false') {
            whereClause += ` AND NOT EXISTS (SELECT 1 FROM entity_relations er WHERE er.source_id = u.id AND er.relation_type = 'member_of')`;
        }

        if (subscription === 'true') {
            whereClause += ` AND EXISTS (SELECT 1 FROM core.subscriptions s WHERE s.user_id = u.id AND s.status IN ('active', 'trialing'))`;
        } else if (subscription === 'false') {
            whereClause += ` AND NOT EXISTS (SELECT 1 FROM core.subscriptions s WHERE s.user_id = u.id AND s.status IN ('active', 'trialing'))`;
        }

        const sortField = ['created_at', 'email', 'first_name', 'last_name'].includes(sortBy as string) ? sortBy : 'created_at';
        const direction = (sortOrder as string).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const usersQuery = `
            SELECT u.id, u.email, u.first_name as "firstName", u.last_name as "lastName", 
                   u.avatar_url as "avatarUrl", u.phone_number as "phone", u.is_active as "isActive", 
                   (CASE WHEN u.is_active THEN 'active' ELSE 'inactive' END) as "status", 
                   u.created_at as "createdAt",
                   u.preferences as metadata,
                   (SELECT json_agg(json_build_object('id', c.id, 'name', c.data->>'name')) 
                    FROM unified_entities c 
                    JOIN entity_relations er ON c.id = er.target_id 
                    WHERE er.source_id = u.id AND er.relation_type = 'member_of') as circles,
                   (SELECT json_agg(json_build_object('appId', a.id, 'appName', a.name))
                    FROM unified_entities ue
                    JOIN core.applications a ON a.id = ue.application_id
                    WHERE ue.owner_id = u.id AND ue.application_id IS NOT NULL) as apps
            FROM core.users u
            ${whereClause}
            ORDER BY u.${sortField} ${direction}
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;

        const countQuery = `SELECT COUNT(*) FROM core.users u ${whereClause}`;

        const [usersRes, countRes] = await Promise.all([
            prisma.$queryRawUnsafe<any[]>(usersQuery, ...params, parseInt(limit as string), offset),
            prisma.$queryRawUnsafe<Array<{ count: bigint }>>(countQuery, ...params)
        ]);

        const total = parseInt(String(countRes[0].count));

        res.json({
            users: usersRes,
            totalPages: Math.ceil(total / parseInt(limit as string)),
            currentPage: parseInt(page as string),
            total,
        });
    } catch (error: any) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/users/:id
// @desc    Get user details
// @access  Private/Admin
router.get('/:id', requirePermission('users', 'view'), async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;

        // Get user with circles
        const userQuery = `
            SELECT u.id, u.email, u.first_name as "firstName", u.last_name as "lastName", 
                   u.avatar_url as "avatarUrl", u.phone_number as "phone", u.is_active as "isActive", 
                   (CASE WHEN u.is_active THEN 'active' ELSE 'inactive' END) as "status",
                   u.created_at as "createdAt", u.updated_at as "updatedAt",
                   u.preferences as metadata,
                   (SELECT json_agg(json_build_object(
                     'id', c.id, 
                     'name', c.data->>'name',
                     'members', (SELECT count(*) FROM entity_relations WHERE target_id = c.id AND relation_type = 'member_of')
                   ))
                    FROM unified_entities c 
                    JOIN entity_relations er ON c.id = er.target_id 
                    WHERE er.source_id = u.id AND er.relation_type = 'member_of') as circles
            FROM core.users u
            WHERE u.id = $1
        `;
        const userRows = await prisma.$queryRawUnsafe<any[]>(userQuery, userId);

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0];

        // Ensure metadata is an object
        if (!user.metadata || typeof user.metadata !== 'object') {
            user.metadata = {};
        }

        // Connected apps
        const appRows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT a.id AS "appId", a.name AS "appName", MIN(ue.created_at) AS "joinedAt"
             FROM unified_entities ue
             JOIN core.applications a ON a.id = ue.application_id
             WHERE ue.owner_id = $1 AND ue.application_id IS NOT NULL AND a.is_active = true
             GROUP BY a.id, a.name
             ORDER BY "joinedAt" ASC`,
            userId
        );
        user.metadata.apps = (appRows || []).map((row: any) => ({
            appId: row.appId,
            appName: row.appName,
            joinedAt: row.joinedAt,
            role: 'member',
        }));

        // Get user's subscription
        const subRows = await prisma.$queryRawUnsafe<any[]>(
            'SELECT * FROM core.subscriptions WHERE user_id = $1 LIMIT 1',
            userId
        );

        // Get user's recent activity
        const recentAlerts = await prisma.$queryRawUnsafe<any[]>(
            "SELECT * FROM unified_entities WHERE owner_id = $1 AND type = 'safety_alert' AND data->>'type' = 'emergency' ORDER BY created_at DESC LIMIT 5",
            userId
        );

        const recentSafetyChecks = await prisma.$queryRawUnsafe<any[]>(
            "SELECT * FROM unified_entities WHERE owner_id = $1 AND type = 'safety_alert' AND data->>'type' = 'check_in' ORDER BY created_at DESC LIMIT 5",
            userId
        );

        res.json({
            user,
            subscription: subRows[0] || null,
            recentActivity: {
                alerts: recentAlerts,
                safetyChecks: recentSafetyChecks,
            },
        });
    } catch (error: any) {
        console.error('Get user details error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', requirePermission('users', 'edit'), validateUserUpdate, async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { firstName, lastName, email, role, status, is_active, metadata, phone, notes } = req.body;

        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateData: any = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (phone !== undefined) updateData.phone = phone;

        if (is_active !== undefined) {
            updateData.isActive = is_active;
        } else if (status !== undefined) {
            updateData.isActive = (status === 'active');
        }

        if (metadata !== undefined) updateData.metadata = metadata;
        if (notes !== undefined) updateData.adminNotes = notes;

        const updated = await UserModel.findByIdAndUpdate(req.params.id, updateData);
        if (!updated) return res.status(500).json({ error: 'Failed to update user' });

        const rows = await prisma.$queryRawUnsafe<any[]>('SELECT *, phone_number as "phone", preferences as metadata, (CASE WHEN is_active THEN \'active\' ELSE \'inactive\' END) as status FROM core.users WHERE id = $1', req.params.id);
        const userRow = rows[0];

        res.json({
            message: 'User updated successfully',
            user: userRow
        });
    } catch (error: any) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', requirePermission('users', 'delete'), async (req: Request, res: Response) => {
    try {
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.metadata?.role === 'admin') {
            return res.status(400).json({ message: 'Cannot delete admin user' });
        }

        await prisma.$executeRawUnsafe('DELETE FROM core.users WHERE id = $1', req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/admin/users/:id/suspend
// @desc    Suspend user
// @access  Private/Admin
router.post('/:id/suspend', requirePermission('users', 'edit'), [
    body('reason').notEmpty().trim(),
    body('duration').optional().isInt({ min: 1 }),
], async (req: any, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { reason, duration } = req.body;

        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const suspension = {
            reason,
            suspendedAt: new Date(),
            suspendedBy: req.user?.id || req.admin?.id,
            duration: duration ? duration * 24 * 60 * 60 * 1000 : null,
            expiresAt: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null,
        };

        await UserModel.findByIdAndUpdate(req.params.id, {
            status: 'suspended',
            isActive: false,
            suspension
        });

        await emailService.sendEmail({
            to: user.email,
            subject: 'Account Suspended',
            template: 'account-suspended',
            data: {
                name: user.firstName,
                reason,
                duration: duration ? `${duration} days` : 'indefinitely',
                supportEmail: process.env.SUPPORT_EMAIL,
            },
        });

        res.json({
            message: 'User suspended successfully',
            suspension,
        });
    } catch (error: any) {
        console.error('Suspend user error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/admin/users/:id/unsuspend
// @desc    Unsuspend user
// @access  Private/Admin
router.post('/:id/unsuspend', requirePermission('users', 'edit'), async (req: Request, res: Response) => {
    try {
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await UserModel.findByIdAndUpdate(req.params.id, {
            status: 'active',
            isActive: true,
            suspension: null
        });

        await emailService.sendEmail({
            to: user.email,
            subject: 'Account Reactivated',
            template: 'account-reactivated',
            data: {
                name: user.firstName,
            },
        });

        res.json({ message: 'User unsuspended successfully' });
    } catch (error: any) {
        console.error('Unsuspend user error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/admin/users/:id/reset-password
// @desc    Reset user password (admin action)
// @access  Private/Admin
router.post('/:id/reset-password', requirePermission('users', 'edit'), async (req: Request, res: Response) => {
    try {
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate temp password or send reset link
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

        // In production, you'd hash this and save it
        await emailService.sendEmail({
            to: user.email,
            subject: 'Password Reset by Administrator',
            template: 'admin-password-reset',
            data: {
                name: user.firstName,
                tempPassword,
            },
        });

        res.json({ message: 'Password reset email sent' });
    } catch (error: any) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/users/:id/activity
// @desc    Get user activity log
// @access  Private/Admin
router.get('/:id/activity', requirePermission('users', 'view'), async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const { limit = 50 } = req.query;

        const rows = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                id, type, data, created_at as "createdAt"
            FROM unified_entities
            WHERE owner_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `, userId, parseInt(limit as string));

        res.json({ activities: rows });
    } catch (error: any) {
        console.error('Get user activity error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
