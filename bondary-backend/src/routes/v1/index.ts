import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

// OAuth / SSO Provider Routes
import oauthRoutes from '../oauth';

// Mobile Routes
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
import galleryRoutes from '../mobile/galleryRoutes';
import legalRoutes from '../mobile/legal';
import identityRoutes from '../mobile/identity';
import userHealthRoutes from '../mobile/userHealth';
import mobileRoutes from '../mobile/mobileRoutes';
import brandingRoutes from '../mobile/brandingRoutes';
import marketRoutes from '../mobile/marketRoutes';
import appRoutes from '../mobile/appRoutes';
import helpRoutes from '../mobile/helpRoutes';
import feedbackRoutes from '../mobile/feedbackRoutes';

// Page Builder Routes
import pageBuilderRoutes from '../pageBuilderRoutes';

import circleTypeRoutes from '../mobile/circleTypeRoutes';
import galleryRoutes from '../mobile/galleryRoutes';
import expensesRoutes from '../mobile/expensesRoutes';

// App Configuration Routes
import appConfigRoutes from '../appConfigRoutes';
import workingConfigRoutes from '../admin/workingConfigRoutes';

// Mobile Authentication Routes
import mobileAuthRoutes from '../mobile/authRoutes';

// Admin Routes - Only Boundary-specific routes
import boundaryAdminRoutes from '../admin/boundary';
import adminRoutes from './admin';
import simpleConfigRoutes from '../admin/simpleConfigRoutes'; // Simple version for testing

const router = Router();

// =============================================
// OAuth 2.0 / OpenID Connect (SSO Provider)
// =============================================
router.use('/oauth', oauthRoutes);
// OIDC Discovery at standard path
router.use('/.well-known', oauthRoutes);

// Mobile / Core routes
router.use('/auth', authRoutes);
router.use('/mobile-auth', mobileAuthRoutes); // Mobile app authentication
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
router.use('/mobile', brandingRoutes); // Mobile app branding and configuration
router.use('/market', marketRoutes); // Marketplace: second-hand, services, events
router.use('/app', appRoutes); // App information: info, version, features
router.use('/help', helpRoutes); // Help system: FAQ, support
router.use('/feedback', feedbackRoutes); // Feedback system: general feedback, bug reports

// Page Builder Routes
router.use('/page-builder', pageBuilderRoutes); // CMS page builder

// App Configuration Routes
router.use('/app-config', appConfigRoutes); // Mobile app configuration
router.use('/admin/config', workingConfigRoutes); // Working admin config routes
router.use('/config', configRoutes); // Admin configuration
router.use('/admin/config', simpleConfigRoutes); // Use simplified config routes to avoid auth issues

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

router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/shopping', shoppingRoutes);
router.use('/health', userHealthRoutes);
router.use('/mobile', mobileRoutes);

// =============================================
// Admin Routes - Modular Structure
// =============================================

// New modular structure:
// - /admin/common/* - Shared across all apps (CMS, Pages, Components, etc.)
// - /admin/boundary/* - Boundary-specific (Users, Circles, Social, Chat)
// router.use('/admin/common', commonAdminRoutes);
router.use('/admin/boundary', boundaryAdminRoutes);

// Mount the complete admin routes (includes config, applications, etc.)
router.use('/admin', adminRoutes);

// Legacy routes for backward compatibility
router.use('/admin/applications', adminRoutes);

// Legacy routes (backward compatibility) - mounted via the combined adminRoutes
// This maintains all existing /admin/* endpoints
// Note: Many of these routes are not yet implemented - commented out to prevent errors
// router.use('/admin/applications', applicationRoutes);
// router.use('/admin/entities', entityRoutes);
// router.use('/admin/preferences', preferencesRoutes);
// router.use('/admin', adminUsersRoutes);
// router.use('/admin/auth', adminUsersRoutes);
// router.use('/admin', adminRoutes);
// router.use('/admin/legal', legalAdminRoutes); // Admin legal content management
// router.use('/admin/oauth-clients', oauthClientsRoutes); // OAuth client management for SSO Provider
// router.use('/audit', auditRoutes);

// Component Studio Routes
// router.use('/component-studio', componentStudioRoutes);

// CMS Routes
// router.use('/cms', cmsRoutes);
// router.use('/cms/marketing', marketingRoutes);
// router.use('/cms/localization', localizationRoutes);
// router.use('/cms/content', dynamicContentRoutes);
// router.use('/cms/versions', versionControlRoutes);

export default router;
