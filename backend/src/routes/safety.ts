import express from 'express';
import { body } from 'express-validator';
import { authenticateToken, requireFamilyMember } from '../middleware/auth';
import { pool } from '../config/database';
import { validateRequest } from '../middleware/validation';
import { query } from 'express-validator';

const router = express.Router();

// All routes require authentication and hourse membership
router.use(authenticateToken as any);
router.use(requireFamilyMember as any);

// Get safety statistics
router.get('/stats', async (req: any, res: any) => {
  try {
    // Return empty stats for now
    res.json({
      success: true,
      stats: {
        totalAlerts: 0,
        activeAlerts: 0,
        resolvedAlerts: 0,
        alertsByType: {},
        alertsBySeverity: {},
        checkInsToday: 0,
        lastCheckIn: null,
        safetyScore: 100,
      }
    });
  } catch (error) {
    console.error('Get safety stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Get safety alerts
router.get('/alerts', [
  query('status').optional().isIn(['active', 'resolved', 'cancelled']),
  query('type').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
], validateRequest, async (req: any, res: any) => {
  try {
    const familyId = (req as any).familyId as string;
    const { status, type, limit = 50, offset = 0 } = req.query as Record<string, string>;

    let sql = `
      SELECT sa.id, sa.user_id, sa.family_id, sa.type, sa.severity, sa.message, sa.location, 
             sa.is_resolved, sa.created_at, sa.updated_at,
             u.id as u_id, u.first_name, u.last_name, u.email, u.avatar_url
      FROM safety_alerts sa
      LEFT JOIN users u ON sa.user_id = u.id
      WHERE sa.family_id = $1
    `;
    const params: any[] = [familyId];
    let paramIdx = 2;

    if (status) {
      if (status === 'active') {
        sql += ` AND sa.is_resolved = false`;
      } else if (status === 'resolved') {
        sql += ` AND sa.is_resolved = true`;
      }
    }

    if (type) {
      sql += ` AND sa.type = $${paramIdx++}`;
      params.push(type);
    }

    sql += ` ORDER BY sa.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const { rows: alerts } = await pool.query(sql, params);

    // Get count of active alerts
    const { rows: countRows } = await pool.query(
      'SELECT count(*) FROM safety_alerts WHERE family_id = $1 AND is_resolved = false',
      [familyId]
    );
    const activeCount = parseInt(countRows[0].count);

    res.json({
      alerts: alerts?.map((alert: any) => ({
        id: alert.id,
        userId: alert.user_id,
        familyId: alert.family_id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        location: alert.location,
        isResolved: alert.is_resolved,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at,
        user: alert.u_id ? {
          id: alert.u_id,
          firstName: alert.first_name,
          lastName: alert.last_name,
          email: alert.email,
          avatar: alert.avatar_url
        } : null
      })) || [],
      activeAlerts: activeCount || 0
    });
  } catch (error) {
    console.error('Get safety alerts error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Create safety alert
router.post('/alerts', [
  body('type').isString().isIn(['emergency', 'check_in', 'location_alert', 'custom']),
  body('severity').optional().isString().isIn(['low', 'medium', 'high', 'urgent']),
  body('message').optional().isString().trim(),
  body('location').optional().isString().trim(),
], validateRequest, async (req: any, res: any) => {
  try {
    const familyId = (req as any).familyId as string;
    const userId = req.user.id;
    const { type, severity = 'medium', message, location } = req.body;

    // Create safety alert
    const { rows } = await pool.query(
      `INSERT INTO safety_alerts (user_id, family_id, type, severity, message, location, is_resolved, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW())
       RETURNING *`,
      [userId, familyId, type, severity, message || null, location || null]
    );

    const alert = rows[0];

    res.status(201).json({
      message: 'Safety alert created successfully',
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        location: alert.location,
        isResolved: alert.is_resolved,
        createdAt: alert.created_at
      }
    });
  } catch (error) {
    console.error('Create safety alert error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

export default router;
