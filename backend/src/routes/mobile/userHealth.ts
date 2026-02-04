import express from 'express';
import { authenticateToken } from '../../middleware/auth';
import UserHealthController from '../../controllers/mobile/UserHealthController';

const router = express.Router();

router.use(authenticateToken as any);

router.get('/metrics', UserHealthController.getMetrics);
router.post('/metrics', UserHealthController.addMetric);

export default router;
