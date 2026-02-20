import express, { Response } from 'express';
import { body, query as queryParam } from 'express-validator';
import { emailService } from '../../services/emailService';
import { authenticateToken, requireCircleMember } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import circleService from '../../services/circleService';
import chatService from '../../services/chatService';
import entityService from '../../services/EntityService';

const router = express.Router();

// Helper to check online status (placeholder)
const isUserOnline = (_userId: string): boolean => false;

// All routes require authentication
router.use(authenticateToken as any);

// List all circles (admin endpoint)
router.get('/list-all', async (req: any, res: Response) => {
  try {
    const result = await entityService.queryEntities('circle');
    const circles = result.entities.map(e => ({
      id: e.id,
      name: e.attributes.name,
      type: e.attributes.type,
      description: e.attributes.description,
      ownerId: e.ownerId,
      createdAt: e.createdAt,
      memberCount: 0 // Will be handled by a more robust analytics service later
    }));
    
    res.json({ circles });
  } catch (error) {
    console.error('List all circles error:', error);
    res.status(500).json({ error: 'Failed to fetch circles' });
  }
});

// Create new circle
router.post('/', [
  body('name').trim().isLength({ min: 1 }).withMessage('Circle name is required'),
  body('description').optional().trim(),
  body('circleTypeId').optional().isUUID(),
  body('type').optional().trim(),
  body('settings').optional().isObject(),
], validateRequest, async (req: any, res: Response) => {
  try {
    const { name, description, settings, circleTypeId, type } = req.body;
    const userId = req.user.id;

    const circle = await circleService.createCircle({
        name,
        description,
        owner_id: userId,
        type: type || 'circle',
        settings: settings || {},
        circle_type_id: circleTypeId
    });

    res.status(201).json({
      message: 'Circle created successfully',
      circle: {
        id: circle.id,
        name: circle.attributes.name,
        description: circle.attributes.description,
        ownerId: circle.ownerId,
        inviteCode: circle.attributes.invite_code,
        settings: circle.attributes.settings,
        createdAt: circle.createdAt,
        updatedAt: circle.updatedAt,
        members: []
      }
    });

  } catch (error) {
    console.error('Create circle error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Join circle by invite code
router.post('/join', [
  body('inviteCode').trim().isLength({ min: 1 }).withMessage('Invite code is required'),
], validateRequest, async (req: any, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    // Find circle by invite code in Unified Entities
    const result = await entityService.queryEntities('circle', {
        filters: { invite_code: inviteCode.toUpperCase() }
    } as any);

    if (result.entities.length === 0) {
      res.status(404).json({
        error: 'Circle not found',
        message: 'Invalid invite code'
      });
      return;
    }

    const circle = result.entities[0];

    // Check if user is already a member using relations
    const isMember = await entityService.hasRelation(userId, circle.id, 'member_of');

    if (isMember) {
      res.json({
        message: 'You are already a member of this circle',
        circle: {
          id: circle.id,
          name: circle.attributes.name
        }
      });
      return;
    }

    // Add user as member
    await circleService.addMember(circle.id, userId);

    res.json({
      message: 'Successfully joined the circle',
      circle: {
        id: circle.id,
        name: circle.attributes.name
      }
    });

  } catch (error) {
    console.error('Join circle error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Leave a circle
router.post('/leave', [
  body('circleId').isUUID().withMessage('Valid circle ID is required'),
], validateRequest, async (req: any, res: Response) => {
  try {
    const { circleId } = req.body;
    const userId = req.user.id;

    // Check if member exists
    const isMember = await entityService.hasRelation(userId, circleId, 'member_of');

    if (!isMember) {
      res.status(404).json({
        error: 'Not a member',
        message: 'You are not a member of this circle'
      });
      return;
    }

    await circleService.removeMember(circleId, userId);

    res.json({
      message: 'Successfully left the circle'
    });
  } catch (error) {
    console.error('Leave circle error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// List all circles user belongs to
router.get('/', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    // Special handling for hardcoded admin user
    if (userId === 'admin') {
      res.json({ circles: [], count: 0 });
      return;
    }

    const circles = await circleService.getCirclesForUser(userId);

    const formattedCircles = circles.map(c => ({
      id: c.id,
      name: c.attributes.name,
      description: c.attributes.description,
      type: c.attributes.type,
      inviteCode: c.attributes.invite_code,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      ownerId: c.ownerId,
      membersCount: 0 // Analytics stub
    }));

    res.json({
      circles: formattedCircles,
      count: formattedCircles.length
    });

  } catch (error) {
    console.error('List circles error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Get user's circle details
router.get('/my-circle', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const circles = await circleService.getCirclesForUser(userId);

    if (circles.length === 0) {
      return res.json({
        circle: null,
        message: 'User does not belong to any circle yet'
      });
    }

    const circle = circles[0];
    const members = await circleService.getMembers(circle.id);

    // Get stats from specialized services
    const chatStats = await chatService.getChatStats(circle.id);
    const totalMessages = chatStats.reduce((sum, s) => sum + s.messageCount, 0);
    
    res.json({
      circle: {
        id: circle.id,
        name: circle.attributes.name,
        type: circle.attributes.type,
        description: circle.attributes.description,
        inviteCode: circle.attributes.invite_code,
        createdAt: circle.createdAt,
        ownerId: circle.ownerId,
        settings: circle.attributes.settings,
        members: members.map(m => ({
          id: m.id,
          firstName: m.attributes.firstName || m.attributes.name || 'Unknown',
          lastName: m.attributes.lastName || '',
          email: m.attributes.email,
          avatar: m.attributes.avatarUrl,
          role: m.relation_metadata?.role || 'member',
          joinedAt: m.joined_at,
          isOnline: false
        })),
        stats: {
          totalMessages,
          totalLocations: 0,
          totalMembers: members.length
        }
      }
    });

  } catch (error) {
    console.error('Get my-circle error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Update circle details
router.put('/my-circle', [
  requireCircleMember as any,
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('settings').optional().isObject()
], validateRequest, async (req: any, res: Response) => {
  try {
    const circleId = req.circleId;
    const { name, description, settings } = req.body;

    const updated = await circleService.updateCircle(circleId, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(settings && { settings })
    });

    res.json({
      message: 'Circle updated successfully',
      circle: updated
    });
  } catch (error) {
    console.error('Update circle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite member to circle
router.post('/invite', [
  requireCircleMember as any,
  body('email').isEmail().normalizeEmail(),
  body('message').optional().trim()
], validateRequest, async (req: any, res: Response) => {
  try {
    const circleId = req.circleId;
    const { email, message } = req.body;

    // Check if invitation already exists
    const existing = await circleService.getInvitations(circleId);
    if (existing.some(i => i.email === email && i.status === 'pending')) {
        return res.status(400).json({ error: 'Invitation already sent' });
    }

    const invitation = await circleService.createInvitation(circleId, email, req.user.id, message);

    // Send email logic (simplified/delegated)
    try {
        const circle = await circleService.getCircleById(circleId);
        await emailService.sendCircleInvitation({
            inviterName: req.user.name || req.user.email,
            circleName: circle?.attributes.name || 'A Circle',
            inviteCode: circle?.attributes.invite_code || '',
            inviteUrl: `${process.env.FRONTEND_URL}/join?code=${circle?.attributes.invite_code}`,
            message
        }, email);
    } catch (e) {
        console.warn('Email sending failed, but invitation created');
    }

    res.status(201).json({ message: 'Invitation sent', invitation });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending invitations for the authenticated user
router.get('/invitations/pending', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const email = req.user.email;
    const invitations = await circleService.getPendingInvitationsForUser(email);
    res.json({ invitations });
  } catch (error) {
    console.error('Get pending invitations error:', error);
    res.status(500).json({ error: 'Failed to fetch pending invitations' });
  }
});

// Get circle invitations
router.get('/invitations', requireCircleMember as any, async (req: any, res: Response) => {
  try {
    const invitations = await circleService.getInvitations(req.circleId);
    res.json({ invitations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// Accept invitation
router.post('/invitations/:id/accept', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const invitation = await circleService.getInvitationById(req.params.id);
    if (!invitation || invitation.status !== 'pending') {
        return res.status(404).json({ error: 'Invitation not found or inactive' });
    }

    await circleService.addMember(invitation.circle_id, req.user.id);
    await circleService.updateInvitationStatus(invitation.id, 'accepted');

    res.json({ success: true, circleId: invitation.circle_id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// Remove member
router.delete('/:circleId/members/:memberId', requireCircleMember as any, async (req: any, res: Response) => {
  try {
    const { circleId, memberId } = req.params;
    if (req.circleRole !== 'owner' && req.circleRole !== 'admin') {
        return res.status(403).json({ error: 'Permission denied' });
    }

    await circleService.removeMember(circleId, memberId);
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Deprecated Shadow Routes
router.all(['/shopping-list', '/shopping-list/*', '/events', '/:circleId/events'], (req, res) => {
    res.status(410).json({
        error: 'Gone',
        message: 'This endpoint has been consolidated into specialized routers (/shopping, /calendar, /chat).'
    });
});

export default router;


