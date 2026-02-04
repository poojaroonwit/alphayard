import { Router } from 'express';
import { authenticateToken, requireCircleMember } from '../../middleware/auth';
import entityService from '../../services/EntityService';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken as any);

/**
 * GET /user/locations
 * Get all saved locations for the current user
 */
router.get('/', async (req: any, res: any) => {
    try {
        const userId = req.user?.id;
        const result = await entityService.queryEntities('saved_location', {
            ownerId: userId
        } as any);
        res.json({ 
            success: true, 
            data: result.entities.map(e => ({ ...e.attributes, id: e.id, createdAt: e.createdAt })) 
        });
    } catch (error) {
        console.error('Error fetching user locations:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch locations' });
    }
});

/**
 * GET /user/locations/:type
 */
router.get('/:type', async (req: any, res: any) => {
    try {
        const userId = req.user?.id;
        const { type } = req.params;

        const result = await entityService.queryEntities('saved_location', {
            ownerId: userId,
            filters: { locationType: type }
        } as any);

        if (result.total === 0) {
            return res.status(404).json({ success: false, error: 'Location not found' });
        }

        const location = result.entities[0];
        res.json({ success: true, data: { ...location.attributes, id: location.id } });
    } catch (error) {
        console.error('Error fetching user location:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch location' });
    }
});

/**
 * POST /user/locations
 */
router.post('/', requireCircleMember as any, async (req: any, res: any) => {
    try {
        const userId = req.user?.id;
        const { locationType, name, latitude, longitude, address } = req.body;

        if (!locationType || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: locationType, latitude, longitude'
            });
        }

        const entity = await entityService.createEntity({
            typeName: 'saved_location',
            ownerId: userId,
            applicationId: req.circleId,
            attributes: {
                locationType,
                name,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                address
            }
        });

        res.status(201).json({ success: true, data: { ...entity.attributes, id: entity.id } });
    } catch (error) {
        console.error('Error saving user location:', error);
        res.status(500).json({ success: false, error: 'Failed to save location' });
    }
});

/**
 * DELETE /user/locations/:type
 */
router.delete('/:type', async (req: any, res: any) => {
    try {
        const userId = req.user?.id;
        const { type } = req.params;

        const result = await entityService.queryEntities('saved_location', {
            ownerId: userId,
            filters: { locationType: type }
        } as any);

        for (const entity of result.entities) {
            await entityService.deleteEntity(entity.id);
        }

        res.json({ success: true, message: 'Location deleted successfully' });
    } catch (error) {
        console.error('Error deleting user location:', error);
        res.status(500).json({ success: false, error: 'Failed to delete location' });
    }
});

export default router;
