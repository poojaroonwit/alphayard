import express from 'express';
import { body } from 'express-validator';
import { prisma } from '../../lib/prisma';
import { authenticateToken } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);

// List users (for admin console/mobile users management)
router.get('/', async (_req: any, res: any) => {
  try {
    // Fetch basic user info using Prisma
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        id, email, first_name, last_name, phone_number as phone, avatar_url, date_of_birth, 
        user_type, 
        (SELECT json_agg(target_id) FROM entity_relations WHERE source_id = users.id AND relation_type = 'member_of') as circle_ids,
        is_onboarding_complete, 
        preferences, preferences->>'role' as role, is_active, created_at, updated_at
      FROM core.users
      ORDER BY created_at DESC
    `;

    const data = result;

    const users = (data || []).map((u: any) => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      phone: u.phone || undefined,
      avatarUrl: u.avatar_url || undefined,
      avatar: u.avatar_url || undefined,
      dateOfBirth: u.date_of_birth || undefined,
      userType: (u.user_type || 'circle') as 'circle' | 'children' | 'seniors',
      circleIds: u.circle_ids || [],
      isOnboardingComplete: u.is_onboarding_complete || false,
      preferences: u.preferences || {
        notifications: true,
        locationSharing: true,
        popupSettings: {
          enabled: true,
          frequency: 'daily',
          maxPerDay: 3,
          categories: ['announcement', 'promotion']
        }
      },
      role: (u.role || 'user') as 'admin' | 'moderator' | 'user' | 'circle_admin',
      status: (u.is_active ? 'active' : 'inactive') as 'active' | 'inactive' | 'pending' | 'suspended',
      isVerified: true,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      permissions: [],
    }));

    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', async (req: any, res: any) => {
  try {
    // Get user profile using Prisma
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        id, email, first_name, last_name, avatar_url, phone_number as phone, date_of_birth, 
        user_type, 
        (SELECT json_agg(target_id) FROM entity_relations WHERE source_id = users.id AND relation_type = 'member_of') as circle_ids,
        is_onboarding_complete, 
        preferences, preferences->>'role' as role, is_active, created_at, updated_at
      FROM core.users
      WHERE id = ${req.user.id}
    `;

    const user = result[0];

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
        avatar: user.avatar_url,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        userType: user.user_type || 'circle',
        circleIds: user.circle_ids || [],
        isOnboardingComplete: user.is_onboarding_complete || false,
        preferences: user.preferences || {
          notifications: true,
          locationSharing: true,
          popupSettings: {
            enabled: true,
            frequency: 'daily',
            maxPerDay: 3,
            categories: ['announcement', 'promotion']
          }
        },
        role: user.role || 'user',
        status: user.is_active ? 'active' : 'inactive',
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Update user profile
router.put('/profile', [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('phone').optional().trim(),
  body('dateOfBirth').optional().isISO8601()
], validateRequest, async (req: any, res: any) => {
  try {
    const { firstName, lastName, phone, dateOfBirth } = req.body;

    const fields = [];
    const params = [req.user.id];
    let idx = 2;

    if (firstName) { fields.push(`first_name = $${idx++}`); params.push(firstName); }
    if (lastName) { fields.push(`last_name = $${idx++}`); params.push(lastName); }
    if (phone !== undefined) { fields.push(`phone_number = $${idx++}`); params.push(phone); }
    if (dateOfBirth) { fields.push(`date_of_birth = $${idx++}`); params.push(dateOfBirth); }

    fields.push(`updated_at = $${idx++}`);
    params.push(new Date().toISOString());

    const updateQuery = `
      UPDATE core.users 
      SET ${fields.join(', ')} 
      WHERE id = $1 
      RETURNING id, email, first_name, last_name, avatar_url, phone_number as phone, date_of_birth, updated_at
    `;

    const result = await prisma.$queryRawUnsafe<any[]>(updateQuery, params);
    const user = result[0];

    if (!user) {
      return res.status(500).json({
        error: 'Failed to update profile',
        message: 'An error occurred while updating your profile'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
        avatar: user.avatar_url,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

export default router;

