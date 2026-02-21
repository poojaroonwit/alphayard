import { Router } from 'express';

// Admin Routes
import boundaryAdminRoutes from '../admin/boundary';
import configRoutes from '../admin/configRoutes';

const router = Router();

// Admin Routes
router.use('/admin', boundaryAdminRoutes);
router.use('/admin/config', configRoutes);

export default router;
