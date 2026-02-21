import express, { Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);

/**
 * GET /app/info
 * Get application information
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Return app information
    res.json({
      success: true,
      app: {
        name: 'Boundary',
        version: '1.0.0',
        buildNumber: '1',
        environment: process.env.NODE_ENV || 'development',
        platform: 'mobile',
        description: 'Circle Safety & Communication App'
      },
      message: 'App info endpoint'
    });
  } catch (error: any) {
    console.error('Error fetching app info:', error);
    res.status(500).json({ error: 'Failed to fetch app info' });
  }
});

/**
 * GET /app/version
 * Get application version
 */
router.get('/version', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Return version information
    res.json({
      success: true,
      version: {
        current: '1.0.0',
        build: '1',
        releaseDate: '2024-01-01',
        updateAvailable: false,
        minimumRequired: '1.0.0'
      },
      message: 'App version endpoint'
    });
  } catch (error: any) {
    console.error('Error fetching app version:', error);
    res.status(500).json({ error: 'Failed to fetch app version' });
  }
});

/**
 * GET /app/features
 * Get available features
 */
router.get('/features', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Return available features
    res.json({
      success: true,
      features: [
        {
          id: 'circles',
          name: 'Circles',
          description: 'Family and friend circles',
          enabled: true
        },
        {
          id: 'chat',
          name: 'Chat',
          description: 'Group and private messaging',
          enabled: true
        },
        {
          id: 'location',
          name: 'Location Sharing',
          description: 'Real-time location tracking',
          enabled: true
        },
        {
          id: 'safety',
          name: 'Safety Alerts',
          description: 'Emergency alerts and safety features',
          enabled: true
        },
        {
          id: 'calendar',
          name: 'Calendar',
          description: 'Shared calendar and events',
          enabled: true
        },
        {
          id: 'gallery',
          name: 'Gallery',
          description: 'Photo and video sharing',
          enabled: true
        },
        {
          id: 'notes',
          name: 'Notes',
          description: 'Shared notes and reminders',
          enabled: true
        },
        {
          id: 'shopping',
          name: 'Shopping Lists',
          description: 'Shared shopping lists',
          enabled: true
        },
        {
          id: 'expenses',
          name: 'Expenses',
          description: 'Track shared expenses',
          enabled: true
        }
      ],
      message: 'App features endpoint'
    });
  } catch (error: any) {
    console.error('Error fetching app features:', error);
    res.status(500).json({ error: 'Failed to fetch app features' });
  }
});

export default router;
