import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface OTPConfig {
  enabled: boolean;
  issuer: string;
  secretLength: number;
  window: number;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
  qrCodeSize: number;
  backupCodesCount: number;
}

interface ManagerSignupConfig {
  enabled: boolean;
  requireApproval: boolean;
  defaultRole: string;
  allowedDomains: string[];
  welcomeEmail: {
    enabled: boolean;
    template: string;
    subject: string;
  };
  autoCreateCircle: boolean;
  circleName: string;
  circleDescription: string;
}

// ============================================================================
// Response Helper
// ============================================================================

const sendResponse = <T>(res: Response, statusCode: number, success: boolean, data?: T, message?: string, error?: string) => {
  const response = { 
    success,
    timestamp: new Date().toISOString()
  };
  if (data !== undefined) (response as any).data = data;
  if (message) (response as any).message = message;
  if (error) (response as any).error = error;
  return res.status(statusCode).json(response);
};

const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, false, undefined, undefined, errors.array()[0].msg);
  }
  next();
};

// ============================================================================
// Routes
// ============================================================================

const router = Router();

/**
 * GET /api/config/otp
 * Get OTP configuration
 */
router.get('/otp', async (req: Request, res: Response) => {
  try {
    // Mock implementation - in real app, get from database or settings
    const otpConfig: OTPConfig = {
      enabled: true,
      issuer: 'Boundary App',
      secretLength: 32,
      window: 1,
      algorithm: 'SHA256',
      digits: 6,
      period: 30,
      qrCodeSize: 200,
      backupCodesCount: 10
    };

    sendResponse(res, 200, true, otpConfig, 'OTP configuration retrieved successfully');
  } catch (error) {
    console.error('Get OTP config error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to get OTP configuration');
  }
});

/**
 * POST /api/config/otp
 * Update OTP configuration
 */
router.post('/otp', [
  body('enabled').optional().isBoolean().withMessage('enabled must be boolean'),
  body('issuer').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Issuer must be 1-100 characters'),
  body('secretLength').optional().isInt({ min: 16, max: 64 }).withMessage('Secret length must be 16-64'),
  body('window').optional().isInt({ min: 1, max: 10 }).withMessage('Window must be 1-10'),
  body('algorithm').optional().isIn(['SHA1', 'SHA256', 'SHA512']).withMessage('Invalid algorithm'),
  body('digits').optional().isInt({ min: 4, max: 8 }).withMessage('Digits must be 4-8'),
  body('period').optional().isInt({ min: 15, max: 300 }).withMessage('Period must be 15-300 seconds'),
  body('qrCodeSize').optional().isInt({ min: 100, max: 500 }).withMessage('QR code size must be 100-500'),
  body('backupCodesCount').optional().isInt({ min: 5, max: 20 }).withMessage('Backup codes count must be 5-20')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const configData = req.body;
    
    // Mock implementation - in real app, update in database
    const updatedConfig: OTPConfig = {
      enabled: configData.enabled !== undefined ? configData.enabled : true,
      issuer: configData.issuer || 'Boundary App',
      secretLength: configData.secretLength || 32,
      window: configData.window || 1,
      algorithm: configData.algorithm || 'SHA256',
      digits: configData.digits || 6,
      period: configData.period || 30,
      qrCodeSize: configData.qrCodeSize || 200,
      backupCodesCount: configData.backupCodesCount || 10
    };

    sendResponse(res, 200, true, updatedConfig, 'OTP configuration updated successfully');
  } catch (error) {
    console.error('Update OTP config error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to update OTP configuration');
  }
});

/**
 * GET /api/config/manager-signup
 * Get manager signup configuration
 */
router.get('/manager-signup', async (req: Request, res: Response) => {
  try {
    // Mock implementation - in real app, get from database or settings
    const managerSignupConfig: ManagerSignupConfig = {
      enabled: true,
      requireApproval: false,
      defaultRole: 'manager',
      allowedDomains: ['boundary.app', 'company.com'],
      welcomeEmail: {
        enabled: true,
        template: 'manager_welcome',
        subject: 'Welcome to Boundary - Manager Account'
      },
      autoCreateCircle: true,
      circleName: 'Management Circle',
      circleDescription: 'Circle for management team collaboration'
    };

    sendResponse(res, 200, true, managerSignupConfig, 'Manager signup configuration retrieved successfully');
  } catch (error) {
    console.error('Get manager signup config error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to get manager signup configuration');
  }
});

/**
 * POST /api/config/manager-signup
 * Update manager signup configuration
 */
router.post('/manager-signup', [
  body('enabled').optional().isBoolean().withMessage('enabled must be boolean'),
  body('requireApproval').optional().isBoolean().withMessage('requireApproval must be boolean'),
  body('defaultRole').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Default role must be 1-50 characters'),
  body('allowedDomains').optional().isArray().withMessage('Allowed domains must be an array'),
  body('welcomeEmail.enabled').optional().isBoolean().withMessage('welcomeEmail.enabled must be boolean'),
  body('welcomeEmail.template').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Template must be 1-100 characters'),
  body('welcomeEmail.subject').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Subject must be 1-200 characters'),
  body('autoCreateCircle').optional().isBoolean().withMessage('autoCreateCircle must be boolean'),
  body('circleName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Circle name must be 1-100 characters'),
  body('circleDescription').optional().trim().isLength({ max: 500 }).withMessage('Circle description too long')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const configData = req.body;
    
    // Mock implementation - in real app, update in database
    const updatedConfig: ManagerSignupConfig = {
      enabled: configData.enabled !== undefined ? configData.enabled : true,
      requireApproval: configData.requireApproval !== undefined ? configData.requireApproval : false,
      defaultRole: configData.defaultRole || 'manager',
      allowedDomains: configData.allowedDomains || ['boundary.app', 'company.com'],
      welcomeEmail: {
        enabled: configData.welcomeEmail?.enabled !== undefined ? configData.welcomeEmail.enabled : true,
        template: configData.welcomeEmail?.template || 'manager_welcome',
        subject: configData.welcomeEmail?.subject || 'Welcome to Boundary - Manager Account'
      },
      autoCreateCircle: configData.autoCreateCircle !== undefined ? configData.autoCreateCircle : true,
      circleName: configData.circleName || 'Management Circle',
      circleDescription: configData.circleDescription || 'Circle for management team collaboration'
    };

    sendResponse(res, 200, true, updatedConfig, 'Manager signup configuration updated successfully');
  } catch (error) {
    console.error('Update manager signup config error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to update manager signup configuration');
  }
});

