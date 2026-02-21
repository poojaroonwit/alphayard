import { Router } from 'express';

// Admin Routes
import boundaryAdminRoutes from '../admin/boundary';
import configRoutes from '../admin/configRoutes';
import authRoutes from '../admin/authRoutes';
import entityRoutes from '../admin/entityRoutes';

const router = Router();

// Admin Routes
router.use('/admin', boundaryAdminRoutes);
router.use('/admin/config', configRoutes);
router.use('/admin/auth', authRoutes);
router.use('/admin', entityRoutes); // Entity types, settings, broadcast, etc.

export default router;
