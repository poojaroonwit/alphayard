import express, { Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);

/**
 * GET /mobile/branding
 * Get mobile app branding configuration
 */
router.get('/branding', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

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

export default router;
