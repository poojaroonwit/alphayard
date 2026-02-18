import { Router } from 'express';
import { ComponentController } from '../../controllers/admin/ComponentController';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = Router();
const componentController = new ComponentController();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// Get all component definitions
router.get('/components', requirePermission('components', 'view'), componentController.getComponents.bind(componentController));

// Get component categories
router.get('/components/categories', requirePermission('components', 'view'), componentController.getCategories.bind(componentController));

// Validate component schema
router.post('/components/validate-schema', requirePermission('components', 'view'), componentController.validateSchema.bind(componentController));

// Get component by ID
router.get('/components/:id', requirePermission('components', 'view'), componentController.getComponentById.bind(componentController));

// Get component by name
router.get('/components/name/:name', requirePermission('components', 'view'), componentController.getComponentByName.bind(componentController));

// Create new component
router.post('/components', requirePermission('components', 'create'), componentController.createComponent.bind(componentController));

// Update component
router.put('/components/:id', requirePermission('components', 'edit'), componentController.updateComponent.bind(componentController));

// Delete component
router.delete('/components/:id', requirePermission('components', 'delete'), componentController.deleteComponent.bind(componentController));

export default router;
