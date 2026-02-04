import { Router } from 'express';

// Admin & CMS Routes
import adminRoutes from '../admin/admin';
import adminUsersRoutes from '../admin/adminUsers';
import entityRoutes from '../admin/entityRoutes';
import preferencesRoutes from '../admin/preferences';
import applicationRoutes from '../admin/applicationRoutes';
import auditRoutes from '../admin/audit';
import cmsRoutes from '../admin/cmsRoutes';
import marketingRoutes from '../admin/marketingRoutes';
import localizationRoutes from '../admin/localizationRoutes';
import dynamicContentRoutes from '../admin/dynamicContentRoutes';
import versionControlRoutes from '../admin/versionControlRoutes';

const router = Router();

// Admin Routes
router.use('/admin', adminRoutes);
router.use('/admin', adminUsersRoutes);
router.use('/admin/auth', adminUsersRoutes);
router.use('/admin/entities', entityRoutes);
router.use('/admin/preferences', preferencesRoutes);
router.use('/admin/applications', applicationRoutes);
router.use('/audit', auditRoutes);

// CMS Routes
router.use('/cms', cmsRoutes);
router.use('/cms/marketing', marketingRoutes);
router.use('/cms/localization', localizationRoutes);
router.use('/cms/content', dynamicContentRoutes);
router.use('/cms/versions', versionControlRoutes);

export default router;
