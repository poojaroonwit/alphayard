import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface AppConfiguration {
  version: string;
  timestamp: string;
  configuration: Record<string, any>;
  screens: Record<string, ScreenConfig>;
  theme: ThemeConfig | null;
  features: Record<string, FeatureConfig>;
  assets: Record<string, AssetInfo[]>;
}

interface ScreenConfig {
  name: string;
  type: 'splash' | 'login' | 'onboarding' | 'home' | 'settings' | 'profile' | 'custom';
  config: any;
  version: number;
}

interface ThemeConfig {
  key: string;
  name: string;
  config: {
    colors: Record<string, string>;
    fonts: Record<string, string>;
    spacing: Record<string, number>;
    borderRadius: Record<string, number>;
  };
}

interface FeatureConfig {
  enabled: boolean;
  rollout: number;
  metadata?: any;
}

interface AssetInfo {
  key: string;
  name: string;
  url: string;
  metadata?: any;
  dimensions?: { width: number; height: number };
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

// ============================================================================
// Routes
// ============================================================================

const router = Router();

/**
 * GET /api/app-config/config
 * Get complete app configuration
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const { platform } = req.query;
    
    // Get active application
    const activeApplication = await prisma.application.findFirst({
      where: { isActive: true },
      include: {
        appSettings: {
          select: {
            key: true,
            value: true
          }
        }
      }
    });

    if (!activeApplication) {
      return sendResponse(res, 404, false, undefined, undefined, 'No active application found');
    }

    // Build configuration from app settings
    const configuration: Record<string, any> = {};
    activeApplication.appSettings.forEach((setting: any) => {
      configuration[setting.key] = setting.value;
    });

    // Get branding configuration
    const branding = activeApplication.branding || {};

    // Build screens configuration
    const screens: Record<string, ScreenConfig> = {
      login: {
        name: 'Login Screen',
        type: 'login',
        config: {
          background: branding.loginBackgroundImage || {
            type: 'gradient',
            gradient: ['#FA7272', '#FFBBB4'],
            overlayOpacity: 0.7
          },
          logoUrl: branding.logoUrl,
          appName: branding.appName || 'Boundary App'
        },
        version: 1
      },
      home: {
        name: 'Home Screen',
        type: 'home',
        config: {
          background: branding.homeBackgroundImage || {
            type: 'gradient',
            gradient: ['#FFFFFF', '#F5F5F5'],
            overlayOpacity: 0.3
          }
        },
        version: 1
      },
      splash: {
        name: 'Splash Screen',
        type: 'splash',
        config: {
          background: branding.splashBackgroundImage || {
            type: 'gradient',
            gradient: ['#FA7272', '#FFBBB4'],
            overlayOpacity: 0.8
          },
          logoUrl: branding.logoUrl,
          appName: branding.appName || 'Boundary App'
        },
        version: 1
      }
    };

    // Build theme configuration
    const theme: ThemeConfig = {
      key: 'default',
      name: 'Default Theme',
      config: {
        colors: {
          primary: branding.primaryColor || '#FA7272',
          secondary: branding.secondaryColor || '#FFD700',
          accent: branding.accentColor || '#FF6B6B',
          background: '#FFFFFF',
          text: '#333333',
          border: '#E0E0E0'
        },
        fonts: {
          primary: branding.fontFamily || 'System',
          secondary: branding.fontFamily || 'System'
        },
        spacing: {
          xs: 4,
          sm: 8,
          md: 16,
          lg: 24,
          xl: 32
        },
        borderRadius: {
          sm: 4,
          md: 8,
          lg: 12,
          xl: 16
        }
      }
    };

    // Build features configuration
    const features: Record<string, FeatureConfig> = {
      social_features: {
        enabled: true,
        rollout: 100
      },
      chat_messaging: {
        enabled: true,
        rollout: 100
      },
      location_sharing: {
        enabled: true,
        rollout: 100
      },
      premium_features: {
        enabled: false,
        rollout: 0
      }
    };

    // Build assets configuration
    const assets: Record<string, AssetInfo[]> = {
      logos: [
        {
          key: 'logo_primary',
          name: 'Primary Logo',
          url: branding.logoUrl || '/assets/logo.png',
          metadata: { type: 'logo', usage: 'primary' }
        },
        {
          key: 'logo_white',
          name: 'White Logo',
          url: branding.logoUrl ? branding.logoUrl.replace('.png', '-white.png') : '/assets/logo-white.png',
          metadata: { type: 'logo', usage: 'white' }
        }
      ],
      onboarding: [
        {
          key: 'onboarding_1',
          name: 'Welcome Screen',
          url: '/assets/onboarding/welcome.png',
          metadata: { type: 'image', screen: 'welcome' }
        },
        {
          key: 'onboarding_2',
          name: 'Features Screen',
          url: '/assets/onboarding/features.png',
          metadata: { type: 'image', screen: 'features' }
        }
      ],
      empty_states: [
        {
          key: 'empty_chats',
          name: 'No Chats',
          url: '/assets/empty/chats.png',
          metadata: { type: 'image', context: 'chats' }
        },
        {
          key: 'empty_circles',
          name: 'No Circles',
          url: '/assets/empty/circles.png',
          metadata: { type: 'image', context: 'circles' }
        }
      ]
    };

    const appConfig: AppConfiguration = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      configuration,
      screens,
      theme,
      features,
      assets
    };

    sendResponse(res, 200, true, appConfig, 'App configuration retrieved successfully');
  } catch (error) {
    console.error('Get app config error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to get app configuration');
  }
});

/**
 * GET /api/app-config/screens
 * Get screen configurations
 */
router.get('/screens', async (req: Request, res: Response) => {
  try {
    const { screenKey } = req.query;
    
    // Get active application
    const activeApplication = await prisma.application.findFirst({
      where: { isActive: true },
      select: { branding: true }
    });

    if (!activeApplication) {
      return sendResponse(res, 404, false, undefined, undefined, 'No active application found');
    }

    const branding = activeApplication.branding || {};

    // Default screen configurations
    const screens: Record<string, ScreenConfig> = {
      login: {
        name: 'Login Screen',
        type: 'login',
        config: {
          background: branding.loginBackgroundImage || {
            type: 'gradient',
            gradient: ['#FA7272', '#FFBBB4'],
            overlayOpacity: 0.7
          },
          logoUrl: branding.logoUrl,
          appName: branding.appName || 'Boundary App'
        },
        version: 1
      },
      welcome: {
        name: 'Welcome Screen',
        type: 'onboarding',
        config: {
          background: branding.welcomeBackgroundImage || {
            type: 'gradient',
            gradient: ['#FA7272', '#FFBBB4'],
            overlayOpacity: 0.6
          },
          title: 'Welcome to Boundary',
          subtitle: 'Connect with your family and friends'
        },
        version: 1
      },
      home: {
        name: 'Home Screen',
        type: 'home',
        config: {
          background: branding.homeBackgroundImage || {
            type: 'gradient',
            gradient: ['#FFFFFF', '#F5F5F5'],
            overlayOpacity: 0.3
          }
        },
        version: 1
      },
      circles: {
        name: 'Circles Screen',
        type: 'custom',
        config: {
          background: branding.circleBackgroundImage || {
            type: 'gradient',
            gradient: ['#FA7272', '#FFBBB4'],
            overlayOpacity: 0.4
          }
        },
        version: 1
      },
      social: {
        name: 'Social Screen',
        type: 'custom',
        config: {
          background: branding.socialBackgroundImage || {
            type: 'gradient',
            gradient: ['#FA7272', '#FFBBB4'],
            overlayOpacity: 0.4
          }
        },
        version: 1
      }
    };

    if (screenKey && screens[screenKey as string]) {
      sendResponse(res, 200, true, screens[screenKey as string], 'Screen configuration retrieved successfully');
    } else {
      sendResponse(res, 200, true, screens, 'All screen configurations retrieved successfully');
    }
  } catch (error) {
    console.error('Get screens error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to get screen configurations');
  }
});

/**
 * GET /api/app-config/theme
 * Get theme configuration
 */
router.get('/theme', async (req: Request, res: Response) => {
  try {
    // Get active application
    const activeApplication = await prisma.application.findFirst({
      where: { isActive: true },
      select: { branding: true }
    });

    if (!activeApplication) {
      return sendResponse(res, 404, false, undefined, undefined, 'No active application found');
    }

    const branding = activeApplication.branding || {};

    const theme: ThemeConfig = {
      key: 'default',
      name: 'Default Theme',
      config: {
        colors: {
          primary: branding.primaryColor || '#FA7272',
          secondary: branding.secondaryColor || '#FFD700',
          accent: branding.accentColor || '#FF6B6B',
          background: '#FFFFFF',
          text: '#333333',
          textSecondary: '#666666',
          border: '#E0E0E0',
          error: '#FF5252',
          success: '#4CAF50',
          warning: '#FF9800'
        },
        fonts: {
          primary: branding.fontFamily || 'System',
          secondary: branding.fontFamily || 'System',
          mono: 'Courier New'
        },
        spacing: {
          xs: 4,
          sm: 8,
          md: 16,
          lg: 24,
          xl: 32,
          xxl: 48
        },
        borderRadius: {
          sm: 4,
          md: 8,
          lg: 12,
          xl: 16,
          full: 9999
        }
      }
    };

    sendResponse(res, 200, true, theme, 'Theme configuration retrieved successfully');
  } catch (error) {
    console.error('Get theme error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to get theme configuration');
  }
});

/**
 * GET /api/app-config/assets
 * Get assets by category
 */
router.get('/assets', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    // Get active application
    const activeApplication = await prisma.application.findFirst({
      where: { isActive: true },
      select: { branding: true }
    });

    if (!activeApplication) {
      return sendResponse(res, 404, false, undefined, undefined, 'No active application found');
    }

    const branding = activeApplication.branding || {};

    const assets: Record<string, AssetInfo[]> = {
      branding: [
        {
          key: 'logo_primary',
          name: 'Primary Logo',
          url: branding.logoUrl || '/assets/logo.png',
          metadata: { type: 'logo', usage: 'primary' }
        },
        {
          key: 'logo_white',
          name: 'White Logo',
          url: branding.logoUrl ? branding.logoUrl.replace('.png', '-white.png') : '/assets/logo-white.png',
          metadata: { type: 'logo', usage: 'white' }
        },
        {
          key: 'favicon',
          name: 'Favicon',
          url: '/assets/favicon.ico',
          metadata: { type: 'icon', usage: 'favicon' }
        }
      ],
      onboarding: [
        {
          key: 'onboarding_1',
          name: 'Welcome Screen',
          url: '/assets/onboarding/welcome.png',
          metadata: { type: 'image', screen: 'welcome' }
        },
        {
          key: 'onboarding_2',
          name: 'Features Screen',
          url: '/assets/onboarding/features.png',
          metadata: { type: 'image', screen: 'features' }
        },
        {
          key: 'onboarding_3',
          name: 'Get Started',
          url: '/assets/onboarding/get-started.png',
          metadata: { type: 'image', screen: 'get-started' }
        }
      ],
      empty_states: [
        {
          key: 'empty_chats',
          name: 'No Chats',
          url: '/assets/empty/chats.png',
          metadata: { type: 'image', context: 'chats' }
        },
        {
          key: 'empty_circles',
          name: 'No Circles',
          url: '/assets/empty/circles.png',
          metadata: { type: 'image', context: 'circles' }
        },
        {
          key: 'empty_notifications',
          name: 'No Notifications',
          url: '/assets/empty/notifications.png',
          metadata: { type: 'image', context: 'notifications' }
        }
      ]
    };

    if (category && assets[category as string]) {
      sendResponse(res, 200, true, assets[category as string], `Assets for ${category} retrieved successfully`);
    } else {
      sendResponse(res, 200, true, assets, 'All assets retrieved successfully');
    }
  } catch (error) {
    console.error('Get assets error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to get assets');
  }
});

export default router;
