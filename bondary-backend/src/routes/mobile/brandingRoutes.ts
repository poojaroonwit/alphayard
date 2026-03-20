import express, { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

const router = express.Router();

/**
 * GET /mobile/branding
 * Get mobile app branding configuration — PUBLIC (used before login)
 */
router.get('/branding', async (req: Request, res: Response) => {
  try {
    // Return branding configuration
    const branding = {
      mobileAppName: 'Boundary',
      logoUrl: 'https://example.com/logo.png',
      iconUrl: 'https://example.com/icon.png',
      analytics: {
        sentryDsn: process.env.SENTRY_DSN || null,
        mixpanelToken: process.env.MIXPANEL_TOKEN || null,
        googleAnalyticsId: process.env.GA_TRACKING_ID || null,
        enableDebugLogs: process.env.NODE_ENV === 'development',
      },
      legal: {
        privacyPolicyUrl: 'https://boundary.com/privacy',
        termsOfServiceUrl: 'https://boundary.com/terms',
        cookiePolicyUrl: 'https://boundary.com/cookies',
        dataDeletionUrl: 'https://boundary.com/delete-data',
        dataRequestEmail: 'privacy@boundary.com',
      },
      app: {
        version: '1.0.0',
        buildNumber: '1',
        environment: process.env.NODE_ENV || 'development',
        platform: 'mobile',
        supportedFeatures: [
          'circles',
          'chat',
          'location',
          'safety',
          'calendar',
          'gallery',
          'notes',
          'shopping',
          'expenses'
        ]
      },
      screens: [
        {
          id: 'home',
          name: 'Home',
          background: '#FFFFFF',
          resizeMode: 'cover',
          description: 'Main home screen'
        },
        {
          id: 'about',
          name: 'About',
          background: '#F8F9FA',
          resizeMode: 'cover',
          description: 'About Boundary app'
        }
      ],
      categories: [
        {
          id: 'main',
          name: 'Main',
          description: 'Main app features',
          icon: 'home',
          components: []
        }
      ]
    };

    res.json({
      success: true,
      branding
    });
  } catch (error: any) {
    console.error('Error fetching mobile branding:', error);
    res.status(500).json({ error: 'Failed to fetch branding' });
  }
});

/**
 * GET /mobile/auth/providers
 * Get enabled SSO/OAuth providers — PUBLIC (used on login screen)
 */
router.get('/auth/providers', async (req: Request, res: Response) => {
  try {
    let providers: any[] = [];

    try {
      const dbProviders = await prisma.sSOProvider.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          displayName: true,
          providerType: true,
          iconUrl: true,
          buttonColor: true,
          displayOrder: true,
        },
        orderBy: { displayOrder: 'asc' },
      });
      providers = dbProviders;
    } catch {
      // DB may not have this table yet — return empty list
    }

    res.json({ success: true, providers });
  } catch (error: any) {
    console.error('Error fetching auth providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

export default router;
