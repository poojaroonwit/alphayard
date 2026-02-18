import { Router, Response } from 'express';
import { authenticateAdmin, AdminRequest } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import entityService from '../../services/EntityService';

const router = Router();

// All entity routes require admin authentication
router.use(authenticateAdmin as any);

/**
 * List all entity types
 */
router.get('/types', requirePermission('collections', 'view'), async (req: AdminRequest, res: Response) => {
    try {
        const applicationId = req.query.applicationId as string;
        const types = await entityService.listEntityTypes(applicationId);
        // Return format compatible with frontend expectations
        res.json({ success: true, types });
    } catch (error: any) {
        console.error('List entity types error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get single entity type by ID
 */
router.get('/types/:id', requirePermission('collections', 'view'), async (req: AdminRequest, res: Response) => {
    try {
        const { id } = req.params;
        const entityType = await entityService.getEntityTypeById(id);
        
        if (!entityType) {
            return res.status(404).json({ error: 'Entity type not found' });
        }

        res.json({ entityType });
    } catch (error: any) {
        console.error('Get entity type error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create new entity type (collection schema)
 */
router.post('/types', async (req: AdminRequest, res: Response) => {
    try {
        const { name, displayName, description, applicationId, schema, icon } = req.body;

        if (!name || !displayName) {
            return res.status(400).json({ error: 'Name and displayName are required' });
        }

        const entityType = await entityService.createEntityType({
            name,
            displayName,
            description,
            applicationId,
            schema,
            icon
        });

        res.status(201).json({ entityType });
    } catch (error: any) {
        console.error('Create entity type error:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Update entity type
 */
router.put('/types/:id', requirePermission('collections', 'edit'), async (req: AdminRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { displayName, description, schema, icon } = req.body;

        const entityType = await entityService.updateEntityType(id, {
            displayName,
            description,
            schema,
            icon
        });

        if (!entityType) {
            return res.status(404).json({ error: 'Entity type not found' });
        }

        res.json({ entityType });
    } catch (error: any) {
        console.error('Update entity type error:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Delete entity type (non-system only)
 */
router.delete('/types/:id', requirePermission('collections', 'delete'), async (req: AdminRequest, res: Response) => {
    try {
        const { id } = req.params;

        const success = await entityService.deleteEntityType(id);

        if (!success) {
            return res.status(404).json({ error: 'Entity type not found or cannot be deleted' });
        }

        res.json({ success: true, message: 'Entity type deleted successfully' });
    } catch (error: any) {
        console.error('Delete entity type error:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Query entities by type
 */
router.get('/:typeName', requirePermission('content', 'view'), async (req: AdminRequest, res: Response) => {
    try {
        const { typeName } = req.params;
        const {
            applicationId,
            ownerId,
            status,
            page,
            limit,
            orderBy,
            orderDir,
            search
        } = req.query;

        // If search term provided, use search
        if (search) {
            const entities = await entityService.searchEntities(typeName, search as string, {
                applicationId: applicationId as string,
                limit: parseInt(limit as string) || 20
            });
            
            // Get entity type config to check response_key format
            const entityType = await entityService.getEntityType(typeName);
            const responseKey = entityType?.responseKey || 'entities';
            
            // Return response in format expected by frontend (using responseKey)
            return res.json({ 
                [responseKey]: entities, 
                total: entities.length 
            });
        }

        // Otherwise, use standard query
        const result = await entityService.queryEntities(typeName, {
            applicationId: applicationId as string,
            ownerId: ownerId as string,
            status: status as string,
            page: parseInt(page as string) || 1,
            limit: parseInt(limit as string) || 20,
            orderBy: orderBy as string,
            orderDir: orderDir as 'asc' | 'desc'
        });

        // Get entity type config to check response_key format
        const entityType = await entityService.getEntityType(typeName);
        const responseKey = entityType?.responseKey || 'entities';
        
        // Return response in format expected by frontend (using responseKey)
        res.json({
            [responseKey]: result.entities,
            total: result.total,
            page: result.page,
            limit: result.limit
        });
    } catch (error: any) {
        console.error('Query entities error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get single entity by ID
 */
router.get('/:typeName/:id', async (req: AdminRequest, res: Response) => {
    try {
        const { id } = req.params;
        const entity = await entityService.getEntity(id);
        
        if (!entity) {
            return res.status(404).json({ error: 'Entity not found' });
        }

        res.json({ entity });
    } catch (error: any) {
        console.error('Get entity error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create new entity
 */
router.post('/:typeName', requirePermission('content', 'create'), async (req: AdminRequest, res: Response) => {
    try {
        const { typeName } = req.params;
        const { applicationId, ownerId, attributes, metadata, ...other } = req.body;

        // If attributes is not provided, treat all other fields as attributes
        const effectiveAttributes = attributes || other;

        const entity = await entityService.createEntity({
            typeName,
            applicationId,
            ownerId,
            attributes: effectiveAttributes || {},
            metadata
        });

        res.status(201).json({ entity });
    } catch (error: any) {
        console.error('Create entity error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update entity
 */
router.put('/:typeName/:id', async (req: AdminRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { attributes, metadata, status, ...other } = req.body;

        // If attributes is not provided, treat other fields as attributes
        // but exclude known internal fields if they might be present
        const effectiveAttributes = attributes || other;

        const entity = await entityService.updateEntity(id, {
            attributes: effectiveAttributes,
            metadata,
            status
        });

        if (!entity) {
            return res.status(404).json({ error: 'Entity not found' });
        }

        res.json({ entity });
    } catch (error: any) {
        console.error('Update entity error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete entity (soft delete by default)
 */
router.delete('/:typeName/:id', requirePermission('content', 'delete'), async (req: AdminRequest, res: Response) => {
    try {
        const { id } = req.params;
        const hard = req.query.hard === 'true';

        const success = await entityService.deleteEntity(id, hard);

        if (!success) {
            return res.status(404).json({ error: 'Entity not found' });
        }

        res.json({ success: true, message: hard ? 'Entity permanently deleted' : 'Entity archived' });
    } catch (error: any) {
        console.error('Delete entity error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
