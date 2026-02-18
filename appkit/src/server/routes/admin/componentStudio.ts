import express from 'express';
import { ComponentStudioController } from '../../controllers/admin/ComponentStudioController';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = express.Router();
const controller = new ComponentStudioController();

// Use admin authentication for all component studio routes
router.use(authenticateAdmin as any);

router.get('/sidebar', requirePermission('components', 'view'), (req, res) => controller.getSidebar(req, res));
router.post('/styles', requirePermission('components', 'create'), (req, res) => controller.createStyle(req, res));
router.put('/styles/:id', requirePermission('components', 'edit'), (req, res) => controller.updateStyle(req, res));
router.post('/styles/:id/duplicate', requirePermission('components', 'create'), (req, res) => controller.duplicateStyle(req, res));
router.delete('/styles/:id', requirePermission('components', 'delete'), (req, res) => controller.deleteStyle(req, res));

export default router;

