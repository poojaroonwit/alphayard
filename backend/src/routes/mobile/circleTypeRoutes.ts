import { Router } from 'express';
import { CircleTypeController } from '../../controllers/mobile/CircleTypeController';
import { authenticateToken, requireAdmin } from '../../middleware/auth';

const router = Router();

// Public route for fetching types (needed for signup)
router.get('/', CircleTypeController.getAll);
router.get('/:id', CircleTypeController.getById);

// Admin only routes
router.post('/', authenticateToken as any, requireAdmin as any, CircleTypeController.create);
router.put('/:id', authenticateToken as any, requireAdmin as any, CircleTypeController.update);
router.delete('/:id', authenticateToken as any, requireAdmin as any, CircleTypeController.delete);

export default router;
