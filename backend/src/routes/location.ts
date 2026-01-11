import express from 'express';
import { body } from 'express-validator';
import { authenticateToken, requireFamilyMember } from '../middleware/auth';
import { pool } from '../config/database';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// All routes require authentication and hourse membership
router.use(authenticateToken as any);
router.use(requireFamilyMember as any);

// Get location statistics
router.get('/stats', async (req: any, res: any) => {
  try {
    // Return empty stats for now
    res.json({
      success: true,
      stats: {
        totalLocationsTracked: 0,
        membersSharing: 0,
        lastUpdated: null,
        geofencesActive: 0,
        alertsTriggered: 0,
      }
    });
  } catch (error) {
    console.error('Get location stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});
router.get('/', async (req: any, res: any) => {
  try {
    const familyId = (req as any).familyId as string;

    // Get latest location for each family member
    const { rows: locations } = await pool.query(
      `SELECT lh.id, lh.user_id, lh.latitude, lh.longitude, lh.accuracy, lh.address, lh.created_at,
              u.id as u_id, u.first_name, u.last_name, u.email, u.avatar_url
       FROM location_history lh
       LEFT JOIN users u ON lh.user_id = u.id
       WHERE lh.family_id = $1
       ORDER BY lh.created_at DESC`,
      [familyId]
    );

    // Group by user_id and get latest for each
    const latestLocations = locations?.reduce((acc: any, loc: any) => {
      if (!acc[loc.user_id]) {
        acc[loc.user_id] = {
          userId: loc.user_id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          address: loc.address,
          timestamp: loc.created_at,
          user: loc.u_id ? {
            id: loc.u_id,
            firstName: loc.first_name,
            lastName: loc.last_name,
            email: loc.email,
            avatar: loc.avatar_url
          } : null
        };
      }
      return acc;
    }, {} as Record<string, any>) || {};

    res.json({
      locations: Object.values(latestLocations),
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Update user location
router.post('/', [
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('accuracy').optional().isFloat({ min: 0 }),
  body('address').optional().isString().trim(),
], validateRequest, async (req: any, res: any) => {
  try {
    const familyId = (req as any).familyId as string;
    const userId = req.user.id;
    const { latitude, longitude, accuracy, address } = req.body;

    // Save location to database
    const { rows } = await pool.query(
      `INSERT INTO location_history (user_id, family_id, latitude, longitude, accuracy, address, is_shared, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
       RETURNING *`,
      [userId, familyId, latitude, longitude, accuracy || null, address || null]
    );

    const location = rows[0];

    res.json({
      message: 'Location updated successfully',
      location: {
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address,
        timestamp: location.created_at
      }
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

export default router;
