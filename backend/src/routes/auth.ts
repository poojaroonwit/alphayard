import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getSupabaseClient } from '../services/supabaseService';
import { emailService } from '../services/emailService';
import { authenticateToken } from '../middleware/auth';
import { AuthController } from '../controllers/AuthController';
import { UserModel } from '../models/User';

const authController = new AuthController();

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
];

// Helper function to generate JWT token
const generateToken = (userId: string, email: string) => {
  const secret = process.env.JWT_SECRET || 'bondarys-dev-secret-key';
  if ((process.env.NODE_ENV === 'production') && secret === 'bondarys-dev-secret-key') {
    throw new Error('JWT_SECRET is not set in production');
  }
  return jwt.sign(
    { id: userId, email },
    secret,
    { expiresIn: '7d' }
  );
};

// Helper function to generate refresh token
const generateRefreshToken = (userId: string) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'bondarys-refresh-secret-key';
  if ((process.env.NODE_ENV === 'production') && secret === 'bondarys-refresh-secret-key') {
    throw new Error('JWT_REFRESH_SECRET is not set in production');
  }
  return jwt.sign(
    { id: userId, type: 'refresh' },
    secret,
    { expiresIn: '30d' }
  );
};

// Register endpoint
router.post('/register', registerValidation, async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  return authController.register(req, res);
});

// Login endpoint
router.post('/login', loginValidation, async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  return authController.login(req, res);
});

// Refresh token endpoint
// Refresh token endpoint
router.post('/refresh', (req, res) => authController.refreshToken(req, res));

// Logout endpoint
// Logout endpoint
router.post('/logout', authenticateToken as any, (req, res) => authController.logout(req, res));

// Get current user
router.get('/me', authenticateToken as any, (req, res) => authController.getCurrentUser(req, res));

