import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

// OAuth / SSO Provider Routes - COMMENTED OUT (Missing)
// import oauthRoutes from '../oauth';

// Mobile Routes
// Mobile Routes - COMMENTED OUT (Not available in backend-admin)
/*
import authRoutes from '../mobile/auth';
import userRoutes from '../mobile/users';
import circleRoutes from '../mobile/circles';
import chatRoutes from '../mobile/chat';
import chatAttachmentRoutes from '../mobile/chatAttachments';
import chatFeaturesRoutes from '../mobile/chatFeatures';
import locationRoutes from '../mobile/location';
import safetyRoutes from '../mobile/safety';
import safetyIncidentsRoutes from '../mobile/safetyIncidents';
import storageRoutes from '../mobile/storage';
import fileManagementRoutes, { publicFileRoutes } from '../mobile/fileManagement';
import calendarRoutes from '../mobile/calendar';
import notesRoutes from '../mobile/notes';
import todosRoutes from '../mobile/todos';
import socialRoutes from '../mobile/social';
import socialFeaturesRoutes from '../mobile/socialFeatures';
import financialRoutes from '../mobile/financial';
import translationsRoutes from '../mobile/translations';
import emotionsRoutes from '../mobile/emotions';
import circleTypeRoutes from '../mobile/circleTypeRoutes';
import galleryRoutes from '../mobile/gallery';
import legalRoutes from '../mobile/legal';
import identityRoutes from '../mobile/identity';
import miscRoutes from '../mobile/misc';
import settingsRoutes from '../mobile/settings';
import notificationRoutes from '../mobile/notifications';
import shoppingRoutes from '../mobile/shopping';
import userHealthRoutes from '../mobile/userHealth';
import mobileRoutes from '../mobile/mobileRoutes';
*/

// Admin Routes - Modular Structure
// Common routes (shared across all apps) + Boundary-specific routes
import adminRoutes from '../admin/index';
import commonAdminRoutes from '../admin/common';
import boundaryAdminRoutes from '../admin/boundary';

// Legacy individual imports (for backward compatibility on specific mounts)
import adminUsersRoutes from '../admin/adminUsers';
import entityRoutes from '../admin/entityRoutes';
import oauthClientsRoutes from '../admin/oauthClientsRoutes';
import preferencesRoutes from '../admin/preferences';
import applicationRoutes from '../admin/applicationRoutes';
import auditRoutes from '../admin/audit';
import cmsRoutes from '../admin/cmsRoutes';
import marketingRoutes from '../admin/marketingRoutes';
import localizationRoutes from '../admin/localizationRoutes';
import dynamicContentRoutes from '../admin/dynamicContentRoutes';
import versionControlRoutes from '../admin/versionControlRoutes';
import componentStudioRoutes from '../admin/componentStudio';
import legalAdminRoutes from '../admin/legalRoutes';

const router = Router();

// =============================================
// OAuth 2.0 / OpenID Connect (SSO Provider) - COMMENTED OUT
// =============================================
// router.use('/oauth', oauthRoutes);
// OIDC Discovery at standard path
// router.use('/.well-known', oauthRoutes);

// Mobile / Core routes
// Mobile / Core routes - COMMENTED OUT
/*
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/circles', circleRoutes);
router.use('/chat', chatRoutes);
router.use('/chat', chatFeaturesRoutes); // Additional chat features: pinning, forwarding, threads, polls, calls, etc.
router.use('/chat-attachments', chatAttachmentRoutes);
router.use('/location', locationRoutes);
router.use('/safety', safetyRoutes);
router.use('/safety', safetyIncidentsRoutes); 
router.use('/storage', storageRoutes);
router.use('/files', fileManagementRoutes); // File management: folders, tags, sharing, recent, favorites, quota
router.use('/files', publicFileRoutes); // Public file access via share links (no auth required)
router.use('/calendar', calendarRoutes);
router.use('/notes', notesRoutes);
router.use('/todos', todosRoutes);
router.use('/social', socialRoutes);
router.use('/social', socialFeaturesRoutes); // Additional social features: stories, follows, reactions, bookmarks, polls, hashtags
router.use('/finance', financialRoutes);
router.use('/expenses', financialRoutes);
router.use('/emotions', emotionsRoutes);
router.use('/translations', translationsRoutes);
router.use('/circle-types', circleTypeRoutes);
router.use('/gallery', galleryRoutes);
router.use('/legal', legalRoutes); // Legal documents: terms, privacy, developer guidelines
router.use('/identity', identityRoutes); // Identity management: sessions, devices, MFA, login history
router.use('/misc', miscRoutes);
*/

// Public branding endpoint (no authentication required - used for login page branding)
router.get('/settings/branding', async (req: Request, res: Response) => {
  try {
    let branding: any = {};

    // 1. Try global app_settings first
    const appSetting = await prisma.appSetting.findFirst({
      where: {
        key: 'branding'
      },
      select: {
        value: true
      }
    });

    if (appSetting && appSetting.value) {
      const val = appSetting.value;
      branding = typeof val === 'string' ? JSON.parse(val as string) : val;
    }

    // 2. Fallback to active Application if no branding found
    if (!branding || Object.keys(branding).length === 0) {
      const application = await prisma.application.findFirst({
        where: {
          isActive: true
        },
        select: {
          branding: true
        }
      });

      if (application && application.branding) {
        let appBranding = application.branding;
        if (typeof appBranding === 'string') {
          try { appBranding = JSON.parse(appBranding) } catch (e) { }
        }
        branding = appBranding;
      }
    }

    return res.json({ branding });
  } catch (error) {
    console.warn('[v1/settings/branding] Failed to fetch branding:', error);
    return res.json({ branding: {} });
  }
});

/*
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/shopping', shoppingRoutes);
router.use('/health', userHealthRoutes);
router.use('/mobile', mobileRoutes);
*/

// =============================================
// Admin Routes - Modular Structure
// =============================================

// New modular structure:
// - /admin/common/* - Shared across all apps (CMS, Pages, Components, etc.)
// - /admin/boundary/* - Boundary-specific (Users, Circles, Social, Chat)
router.use('/admin/common', commonAdminRoutes);
router.use('/admin/boundary', boundaryAdminRoutes);

// Legacy routes (backward compatibility) - mounted via the combined adminRoutes
// This maintains all existing /admin/* endpoints
router.use('/admin/applications', applicationRoutes);
router.use('/admin/entities', entityRoutes);
router.use('/admin/preferences', preferencesRoutes);
router.use('/admin', adminUsersRoutes);
router.use('/admin/auth', adminUsersRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/legal', legalAdminRoutes); // Admin legal content management
router.use('/admin/oauth-clients', oauthClientsRoutes); // OAuth client management for SSO Provider
router.use('/audit', auditRoutes);

// Component Studio Routes
router.use('/component-studio', componentStudioRoutes);

// CMS Routes
router.use('/cms', cmsRoutes);
router.use('/cms/marketing', marketingRoutes);
router.use('/cms/localization', localizationRoutes);
router.use('/cms/content', dynamicContentRoutes);
router.use('/cms/versions', versionControlRoutes);

export default router;
