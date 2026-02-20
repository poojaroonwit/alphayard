import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

// Admin Routes - Modular Structure
// Common routes (shared across all apps) - NO boundary-specific routes
import adminRoutes from '../admin/index';
import commonAdminRoutes from '../admin/common';

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

// =============================================
// Admin Routes - Modular Structure
// =============================================

// New modular structure:
// - /admin/common/* - Shared across all apps (CMS, Pages, Components, etc.)
router.use('/admin/common', commonAdminRoutes);

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