// Get user profile (alias for /users/profile)
router.get('/profile', authenticateToken as any, async (req: any, res: any) => {
  try {
    // Check if we're in demo mode (no Supabase configured)
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.json({
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: 'Demo',
          lastName: 'User',
          avatar: '👤',
          createdAt: new Date().toISOString(),
          familyId: '1',
          familyName: 'Demo hourse',
          familyRole: 'admin',
          isOnboardingComplete: true
        }
      });
    }

    const supabase = getSupabaseClient();

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        avatar_url,
        phone,
        date_of_birth,
        user_type,
        subscription_tier,
        family_ids,
        is_onboarding_complete,
        preferences,
        role,
        is_active,
        created_at,
        updated_at
      `)
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Get user's hourse
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('family_id, role, families(id, name, type)')
      .eq('user_id', user.id)
      .single();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: user.avatar_url,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        userType: user.user_type || 'hourse',
        subscriptionTier: user.subscription_tier || 'free',
        familyIds: user.family_ids || [],
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
        updatedAt: user.updated_at,
        familyId: familyMember?.family_id || null,
        familyName: (familyMember?.families as any)?.name || null,
        familyRole: familyMember?.role || null
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

// Update user profile (alias for /users/profile)
router.put('/profile', [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('phone').optional().trim(),
  body('dateOfBirth').optional().isISO8601(),
  body('avatar').optional().trim(),
  body('preferences').optional().isObject()
], authenticateToken as any, async (req: any, res: any) => {
  try {
    // Check if we're in demo mode (no Supabase configured)
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.json({
        message: 'Profile updated successfully',
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.body.firstName || 'Demo',
          lastName: req.body.lastName || 'User',
          avatar: req.body.avatar || '👤',
          updatedAt: new Date().toISOString()
        }
      });
    }

    const supabase = getSupabaseClient();
    const { firstName, lastName, phone, dateOfBirth, avatar, preferences } = req.body;

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth) updateData.date_of_birth = dateOfBirth;
    if (avatar !== undefined) updateData.avatar_url = avatar;
    if (preferences) updateData.preferences = preferences;

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select('id, email, first_name, last_name, avatar_url, phone, date_of_birth, user_type, subscription_tier, family_ids, is_onboarding_complete, preferences, updated_at')
      .single();

    if (error) {
      console.error('Update user profile error:', error);
      return res.status(500).json({
        error: 'Failed to update profile',
        message: 'An error occurred while updating your profile'
      });
    }

    // Get user's hourse
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('family_id, role, families(id, name, type)')
      .eq('user_id', user.id)
      .single();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: user.avatar_url,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        userType: user.user_type || 'hourse',
        subscriptionTier: user.subscription_tier || 'free',
        familyIds: user.family_ids || [],
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
        updatedAt: user.updated_at,
        familyId: familyMember?.family_id || null,
        familyName: (familyMember?.families as any)?.name || null,
        familyRole: familyMember?.role || null
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

// Complete onboarding
router.post('/onboarding/complete', authenticateToken as any, async (req: any, res: any) => {
  try {
    // Check if we're in demo mode (no Supabase configured)
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.json({
        success: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: 'Demo',
          lastName: 'User',
          avatar: '👤',
          createdAt: new Date().toISOString(),
          familyId: '1',
          familyName: 'Demo hourse',
          familyRole: 'admin',
          isOnboardingComplete: true
        }
      });
    }

    const supabase = getSupabaseClient();

    // Update user's onboarding status
    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({
        is_onboarding_complete: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select('id, email, first_name, last_name, avatar_url, phone, date_of_birth, user_type, subscription_tier, family_ids, is_onboarding_complete, preferences, created_at, updated_at')
      .single();

    if (updateError || !user) {
      console.error('Complete onboarding error:', updateError);
      return res.status(500).json({
        error: 'Failed to complete onboarding',
        message: 'An error occurred while completing onboarding'
      });
    }

    // Get user's hourse
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('family_id, role, families(id, name, type)')
      .eq('user_id', user.id)
      .single();

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: user.avatar_url,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        userType: user.user_type || 'hourse',
        subscriptionTier: user.subscription_tier || 'free',
        familyIds: user.family_ids || [],
        isOnboardingComplete: user.is_onboarding_complete || true,
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
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        familyId: familyMember?.family_id || null,
        familyName: (familyMember?.families as any)?.name || null,
        familyRole: familyMember?.role || null
      }
    });

  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Forgot password endpoint
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid email address',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Check if we're in demo mode (no Supabase configured)
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // In demo mode, always return success to prevent email enumeration
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    const supabase = getSupabaseClient();

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success to prevent email enumeration attacks
    // Don't reveal whether the email exists or not
    if (userError || !user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Hash the token before storing
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store reset token in database
    // First, delete any existing reset tokens for this user
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id);

    // Insert new reset token
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: hashedToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('Failed to create reset token:', tokenError);
      // Still return success to prevent email enumeration
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Send password reset email
    const frontendBaseUrl =
      process.env.FRONTEND_URL ||
      process.env.MOBILE_APP_URL ||
      'https://bondarys.com';

    const resetUrl = `${frontendBaseUrl.replace(/\/+$/, '')}/reset-password?token=${resetToken}`;

    await emailService.sendPasswordReset(
      {
        userName: user.first_name || 'User',
        resetUrl,
        expiresIn: '1 hour'
      },
      user.email
    );

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  }
});

// Reset password endpoint
router.post('/reset-password', [
  body('token').trim().isLength({ min: 1 }).withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Check if we're in demo mode (no Supabase configured)
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(400).json({
        error: 'Not available',
        message: 'Password reset is not available in demo mode'
      });
    }

    const supabase = getSupabaseClient();

    // Hash the token to match stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const { data: resetTokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at')
      .eq('token', hashedToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !resetTokenData) {
      return res.status(400).json({
        error: 'Invalid or expired token',
        message: 'The reset token is invalid or has expired. Please request a new password reset.'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', resetTokenData.user_id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return res.status(500).json({
        error: 'Failed to reset password',
        message: 'An error occurred while resetting your password'
      });
    }

    // Delete the used reset token
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', hashedToken);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

export default router;

// --- OAuth provider stubs (Google/Apple) ---
// These are placeholders to be implemented with real OAuth flows.
// GET /auth/google
router.get('/google', (_req, res) => {
  res.status(501).json({ error: 'Not implemented', message: 'Google OAuth not configured' });
});

// GET /auth/google/callback
router.get('/google/callback', (_req, res) => {
  res.status(501).json({ error: 'Not implemented', message: 'Google OAuth callback not configured' });
});

// GET /auth/apple
router.get('/apple', (_req, res) => {
  res.status(501).json({ error: 'Not implemented', message: 'Apple Sign-In not configured' });
});

// POST /auth/apple/callback
router.post('/apple/callback', (_req, res) => {
  res.status(501).json({ error: 'Not implemented', message: 'Apple callback not configured' });
});
