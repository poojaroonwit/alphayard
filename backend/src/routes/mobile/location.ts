import express from 'express';
import { body } from 'express-validator';
import { authenticateToken, requireCircleMember, optionalCircleMember } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import entityService from '../../services/EntityService';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);
router.use(optionalCircleMember as any);

// Get location statistics
router.get('/stats', async (req: any, res: any) => {
  try {
    const circleId = req.circleId;

    if (!circleId) {
      return res.json({
        success: true,
        stats: {
          totalLocationsTracked: 0,
          membersSharing: 0,
          lastUpdated: null,
          geofencesActive: 0,
          alertsTriggered: 0,
        }
      });
    }

    const result = await entityService.queryEntities('location_history', {
        applicationId: circleId
    } as any);

    res.json({
      success: true,
      stats: {
        totalLocationsTracked: result.total,
        membersSharing: new Set(result.entities.map(e => e.ownerId)).size,
        lastUpdated: result.entities[0]?.createdAt || null,
        geofencesActive: 0,
        alertsTriggered: 0,
      }
    });
  } catch (error) {
    console.error('Get location stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: any, res: any) => {
  try {
    const circleId = req.circleId;

    if (!circleId) {
       return res.json({
        locations: [],
        lastUpdated: new Date().toISOString()
      });
    }

    const result = await entityService.queryEntities('location_history', {
        applicationId: circleId,
        sortBy: 'created_at',
        sortOrder: 'DESC'
    } as any);

    // Group by owner_id and get latest
    const latestLocations = result.entities.reduce((acc: any, e: any) => {
      if (!acc[e.ownerId]) {
        acc[e.ownerId] = {
          userId: e.ownerId,
          ...e.attributes,
          timestamp: e.createdAt
        };
      }
      return acc;
    }, {} as Record<string, any>);

    res.json({
      locations: Object.values(latestLocations),
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user location
router.post('/', [
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
], requireCircleMember as any, validateRequest, async (req: any, res: any) => {
  try {
    const circleId = req.circleId;
    const userId = req.user.id;
    const { latitude, longitude, accuracy, address } = req.body;

    const entity = await entityService.createEntity({
        typeName: 'location_history',
        ownerId: userId,
        applicationId: circleId,
        attributes: {
            latitude,
            longitude,
            accuracy,
            address,
            isShared: true
        }
    });

    res.json({
      message: 'Location updated successfully',
      location: { ...entity.attributes, id: entity.id, timestamp: entity.createdAt }
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
