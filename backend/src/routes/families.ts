import express, { Response } from 'express'; // refresh

import { body, query as queryParam } from 'express-validator'; // Rename express-validator query
import { emailService } from '../services/emailService';
import { authenticateToken, requireFamilyMember } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { query as dbQuery } from '../config/database'; // Rename DB query

// Online user tracking is currently handled inside the socket service;
// the isUserOnline helper has been removed to simplify typings.
const isUserOnline = (_userId: string): boolean => false;

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);

// List all families user belongs to
router.get('/', authenticateToken as any, async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    // Get all families the user is a member of with details
    const { rows: memberships } = await dbQuery(`
      SELECT 
        fm.family_id,
        fm.role,
        fm.joined_at,
        f.id,
        f.name,
        f.type,
        f.description,
        f.invite_code,
        f.created_at,
        f.updated_at,
        f.owner_id,
        (SELECT count(*) FROM family_members WHERE family_id = f.id) as member_count
      FROM family_members fm
      JOIN families f ON fm.family_id = f.id
      WHERE fm.user_id = $1
    `, [userId]);

    const families = memberships.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      type: m.type,
      inviteCode: m.invite_code,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      ownerId: m.owner_id,
      role: m.role,
      joinedAt: m.joined_at,
      membersCount: parseInt(m.member_count) || 0
    }));

    res.json({
      families,
      count: families.length
    });

  } catch (error) {
    console.error('List families error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
    return;
  }
});

