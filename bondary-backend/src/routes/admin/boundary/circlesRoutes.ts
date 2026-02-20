import express, { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { authenticateAdmin } from '../../../middleware/adminAuth';
import { requirePermission } from '../../../middleware/permissionCheck';
import { body, query, validationResult } from 'express-validator';

const router = express.Router();

// Apply admin auth to all routes
router.use(authenticateAdmin);

// @route   GET /api/admin/boundary/circles
// @desc    Get all circles (families) with pagination
// @access  Private/Admin
router.get('/', requirePermission('circles', 'view'), async (req, res) => {
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
        const countRows = await prisma.$queryRawUnsafe(countQuery, ...params);
        const total = parseInt((countRows as any)[0].count.toString());
        
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
        const circles = await prisma.$queryRawUnsafe(query, ...params);
        
        res.json({
            circles,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching circles:', error);
        res.status(500).json({ error: 'Failed to fetch circles' });
    }
});

// @route   GET /api/admin/boundary/circles/:id
// @desc    Get circle by ID with members
// @access  Private/Admin
router.get('/:id', requirePermission('circles', 'view'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const circle = await prisma.$queryRawUnsafe(`
            SELECT 
                ue.*,
                data->>'name' as name,
                data->>'description' as description,
                data->>'type' as circle_type,
                data->>'privacy' as privacy,
                data->>'location' as location,
                data->>'settings' as settings
            FROM unified_entities ue
            WHERE ue.id = $1 AND ue.type = 'circle' AND ue.status != 'deleted'
        `, id);
        
        if (!circle || (circle as any[]).length === 0) {
            return res.status(404).json({ error: 'Circle not found' });
        }
        
        // Get members
        const members = await prisma.$queryRawUnsafe(`
            SELECT 
                er.*,
                u.email,
                u.data->>'firstName' as first_name,
                u.data->>'lastName' as last_name,
                u.data->>'avatar' as avatar
            FROM entity_relations er
            JOIN core.users u ON er.source_id = u.id::text
            WHERE er.target_id = $1 AND er.relation_type = 'member'
            ORDER BY er.created_at ASC
        `, id);
        
        res.json({
            circle: (circle as any[])[0],
            members
        });
    } catch (error) {
        console.error('Error fetching circle:', error);
        res.status(500).json({ error: 'Failed to fetch circle' });
    }
});

// @route   PUT /api/admin/boundary/circles/:id/status
// @desc    Update circle status
// @access  Private/Admin
router.put('/:id/status', [
    body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], requirePermission('circles', 'manage'), async (req: Request, res: Response) => {
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
            WHERE id = $2 AND type = 'circle'
            RETURNING id, status
        `, status, id);
        
        if (!result || (result as any[]).length === 0) {
            return res.status(404).json({ error: 'Circle not found' });
        }
        
        res.json({
            message: 'Circle status updated successfully',
            circle: (result as any[])[0]
        });
    } catch (error) {
        console.error('Error updating circle status:', error);
        res.status(500).json({ error: 'Failed to update circle status' });
    }
});

// @route   DELETE /api/admin/boundary/circles/:id
// @desc    Delete circle (soft delete)
// @access  Private/Admin
router.delete('/:id', requirePermission('circles', 'delete'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await prisma.$queryRawUnsafe(`
            UPDATE unified_entities 
            SET status = 'deleted', updated_at = NOW()
            WHERE id = $1 AND type = 'circle'
            RETURNING id
        `, id);
        
        if (!result || (result as any[]).length === 0) {
            return res.status(404).json({ error: 'Circle not found' });
        }
        
        res.json({
            message: 'Circle deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting circle:', error);
        res.status(500).json({ error: 'Failed to delete circle' });
    }
});

export default router;
