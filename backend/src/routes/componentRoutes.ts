import { Router } from 'express';
import { ComponentController } from '../controllers/ComponentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const componentController = new ComponentController();

// Get all component definitions
router.get('/components', authenticateToken as any, componentController.getComponents.bind(componentController));

// Get component categories
router.get('/components/categories', authenticateToken as any, componentController.getCategories.bind(componentController));

// Validate component schema
router.post('/components/validate-schema', authenticateToken as any, componentController.validateSchema.bind(componentController));

// Get component by ID
router.get('/components/:id', authenticateToken as any, componentController.getComponentById.bind(componentController));

// Get component by name
router.get('/components/name/:name', authenticateToken as any, componentController.getComponentByName.bind(componentController));

// Create new component
router.post('/components', authenticateToken as any, componentController.createComponent.bind(componentController));

// Update component
router.put('/components/:id', authenticateToken as any, componentController.updateComponent.bind(componentController));

// Delete component
router.delete('/components/:id', authenticateToken as any, componentController.deleteComponent.bind(componentController));

export default router;