// Get user's hourse
router.get('/my-hourse', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    // First, find the user's family
    const { rows: memberships } = await dbQuery(
      'SELECT family_id FROM family_members WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (memberships.length === 0) {
      return res.json({
        hourse: null,
        message: 'User does not belong to any hourse yet'
      });
    }

    const familyId = memberships[0].family_id;

    // Get hourse details
    const { rows: families } = await dbQuery(
      'SELECT id, name, type, description, invite_code, created_at, owner_id FROM families WHERE id = $1',
      [familyId]
    );

    if (families.length === 0) {
      return res.json({
        hourse: null,
        message: 'hourse not found'
      });
    }

    const hourse = families[0];

    // Get hourse members with user details
    const { rows: members } = await dbQuery(`
      SELECT 
        fm.user_id,
        fm.role,
        fm.joined_at,
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.avatar_url,
        p.full_name
      FROM family_members fm
      LEFT JOIN public.users u ON fm.user_id = u.id -- using public.users now
      LEFT JOIN public.profiles p ON fm.user_id = p.id
      WHERE fm.family_id = $1
    `, [familyId]);

    // Get hourse stats
    const { rows: msgStats } = await dbQuery(
      'SELECT count(*) FROM messages WHERE family_id = $1',
      [familyId]
    );
    const { rows: locStats } = await dbQuery(
      'SELECT count(*) FROM location_history WHERE family_id = $1',
      [familyId]
    );

    res.json({
      hourse: {
        ...hourse,
        members: members.map(member => ({
          id: member.user_id,
          firstName: member.first_name || member.full_name?.split(' ')[0],
          lastName: member.last_name || member.full_name?.split(' ').slice(1).join(' '),
          email: member.email,
          avatar: member.avatar_url,
          role: member.role,
          joinedAt: member.joined_at,
          isOnline: isUserOnline(member.user_id),
          notifications: 0 // Mock notification count
        })),
        stats: {
          totalMessages: parseInt(msgStats[0].count) || 0,
          totalLocations: parseInt(locStats[0].count) || 0,
          totalMembers: members.length
        }
      }
    });

  } catch (error) {
    console.error('Get hourse error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Shopping List Routes - Moved up to avoid collision with /:familyId
// Get shopping list items for hourse
router.get('/shopping-list', requireFamilyMember as any, async (req: any, res: Response) => {
  try {
    const familyId = req.familyId;

    const { rows: items } = await dbQuery(`
      SELECT 
        si.id, si.family_id, si.item, si.quantity, si.category, si.completed, si.list_name, si.created_by, si.created_at, si.updated_at,
        u.first_name, u.last_name
      FROM shopping_items si
      LEFT JOIN public.users u ON si.created_by = u.id
      WHERE si.family_id = $1
      ORDER BY si.created_at DESC
    `, [familyId]);

    res.json({
      items: items.map(item => ({
        id: item.id,
        item: item.item,
        quantity: item.quantity || '1',
        category: item.category || 'general',
        completed: item.completed || false,
        list: item.list_name || 'Groceries',
        createdBy: item.first_name ?
          `${item.first_name} ${item.last_name}` : 'Unknown',
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))
    });

  } catch (error) {
    console.error('Get shopping list error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Create shopping list item
router.post('/shopping-list', [
  requireFamilyMember as any,
  body('item').isString().trim().isLength({ min: 1 }),
  body('quantity').optional().isString(),
  body('category').optional().isString(),
  body('list').optional().isString(),
], validateRequest, async (req: any, res: Response) => {
  try {
    const familyId = req.familyId;
    const { item, quantity, category, list } = req.body;

    const { rows: newItem } = await dbQuery(`
      INSERT INTO shopping_items (family_id, item, quantity, category, list_name, completed, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, false, $6, NOW(), NOW())
      RETURNING *
    `, [
      familyId,
      item.trim(),
      quantity || '1',
      category || 'general',
      list || 'Groceries',
      req.user.id
    ]);

    res.status(201).json({
      item: {
        id: newItem[0].id,
        item: newItem[0].item,
        quantity: newItem[0].quantity,
        category: newItem[0].category,
        completed: newItem[0].completed,
        list: newItem[0].list_name,
        createdAt: newItem[0].created_at,
        updatedAt: newItem[0].updated_at
      }
    });

  } catch (error) {
    console.error('Create shopping item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});


// Get family by ID (for admin or if user is a member)
router.get('/:familyId', authenticateToken as any, async (req: any, res: Response): Promise<void> => {
  try {
    const { familyId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.type === 'admin';

    // If not admin, verify user is a member
    if (!isAdmin) {
      const { rows } = await dbQuery(
        'SELECT 1 FROM family_members WHERE family_id = $1 AND user_id = $2',
        [familyId, userId]
      );
      if (rows.length === 0) {
        res.status(403).json({
          error: 'Access denied',
          message: 'You are not a member of this family'
        });
        return;
      }
    }

    // Get family details with owner info
    const { rows: families } = await dbQuery(`
      SELECT 
        f.id, f.name, f.type, f.description, f.invite_code, f.created_at, f.updated_at, f.owner_id,
        u.first_name, u.last_name, u.email
      FROM families f
      LEFT JOIN public.users u ON f.owner_id = u.id
      WHERE f.id = $1
    `, [familyId]);

    if (families.length === 0) {
      res.status(404).json({
        error: 'Family not found',
        message: 'Family not found'
      });
      return;
    }

    const hourse = families[0];

    // Get family members
    const { rows: members } = await dbQuery(`
      SELECT 
        fm.user_id, fm.role, fm.joined_at,
        u.id, u.first_name, u.last_name, u.email, u.avatar_url
      FROM family_members fm
      LEFT JOIN public.users u ON fm.user_id = u.id
      WHERE fm.family_id = $1
    `, [familyId]);

    // Get stats
    const { rows: msgStats } = await dbQuery('SELECT count(*) FROM messages WHERE family_id = $1', [familyId]);
    const { rows: locStats } = await dbQuery('SELECT count(*) FROM location_history WHERE family_id = $1', [familyId]);

    res.json({
      id: hourse.id,
      name: hourse.name,
      description: hourse.description,
      type: hourse.type,
      invite_code: hourse.invite_code,
      created_at: hourse.created_at,
      updated_at: hourse.updated_at,
      owner_id: hourse.owner_id,
      owner: {
        id: hourse.owner_id,
        first_name: hourse.first_name,
        last_name: hourse.last_name,
        email: hourse.email
      },
      member_count: members.length,
      members: members.map(member => ({
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        user: {
          id: member.id,
          first_name: member.first_name,
          last_name: member.last_name,
          email: member.email,
          avatar_url: member.avatar_url
        }
      })),
      stats: {
        totalMessages: parseInt(msgStats[0].count) || 0,
        totalLocations: parseInt(locStats[0].count) || 0,
        totalMembers: members.length
      }
    });

  } catch (error) {
    console.error('Get family error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
    return;
  }
});

// Update hourse
router.put('/my-hourse', [
  requireFamilyMember as any,
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('type').optional().isIn(['hourse', 'friends', 'sharehouse'])
], validateRequest, async (req: any, res: Response): Promise<void> => {
  try {
    const familyId = req.familyId;
    const familyRole = req.familyRole;
    const { name, description, type } = req.body;

    // Check if user is owner or admin
    if (familyRole !== 'owner' && familyRole !== 'admin') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Only hourse owners and admins can update hourse details'
      });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description);
    }
    if (type) {
      updates.push(`type = $${idx++}`);
      values.push(type);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(familyId); // familyId for WHERE clause

      const { rows } = await dbQuery(
        `UPDATE families SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );

      res.json({
        message: 'hourse updated successfully',
        hourse: rows[0]
      });
    } else {
      res.json({ message: 'No changes made' });
    }

  } catch (error) {
    console.error('Update hourse error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
    return;
  }
});

// Invite member to hourse
router.post('/invite', [
  requireFamilyMember as any,
  body('email').isEmail().normalizeEmail(),
  body('message').optional().trim()
], validateRequest, async (req: any, res: Response): Promise<void> => {
  try {
    const familyId = req.familyId;
    const familyRole = req.familyRole;
    const { email, message } = req.body;

    // Check if user can invite members
    if (familyRole !== 'owner' && familyRole !== 'admin') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Only hourse owners and admins can invite members'
      });
      return;
    }

    // Check if user is already a member
    const { rows: existingMembers } = await dbQuery(`
      SELECT fm.user_id, u.email, u.first_name 
      FROM family_members fm
      LEFT JOIN public.users u ON fm.user_id = u.id
      WHERE fm.family_id = $1
    `, [familyId]);

    const isAlreadyMember = existingMembers.some(m => m.email === email);
    if (isAlreadyMember) {
      res.status(400).json({
        error: 'User already a member',
        message: 'This user is already a member of your hourse'
      });
      return;
    }

    // Check if invitation already exists
    const { rows: existingInvites } = await dbQuery(
      'SELECT id FROM family_invitations WHERE family_id = $1 AND email = $2 AND status = $3',
      [familyId, email, 'pending']
    );

    if (existingInvites.length > 0) {
      res.status(400).json({
        error: 'Invitation already sent',
        message: 'An invitation has already been sent to this email'
      });
      return;
    }

    // Ensure hourse has an invite code
    const { rows: families } = await dbQuery('SELECT id, name, invite_code FROM families WHERE id = $1', [familyId]);
    let inviteCode = families[0]?.invite_code;
    let familyName = families[0]?.name;

    if (!inviteCode) {
      inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await dbQuery(
        'UPDATE families SET invite_code = $1, updated_at = NOW() WHERE id = $2',
        [inviteCode, familyId]
      );
    }

    // Create invitation
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { rows: newInvite } = await dbQuery(`
      INSERT INTO family_invitations (family_id, email, invited_by, message, status, created_at, expires_at)
      VALUES ($1, $2, $3, $4, 'pending', NOW(), $5)
      RETURNING *
    `, [familyId, email, req.user.id, message || '', expiresAt]);

    // Send email
    try {
      const inviter = existingMembers.find(m => m.user_id === req.user.id);
      const inviterName = inviter?.first_name || req.user.email;
      const frontendBaseUrl = process.env.FRONTEND_URL || process.env.MOBILE_APP_URL || 'https://bondarys.com';
      const inviteUrl = `${frontendBaseUrl.replace(/\/+$/, '')}/invite?code=${inviteCode}`;

      await emailService.sendFamilyInvitation({
        inviterName,
        familyName: familyName || 'Your hourse',
        inviteCode,
        inviteUrl,
        message
      }, email);
    } catch (e) {
      console.error('Email sending failed', e);
    }

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: newInvite[0]
    });

  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
    return;
  }
});

// Get hourse invitations
router.get('/invitations', requireFamilyMember as any, async (req: any, res: Response) => {
  try {
    const familyId = req.familyId;

    const { rows: invitations } = await dbQuery(`
      SELECT 
        fi.id, fi.email, fi.message, fi.status, fi.created_at, fi.expires_at,
        u.first_name, u.last_name
      FROM family_invitations fi
      LEFT JOIN public.users u ON fi.invited_by = u.id
      WHERE fi.family_id = $1
      ORDER BY fi.created_at DESC
    `, [familyId]);

    res.json({
      invitations: invitations.map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        message: invitation.message,
        status: invitation.status,
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
        invitedBy: invitation.first_name ?
          `${invitation.first_name} ${invitation.last_name}` : 'Unknown'
      }))
    });

  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Accept invitation (by invitation ID or code)
router.post('/invitations/:invitationId/accept', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { invitationId } = req.params;

    // Get invitation
    const { rows: invitations } = await dbQuery(`
      SELECT fi.*, f.id as family_id, f.name as family_name
      FROM family_invitations fi
      JOIN families f ON fi.family_id = f.id
      WHERE fi.id = $1
    `, [invitationId]);

    const invitation = invitations[0];

    if (!invitation) {
      return res.status(404).json({
        error: 'Invitation not found',
        message: 'This invitation does not exist or has expired'
      });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        error: 'Invitation already processed',
        message: `This invitation has already been ${invitation.status}`
      });
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await dbQuery(
        'UPDATE family_invitations SET status = $1, updated_at = NOW() WHERE id = $2',
        ['expired', invitationId]
      );

      return res.status(400).json({
        error: 'Invitation expired',
        message: 'This invitation has expired'
      });
    }

    // Verify email matches (if invitation has email)
    if (invitation.email && invitation.email !== req.user.email) {
      return res.status(403).json({
        error: 'Email mismatch',
        message: 'This invitation was sent to a different email address'
      });
    }

    // Check if user is already a member
    const { rows: existingMember } = await dbQuery(
      'SELECT id FROM family_members WHERE family_id = $1 AND user_id = $2',
      [invitation.family_id, req.user.id]
    );

    if (existingMember.length > 0) {
      // Mark invitation as accepted even if already a member
      await dbQuery(
        'UPDATE family_invitations SET status = $1, updated_at = NOW() WHERE id = $2',
        ['accepted', invitationId]
      );

      return res.status(200).json({
        message: 'You are already a member of this hourse',
        alreadyMember: true
      });
    }

    // Add user as member
    await dbQuery(`
      INSERT INTO family_members (family_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, NOW())
    `, [invitation.family_id, req.user.id, 'member']);

    // Mark invitation as accepted
    await dbQuery(
      'UPDATE family_invitations SET status = $1, updated_at = NOW() WHERE id = $2',
      ['accepted', invitationId]
    );

    res.json({
      message: 'Successfully joined the hourse',
      family: {
        id: invitation.family_id,
        name: invitation.family_name
      }
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Decline invitation
router.post('/invitations/:invitationId/decline', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { invitationId } = req.params;

    // Get invitation
    const { rows: invitations } = await dbQuery(
      'SELECT id, email, status FROM family_invitations WHERE id = $1',
      [invitationId]
    );

    const invitation = invitations[0];

    if (!invitation) {
      return res.status(404).json({
        error: 'Invitation not found',
        message: 'This invitation does not exist'
      });
    }

    // Verify email matches (if invitation has email)
    if (invitation.email && invitation.email !== req.user.email) {
      return res.status(403).json({
        error: 'Email mismatch',
        message: 'This invitation was sent to a different email address'
      });
    }

    // Mark invitation as declined
    await dbQuery(
      'UPDATE family_invitations SET status = $1, updated_at = NOW() WHERE id = $2',
      ['declined', invitationId]
    );

    res.json({
      message: 'Invitation declined successfully'
    });

  } catch (error) {
    console.error('Decline invitation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Get user's pending invitations (invitations sent to their email)
router.get('/invitations/pending', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userEmail = req.user.email;

    const { rows: invitations } = await dbQuery(`
      SELECT 
        fi.id, fi.family_id, fi.email, fi.message, fi.status, fi.created_at, fi.expires_at,
        f.id as family_id, f.name as family_name, f.description as family_desc,
        u.first_name, u.last_name
      FROM family_invitations fi
      JOIN families f ON fi.family_id = f.id
      LEFT JOIN public.users u ON fi.invited_by = u.id
      WHERE fi.email = $1 AND fi.status = 'pending'
    `, [userEmail]);

    res.json({
      invitations: invitations.map(invitation => ({
        id: invitation.id,
        familyId: invitation.family_id,
        email: invitation.email,
        message: invitation.message,
        status: invitation.status,
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
        family: {
          id: invitation.family_id,
          name: invitation.family_name,
          description: invitation.family_desc
        },
        invitedBy: invitation.first_name ?
          `${invitation.first_name} ${invitation.last_name}` : 'Unknown'
      }))
    });

  } catch (error) {
    console.error('Get pending invitations error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Leave hourse
router.post('/leave', requireFamilyMember as any, async (req: any, res: Response) => {
  try {
    const familyId = req.familyId;
    const familyRole = req.familyRole;

    // Check if user is the owner
    if (familyRole === 'owner') {
      // Check if there are other members
      const { rows } = await dbQuery(
        'SELECT count(*) FROM family_members WHERE family_id = $1',
        [familyId]
      );

      const count = parseInt(rows[0].count);

      if (count > 1) {
        return res.status(400).json({
          error: 'Cannot leave hourse',
          message: 'As the owner, you must transfer ownership or remove all other members before leaving'
        });
      }

      // If owner is the only member, delete the hourse (cascade should handle members, but specific logic might vary)
      // Ideally DELETE FROM families WHERE id = familyId
      await dbQuery('DELETE FROM families WHERE id = $1', [familyId]);
    } else {
      // Remove user from hourse
      await dbQuery(
        'DELETE FROM family_members WHERE family_id = $1 AND user_id = $2',
        [familyId, req.user.id]
      );
    }

    res.json({
      message: 'Successfully left the hourse'
    });

  } catch (error) {
    console.error('Leave hourse error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Shopping List Routes moved up

// Update shopping list item
router.put('/shopping-list/:itemId', [
  requireFamilyMember as any,
  body('item').optional().isString().trim().isLength({ min: 1 }),
  body('quantity').optional().isString(),
  body('category').optional().isString(),
  body('completed').optional().isBoolean(),
  body('list').optional().isString(),
], validateRequest, async (req: any, res: Response) => {
  try {
    const familyId = req.familyId;
    const { itemId } = req.params;
    const { item, quantity, category, completed, list } = req.body;

    // Verify item belongs to hourse
    const { rows: existing } = await dbQuery(
      'SELECT id, family_id FROM shopping_items WHERE id = $1',
      [itemId]
    );

    if (existing.length === 0 || existing[0].family_id !== familyId) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'Shopping item not found'
      });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (item !== undefined) {
      updates.push(`item = $${idx++}`);
      values.push(item.trim());
    }
    if (quantity !== undefined) {
      updates.push(`quantity = $${idx++}`);
      values.push(quantity);
    }
    if (category !== undefined) {
      updates.push(`category = $${idx++}`);
      values.push(category);
    }
    if (completed !== undefined) {
      updates.push(`completed = $${idx++}`);
      values.push(completed);
    }
    if (list !== undefined) {
      updates.push(`list_name = $${idx++}`);
      values.push(list);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(itemId);

      const { rows: updatedItem } = await dbQuery(
        `UPDATE shopping_items SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );

      res.json({
        item: {
          id: updatedItem[0].id,
          item: updatedItem[0].item,
          quantity: updatedItem[0].quantity,
          category: updatedItem[0].category,
          completed: updatedItem[0].completed,
          list: updatedItem[0].list_name,
          createdAt: updatedItem[0].created_at,
          updatedAt: updatedItem[0].updated_at
        }
      });
    } else {
      res.json({ message: 'No changes made' });
    }

  } catch (error) {
    console.error('Update shopping item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Delete shopping list item
router.delete('/shopping-list/:itemId', requireFamilyMember as any, async (req: any, res: Response) => {
  try {
    const familyId = req.familyId;
    const { itemId } = req.params;

    // Verify item belongs to hourse
    const { rows: existing } = await dbQuery(
      'SELECT id, family_id FROM shopping_items WHERE id = $1',
      [itemId]
    );

    if (existing.length === 0 || existing[0].family_id !== familyId) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'Shopping item not found'
      });
    }

    await dbQuery('DELETE FROM shopping_items WHERE id = $1', [itemId]);

    res.json({
      success: true,
      message: 'Shopping item deleted successfully'
    });

  } catch (error) {
    console.error('Delete shopping item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Get events for a specific hourse (must be a member of that hourse)
router.get(
  '/:familyId/events',
  [
    queryParam('startDate').optional().isISO8601(),
    queryParam('endDate').optional().isISO8601(),
    queryParam('type').optional().isString(),
    queryParam('createdBy').optional().isUUID(),
  ],
  validateRequest,
  async (req: any, res: Response) => {
    try {
      const { familyId } = req.params;
      const { startDate, endDate, type, createdBy } = req.query;

      // Verify requester is a member of the requested hourse
      const { rows: membership } = await dbQuery(
        'SELECT 1 FROM family_members WHERE family_id = $1 AND user_id = $2',
        [familyId, req.user.id]
      );

      if (membership.length === 0) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You are not a member of this hourse',
        });
      }

      let sql = 'SELECT * FROM events WHERE family_id = $1';
      const params: any[] = [familyId];
      let idx = 2;

      if (startDate) {
        sql += ` AND start_date >= $${idx++}`;
        params.push(startDate);
      }
      if (endDate) {
        sql += ` AND end_date <= $${idx++}`;
        params.push(endDate);
      }
      if (type) {
        sql += ` AND event_type = $${idx++}`;
        params.push(type);
      }
      if (createdBy) {
        sql += ` AND created_by = $${idx++}`;
        params.push(createdBy);
      }

      sql += ' ORDER BY start_date ASC';

      const { rows: events } = await dbQuery(sql, params);

      return res.json({ events: events });
    } catch (error) {
      console.error('Get hourse events error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

