import express from 'express';
import { ComponentStudioController } from '../../controllers/admin/ComponentStudioController';
import { authenticateAdmin } from '../../middleware/adminAuth';

const router = express.Router();
const controller = new ComponentStudioController();

// Use admin authentication for all component studio routes
router.use(authenticateAdmin as any);

router.get('/sidebar', (req, res) => controller.getSidebar(req, res));
router.post('/styles', (req, res) => controller.createStyle(req, res));
router.put('/styles/:id', (req, res) => controller.updateStyle(req, res));
router.post('/styles/:id/duplicate', (req, res) => controller.duplicateStyle(req, res));
router.delete('/styles/:id', (req, res) => controller.deleteStyle(req, res));

export default router;

