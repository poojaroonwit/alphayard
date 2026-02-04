import { Router } from 'express';
import { publicApplicationController } from '../../controllers/mobile/PublicApplicationController';

const router = Router();

// @route   GET /api/public/applications/:slug/config
// @desc    Get public configuration for an application
router.get('/:slug/config', publicApplicationController.getConfig.bind(publicApplicationController));

export default router;
