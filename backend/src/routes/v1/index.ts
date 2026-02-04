import { Router } from 'express';

// Mobile Routes
import authRoutes from '../mobile/auth';
import userRoutes from '../mobile/users';
import circleRoutes from '../mobile/circles';
import chatRoutes from '../mobile/chat';
import chatAttachmentRoutes from '../mobile/chatAttachments';
import locationRoutes from '../mobile/location';
import safetyRoutes from '../mobile/safety';
import safetyIncidentsRoutes from '../mobile/safetyIncidents';
import storageRoutes from '../mobile/storage';
import calendarRoutes from '../mobile/calendar';
import notesRoutes from '../mobile/notes';
import todosRoutes from '../mobile/todos';
import socialRoutes from '../mobile/social';
import financialRoutes from '../mobile/financial';
import translationsRoutes from '../mobile/translations';
import emotionsRoutes from '../mobile/emotions';
import circleTypeRoutes from '../mobile/circleTypeRoutes';
import galleryRoutes from '../mobile/gallery';
import miscRoutes from '../mobile/misc';
import settingsRoutes from '../mobile/settings';
import notificationRoutes from '../mobile/notifications';
import shoppingRoutes from '../mobile/shopping';
import userHealthRoutes from '../mobile/userHealth';
import mobileRoutes from '../mobile/mobileRoutes';

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

// Mobile / Core routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/circles', circleRoutes);
router.use('/chat', chatRoutes);
router.use('/chat-attachments', chatAttachmentRoutes);
router.use('/location', locationRoutes);
router.use('/safety', safetyRoutes);
router.use('/safety', safetyIncidentsRoutes); 
router.use('/storage', storageRoutes);
router.use('/calendar', calendarRoutes);
router.use('/notes', notesRoutes);
router.use('/todos', todosRoutes);
router.use('/social', socialRoutes);
router.use('/finance', financialRoutes);
router.use('/expenses', financialRoutes);
router.use('/emotions', emotionsRoutes);
router.use('/translations', translationsRoutes);
router.use('/circle-types', circleTypeRoutes);
router.use('/gallery', galleryRoutes);
router.use('/misc', miscRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/shopping', shoppingRoutes);
router.use('/health', userHealthRoutes);
router.use('/mobile', mobileRoutes);

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
