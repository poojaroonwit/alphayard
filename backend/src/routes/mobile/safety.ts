import express from 'express';
import { body, query as queryValidator } from 'express-validator';
import { authenticateToken, requireCircleMember, optionalCircleMember } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import entityService from '../../services/EntityService';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);
router.use(optionalCircleMember as any);

// Get safety statistics
router.get('/stats', async (req: any, res: any) => {
  try {
    const circleId = req.circleId;

    if (!circleId) {
       return res.json({
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
    }

    const result = await entityService.queryEntities('safety_alert', {
        applicationId: circleId
    } as any);

    const activeAlerts = result.entities.filter(e => !(e.attributes as any).isResolved).length;

    res.json({
      success: true,
      stats: {
        totalAlerts: result.total,
        activeAlerts,
        resolvedAlerts: result.total - activeAlerts,
        alertsByType: {},
        alertsBySeverity: {},
        checkInsToday: 0,
        lastCheckIn: null,
        safetyScore: activeAlerts > 0 ? 70 : 100,
      }
    });
  } catch (error) {
    console.error('Get safety stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get safety alerts
router.get('/alerts', [
  queryValidator('status').optional().isIn(['active', 'resolved', 'cancelled']),
  queryValidator('type').optional().isString(),
], validateRequest, async (req: any, res: any) => {
  try {
    const circleId = req.circleId;
    
    if (!circleId) {
      return res.json({ alerts: [], activeAlerts: 0 });
    }

    const { status, type } = req.query as Record<string, string>;
    const filters: any = {
        applicationId: circleId,
        status: 'active'
    };

    if (status === 'active') filters['data->>isResolved'] = 'false';
    else if (status === 'resolved') filters['data->>isResolved'] = 'true';

    if (type) filters['data->>type'] = type;

    const result = await entityService.queryEntities('safety_alert', {
        ...filters,
        sortBy: 'created_at',
        sortOrder: 'DESC'
    } as any);

    const activeCount = result.entities.filter(e => !(e.attributes as any).isResolved).length;

    res.json({
      alerts: result.entities.map(e => ({
          ...e.attributes,
          id: e.id,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt
      })),
      activeAlerts: activeCount
    });
  } catch (error) {
    console.error('Get safety alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create safety alert
router.post('/alerts', [
  body('type').isString().isIn(['emergency', 'check_in', 'location_alert', 'custom']),
  body('severity').optional().isString().isIn(['low', 'medium', 'high', 'urgent']),
], requireCircleMember as any, validateRequest, async (req: any, res: any) => {
  try {
    const circleId = req.circleId;
    const userId = req.user.id;
    const { type, severity = 'medium', message, location } = req.body;

    const entity = await entityService.createEntity({
        typeName: 'safety_alert',
        ownerId: userId,
        applicationId: circleId,
        attributes: {
            type,
            severity,
            message,
            location,
            isResolved: false
        }
    });

    res.status(201).json({
      message: 'Safety alert created successfully',
      alert: { ...entity.attributes, id: entity.id, createdAt: entity.createdAt }
    });
  } catch (error) {
    console.error('Create safety alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

