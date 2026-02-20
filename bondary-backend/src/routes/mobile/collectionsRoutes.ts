import { Router, Request, Response } from 'express';
import entityService from '../../services/EntityService';
import { authenticateToken } from '../../middleware/auth';
import { getApplicationIdFromRequest } from '../../utils/appHelper';
import { AppScopedRequest } from '../../middleware/appScoping';

const router = Router();

/**
 * Mobile API endpoints for dynamic collections
 */

/**
 * List all available collections
 */
router.get('/', authenticateToken as any, async (req: Request, res: Response) => {
    try {
        const types = await entityService.listEntityTypes();
        res.json({ success: true, collections: types });
    } catch (error: any) {
        console.error('List collections error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get collection schema
 */
router.get('/:typeName/schema', authenticateToken as any, async (req: Request, res: Response) => {
    try {
        const { typeName } = req.params;
        const entityType = await entityService.getEntityType(typeName);
        if (!entityType) return res.status(404).json({ success: false, error: 'Collection not found' });
        res.json({ success: true, collection: entityType });
    } catch (error: any) {
        console.error('Get collection schema error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get collection items
 */
router.get('/:typeName', authenticateToken as any, async (req: AppScopedRequest, res: Response) => {
    try {
        const { typeName } = req.params;
        const { applicationId: queryAppId, page, limit, orderBy, orderDir, search } = req.query;

        // Use application ID from: query param > request context (from middleware) > default
        const effectiveApplicationId = (queryAppId as string) || 
            await getApplicationIdFromRequest(req) || '';

        const result = await entityService.queryEntities(typeName, {
            applicationId: effectiveApplicationId,
            page: parseInt(page as string) || 1,
            limit: parseInt(limit as string) || 20,
            orderBy: orderBy as string,
            orderDir: orderDir as 'DESC' | 'ASC',
            search: search as string
        } as any);

        res.json({
            success: true,
            items: result.entities.map(e => ({ id: e.id, ...e.attributes, status: e.status, createdAt: e.createdAt })),
            total: result.total
        });
    } catch (error: any) {
        console.error('Get collection items error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get single item
 */
router.get('/:typeName/:id', authenticateToken as any, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const entity = await entityService.getEntity(id);
        if (!entity) return res.status(404).json({ success: false, error: 'Item not found' });
        res.json({ success: true, item: { id: entity.id, ...entity.attributes, status: entity.status } });
    } catch (error: any) {
        console.error('Get collection item error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Create item
 */
router.post('/:typeName', authenticateToken as any, async (req: Request, res: Response) => {
    try {
        const { typeName } = req.params;
        const { applicationId, attributes } = req.body;
        const entity = await entityService.createEntity({
            typeName,
            applicationId,
            ownerId: (req as any).user?.id,
            attributes: attributes || {}
        });
        res.status(201).json({ success: true, item: { id: entity.id, ...entity.attributes } });
    } catch (error: any) {
        console.error('Create collection item error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
