import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateToken } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken as any);

// Get all notifications for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.json({ success: true, data: [] });
    }

    const result = await prisma.$queryRaw<any[]>`
      SELECT id, user_id, type, title, message, data, status, 
             action_url, sender_id, sender_name, metadata,
             created_at as timestamp, scheduled_at
      FROM core.notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const notifications = result.map(row => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data,
      status: row.status,
      actionUrl: row.action_url,
      senderId: row.sender_id,
      senderName: row.sender_name,
      metadata: row.metadata,
      timestamp: row.timestamp,
      scheduledAt: row.scheduled_at,
    }));

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.json({ success: true, data: [] });
  }
});

// Get unread count
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.json({ success: true, data: { count: 0 } });
    }

    const result = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM core.notifications
      WHERE user_id = ${userId} AND status = 'unread'
    `;

    res.json({ success: true, data: { count: parseInt(result[0]?.count || '0') } });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.json({ success: true, data: { count: 0 } });
  }
});

// Get notification settings
router.get('/settings/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const result = await prisma.$queryRaw<any[]>`
      SELECT settings
      FROM user_notification_settings
      WHERE user_id = ${userId}
    `;

    if (result.length > 0) {
      return res.json({ success: true, data: result[0].settings });
    }

    // Return default settings
    res.json({
      success: true,
      data: {
        pushEnabled: true,
        emailEnabled: false,
        smsEnabled: false,
        types: {
          info: true,
          success: true,
          warning: true,
          error: true,
          system: true,
          Circle: true,
          finance: true,
          health: true
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.json({
      success: true,
      data: {
        pushEnabled: true,
        emailEnabled: false,
        smsEnabled: false,
        types: {
          info: true,
          success: true,
          warning: true,
          error: true,
          system: true,
          Circle: true,
          finance: true,
          health: true
        }
      }
    });
  }
});

// Update notification settings
router.put('/settings/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const settings = req.body;

    await prisma.$executeRaw`
      INSERT INTO user_notification_settings (user_id, settings, updated_at)
      VALUES (${userId}, ${JSON.stringify(settings)}::jsonb, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET settings = ${JSON.stringify(settings)}::jsonb, updated_at = NOW()
    `;

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// Create a new notification
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, type, title, message, data, actionUrl, metadata } = req.body;
    const targetUserId = userId || (req as any).user?.id;
    const id = uuidv4();

    await prisma.$executeRaw`
      INSERT INTO core.notifications (id, user_id, type, title, message, data, status, action_url, metadata, created_at)
      VALUES (${id}, ${targetUserId}, ${type || 'info'}, ${title}, ${message}, ${data ? JSON.stringify(data) : null}::jsonb, 'unread', ${actionUrl}, ${metadata ? JSON.stringify(metadata) : null}::jsonb, NOW())
    `;

    res.json({
      success: true,
      data: {
        id,
        userId: targetUserId,
        type: type || 'info',
        title,
        message,
        data,
        status: 'unread',
        actionUrl,
        metadata,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, error: 'Failed to create notification' });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    await prisma.$executeRaw`
      UPDATE core.notifications
      SET status = 'read', updated_at = NOW()
      WHERE id = ${notificationId}
    `;

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || (req as any).user?.id;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }

    await prisma.$executeRaw`
      UPDATE core.notifications
      SET status = 'read', updated_at = NOW()
      WHERE user_id = ${userId}::uuid AND status = 'unread'
    `;

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark all as read' });
  }
});

// Delete notification
router.delete('/:notificationId', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    await prisma.$executeRaw`
      DELETE FROM core.notifications
      WHERE id = ${notificationId}
    `;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

// Delete all notifications
router.delete('/all', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId || (req as any).user?.id;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }

    await prisma.$executeRaw`
      DELETE FROM core.notifications
      WHERE user_id = ${userId}::uuid
    `;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to delete all notifications' });
  }
});

// Delete old notifications
router.delete('/old', async (req: Request, res: Response) => {
  try {
    const { userId, days = 30 } = req.query;
    const targetUserId = userId || (req as any).user?.id;

    if (!targetUserId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }

    await prisma.$executeRaw`
      DELETE FROM core.notifications
      WHERE user_id = ${targetUserId} AND created_at < NOW() - INTERVAL '1 day' * ${days}
    `;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to delete old notifications' });
  }
});

// Register push token
router.post('/register-token', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { token, platform, deviceInfo } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ success: false, error: 'User ID and token required' });
    }

    // Store push token in user_push_tokens table
    await prisma.$executeRaw`
      INSERT INTO core.user_push_tokens (user_id, token, platform, device_info, created_at, updated_at)
      VALUES (${userId}, ${token}, ${platform}, ${deviceInfo ? JSON.stringify(deviceInfo) : null}::jsonb, NOW(), NOW())
      ON CONFLICT (user_id, token)
      DO UPDATE SET platform = ${platform}, device_info = ${deviceInfo ? JSON.stringify(deviceInfo) : null}::jsonb, updated_at = NOW()
    `;

    res.json({ success: true });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ success: false, error: 'Failed to register token' });
  }
});

// Unregister push token
router.post('/unregister-token', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token required' });
    }

    if (userId) {
      await prisma.$executeRaw`
        DELETE FROM core.user_push_tokens
        WHERE user_id = ${userId} AND token = ${token}
      `;
    } else {
      await prisma.$executeRaw`
        DELETE FROM core.user_push_tokens
        WHERE token = ${token}
      `;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error unregistering push token:', error);
    res.status(500).json({ success: false, error: 'Failed to unregister token' });
  }
});

// Schedule notification
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { userId, type, title, message, scheduledAt, data } = req.body;
    const targetUserId = userId || (req as any).user?.id;
    const id = uuidv4();

    await prisma.$executeRaw`
      INSERT INTO core.notifications (id, user_id, type, title, message, data, status, scheduled_at, created_at)
      VALUES (${id}, ${targetUserId}, ${type || 'info'}, ${title}, ${message}, ${data ? JSON.stringify(data) : null}::jsonb, 'scheduled', ${scheduledAt}, NOW())
    `;

    res.json({
      success: true,
      data: {
        id,
        userId: targetUserId,
        type: type || 'info',
        title,
        message,
        data,
        status: 'scheduled',
        scheduledAt,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
    res.status(500).json({ success: false, error: 'Failed to schedule notification' });
  }
});

// Cancel scheduled notification
router.delete('/schedule/:notificationId', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    await prisma.$executeRaw`
      DELETE FROM core.notifications
      WHERE id = ${notificationId} AND status = 'scheduled'
    `;

    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling scheduled notification:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel scheduled notification' });
  }
});

// Send notification to all circle members
router.post('/circle', async (req: Request, res: Response) => {
  try {
    const { circleId, type, title, message, data } = req.body;
    const senderId = (req as any).user?.id;

    // Get all circle members
    const membersResult = await prisma.$queryRaw<any[]>`
      SELECT user_id FROM boundary.circle_members WHERE circle_id = ${circleId}
    `;

    const notificationIds: string[] = [];

    // Create notification for each member
    for (const member of membersResult) {
      if (member.user_id !== senderId) {
        const id = uuidv4();
        notificationIds.push(id);
        
        await prisma.$executeRaw`
          INSERT INTO core.notifications (id, user_id, type, title, message, data, status, sender_id, created_at)
          VALUES (${id}, ${member.user_id}, ${type || 'Circle'}, ${title}, ${message}, ${data ? JSON.stringify(data) : null}::jsonb, 'unread', ${senderId}, NOW())
        `;
      }
    }

    res.json({ success: true, data: { notificationIds, recipientCount: notificationIds.length } });
  } catch (error) {
    console.error('Error sending circle notification:', error);
    res.status(500).json({ success: false, error: 'Failed to send circle notification' });
  }
});

export default router;