/**
 * GET /api/app-config/assets/:key
 * Get a branding asset URL by key (e.g. logo_white, logo, splash)
 */
router.get('/assets/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const application = (req as any).application;
    const branding = (application?.branding as any) || {};

    const url =
      branding[`${key}Url`] ||
      branding[key] ||
      (key === 'logo_white' ? (branding.logoWhiteUrl || branding.logoUrl) : undefined) ||
      (key === 'logo_dark'  ? (branding.logoDarkUrl  || branding.logoUrl) : undefined) ||
      (key === 'logo'       ? branding.logoUrl : undefined) ||
      (key === 'splash'     ? branding.splashImageUrl : undefined);

    if (!url) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    return res.json({ asset: { key, name: key, url } });
  } catch (error) {
    console.error('Get asset error:', error);
    return res.status(500).json({ error: 'Failed to get asset' });
  }
});

/**
 * GET /api/v1/app-config/screens/:key
 * Get per-screen config (background, layout) stored as AppSetting key = screen_{key}
 * This is the best-practice CMS pattern: each screen's visual config is an independent
 * AppSetting record, not embedded in the monolithic branding blob.
 *
 * Usage in Boundary App:
 *   const screen = await appConfigService.getScreenConfig('home')
 *   // screen.config.background → BackgroundConfig { type, value, overlayColor, overlayOpacity }
 */
router.get('/screens/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const application = (req as any).application;
    if (!application?.id) {
      return res.status(400).json({ error: 'Application context missing — include X-App-ID or X-App-Slug header' });
    }

    const setting = await prisma.appSetting.findFirst({
      where: { applicationId: application.id, key: `screen_${key}` }
    });

    if (!setting) {
      return res.status(404).json({ error: `Screen config for '${key}' not found` });
    }

    return res.json({
      screen: {
        key,
        name: key,
        type: 'custom',
        config: setting.value,
        version: 1,
      }
    });
  } catch (error) {
    console.error('Get screen config error:', error);
    return res.status(500).json({ error: 'Failed to get screen config' });
  }
});

/**
 * GET /api/v1/app-config/config
 * Returns the full AppConfiguration object consumed by appConfigService.getAppConfig()
 * Merges branding blob + per-screen AppSettings + feature flags into one response.
 *
 * Structure matches the AppConfiguration interface in boundary-app/src/services/appConfigService.ts
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const application = (req as any).application;
    if (!application?.id) {
      return res.status(400).json({ error: 'Application context missing — include X-App-ID or X-App-Slug header' });
    }

    // Load all AppSettings for this application in one query
    const settings = await prisma.appSetting.findMany({
      where: { applicationId: application.id }
    });

    const byKey: Record<string, any> = {};
    for (const s of settings) {
      byKey[s.key] = s.value;
    }

    const branding = byKey['branding'] && typeof byKey['branding'] === 'object' ? byKey['branding'] : {};
    const featureFlags: Record<string, any> = byKey['feature_flags'] && typeof byKey['feature_flags'] === 'object' ? byKey['feature_flags'] : {};

    // Build typed features map from feature_flags AppSetting
    const features: Record<string, { enabled: boolean; rollout: number }> = {};
    for (const [flagKey, value] of Object.entries(featureFlags)) {
      features[flagKey] = { enabled: Boolean(value), rollout: Boolean(value) ? 100 : 0 };
    }

    // Build screens map from screen_* AppSettings
    const screens: Record<string, any> = {};
    for (const [k, value] of Object.entries(byKey)) {
      if (k.startsWith('screen_')) {
        const screenKey = k.slice(7); // strip 'screen_'
        screens[screenKey] = {
          name: screenKey,
          type: 'custom',
          config: value,
          version: 1,
        };
      }
    }

    // Build theme from branding tokens
    const theme = branding.tokens || branding.primaryColor ? {
      key: 'default',
      name: 'Default',
      config: {
        colors: {
          primary: branding.primaryColor?.value || branding.primaryColor || '#3b82f6',
          secondary: branding.secondaryColor?.value || branding.secondaryColor || '#6366f1',
        },
        fonts: {
          primary: branding.primaryFont || 'Inter',
          secondary: branding.secondaryFont || 'Inter',
        },
        spacing: {},
        borderRadius: {},
      },
    } : null;

    const config = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      configuration: branding,
      screens,
      theme,
      features,
      assets: {},
    };

    return res.json(config);
  } catch (error) {
    console.error('Get app config error:', error);
    return res.status(500).json({ error: 'Failed to get app configuration' });
  }
});

export default router;
