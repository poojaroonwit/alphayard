import express, { Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);

/**
 * GET /help/faq
 * Get frequently asked questions
 */
router.get('/faq', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Return FAQ items
    res.json({
      success: true,
      faq: [
        {
          id: '1',
          question: 'How do I create a circle?',
          answer: 'You can create a circle by going to the Circles tab and tapping the "Create Circle" button.',
          category: 'circles'
        },
        {
          id: '2',
          question: 'How do I share my location?',
          answer: 'Go to Settings > Location Sharing and enable location sharing for your circles.',
          category: 'location'
        },
        {
          id: '3',
          question: 'How do I send an emergency alert?',
          answer: 'Tap the SOS button in the app or use the emergency alert feature in the Safety tab.',
          category: 'safety'
        },
        {
          id: '4',
          question: 'How do I invite members to my circle?',
          answer: 'Go to your circle settings and use the "Invite Members" option to send invitations.',
          category: 'circles'
        }
      ],
      categories: ['circles', 'location', 'safety', 'chat', 'general'],
      message: 'FAQ endpoint'
    });
  } catch (error: any) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ' });
  }
});

/**
 * GET /help/support
 * Get support information
 */
router.get('/support', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Return support information
    res.json({
      success: true,
      support: {
        email: 'support@boundary.com',
        phone: '1-800-BOUNDARY',
        website: 'https://boundary.com/support',
        helpCenter: 'https://help.boundary.com',
        community: 'https://community.boundary.com',
        documentation: 'https://docs.boundary.com',
        liveChat: {
          available: true,
          hours: '9 AM - 6 PM EST'
        },
        responseTime: 'Usually within 24 hours'
      },
      message: 'Support endpoint'
    });
  } catch (error: any) {
    console.error('Error fetching support info:', error);
    res.status(500).json({ error: 'Failed to fetch support info' });
  }
});

export default router;
