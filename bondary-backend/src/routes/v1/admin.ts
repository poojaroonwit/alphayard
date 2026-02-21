import { Router } from 'express';

// Admin Routes
import boundaryAdminRoutes from '../admin/boundary';
import workingConfigRoutes from '../admin/workingConfigRoutes'; // Working version
import authRoutes from '../admin/authRoutes';
import entityRoutes from '../admin/entityRoutes';
import uploadRoutes from '../admin/uploadRoutes';
import dashboardRoutes from '../admin/dashboardRoutes';
import identityRoutes from '../admin/identityRoutes';
import legalRoutes from '../admin/legalRoutes';

const router = Router();

// Admin Routes - Use working config routes
router.use('/admin/config', workingConfigRoutes); // Use working version
router.use('/admin', boundaryAdminRoutes);
router.use('/admin/auth', authRoutes);
router.use('/admin', entityRoutes); // Entity types, settings, broadcast, etc.
router.use('/admin', uploadRoutes); // File upload system
router.use('/admin', dashboardRoutes); // Dashboard statistics
router.use('/admin/identity', identityRoutes); // Identity management
router.use('/admin/legal', legalRoutes); // Legal documents

export default router;
