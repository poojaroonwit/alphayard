import express, { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { authenticateAdmin } from '../../../middleware/adminAuth';
import { requirePermission } from '../../../middleware/permissionCheck';
import circleService from '../../../services/circleService';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// @route   GET /api/admin/boundary/circles
// @desc    Get all circles (families) with pagination
// @access  Private/Admin
router.get('/', requirePermission('circles', 'view'), async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, search = '', status } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = "WHERE type = 'circle' AND status != 'deleted'";
        const params: any[] = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (data->>'name' ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (status) {
            whereClause += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        const countQuery = `SELECT COUNT(*) FROM unified_entities ${whereClause}`;
        const countRows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            countQuery, ...params
        );
        const total = parseInt(countRows[0].count.toString());

        const query = `
            SELECT 
                id,
                data->>'name' as name,
                data->>'description' as description,
                owner_id,
                status,
                created_at,
                updated_at,
                (SELECT COUNT(*) FROM entity_relations WHERE target_id = unified_entities.id AND relation_type = 'member') as member_count
            FROM unified_entities
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(limitNum, offset);

        const rows = await prisma.$queryRawUnsafe(query, ...params) as any[];

        res.json({
            circles: rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error: any) {
        console.error('Get circles error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/boundary/circles/:id
// @desc    Get circle details
// @access  Private/Admin
router.get('/:id', requirePermission('circles', 'view'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const rows = await prisma.$queryRawUnsafe(`
            SELECT 
                ue.id,
                ue.data->>'name' as name,
                ue.data->>'description' as description,
                ue.data as metadata,
                ue.owner_id,
                ue.status,
                ue.created_at,
                ue.updated_at,
                u.email as owner_email,
                u.first_name as owner_first_name,
                u.last_name as owner_last_name
            FROM unified_entities ue
            LEFT JOIN core.users u ON ue.owner_id = u.id
            WHERE ue.id = $1 AND ue.type = 'circle'
        `, id) as any[];

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Circle not found' });
        }

        // Get members
        const members = await prisma.$queryRawUnsafe(`
            SELECT 
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.avatar_url,
                er.data->>'role' as role,
                er.created_at as joined_at
            FROM entity_relations er
            JOIN core.users u ON er.source_id = u.id
            WHERE er.target_id = $1 AND er.relation_type = 'member'
            ORDER BY er.created_at
        `, id) as any[];

        res.json({
            circle: rows[0],
            members
        });
    } catch (error: any) {
        console.error('Get circle details error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/admin/boundary/circles
// @desc    Create a new circle
// @access  Private/Admin
router.post('/', requirePermission('circles', 'create'), [
    body('name').notEmpty().trim(),
    body('ownerId').notEmpty()
], async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, ownerId } = req.body;
        const circle = await circleService.createCircle({ name, description, ownerId });
        res.status(201).json(circle);
    } catch (error: any) {
        console.error('Create circle error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/admin/boundary/circles/:id
// @desc    Update a circle
// @access  Private/Admin
router.put('/:id', requirePermission('circles', 'edit'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;

        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updates.push(`data = jsonb_set(data, '{name}', $${paramIndex}::jsonb)`);
            params.push(JSON.stringify(name));
            paramIndex++;
        }

        if (description !== undefined) {
            updates.push(`data = jsonb_set(data, '{description}', $${paramIndex}::jsonb)`);
            params.push(JSON.stringify(description));
            paramIndex++;
        }

        if (status !== undefined) {
            updates.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        updates.push('updated_at = NOW()');
        params.push(id);

        const query = `
            UPDATE unified_entities 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex} AND type = 'circle'
            RETURNING *
        `;

        const rows = await prisma.$queryRawUnsafe(query, ...params) as any[];

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Circle not found' });
        }

        res.json(rows[0]);
    } catch (error: any) {
        console.error('Update circle error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/admin/boundary/circles/:id
// @desc    Delete a circle (soft delete)
// @access  Private/Admin
router.delete('/:id', requirePermission('circles', 'delete'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await prisma.$executeRawUnsafe(`
            UPDATE unified_entities 
            SET status = 'deleted', updated_at = NOW()
            WHERE id = $1 AND type = 'circle'
        `, id);

        if (result === 0) {
            return res.status(404).json({ message: 'Circle not found' });
        }

        res.json({ message: 'Circle deleted successfully' });
    } catch (error: any) {
        console.error('Delete circle error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/admin/boundary/circles/:id/members
// @desc    Add member to circle
// @access  Private/Admin
router.post('/:id/members', requirePermission('circles', 'edit'), [
    body('userId').notEmpty(),
    body('role').optional().isIn(['admin', 'member', 'viewer'])
], async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId, role = 'member' } = req.body;

        await circleService.addMember(id, userId, role);
        res.json({ message: 'Member added successfully' });
    } catch (error: any) {
        console.error('Add circle member error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/admin/boundary/circles/:id/members/:userId
// @desc    Remove member from circle
// @access  Private/Admin
router.delete('/:id/members/:userId', requirePermission('circles', 'edit'), async (req: Request, res: Response) => {
    try {
        const { id, userId } = req.params;

        await circleService.removeMember(id, userId);
        res.json({ message: 'Member removed successfully' });
    } catch (error: any) {
        console.error('Remove circle member error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
