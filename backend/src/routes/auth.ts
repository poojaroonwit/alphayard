import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../config/database';
import { emailService } from '../services/emailService';
import { authenticateToken } from '../middleware/auth';
import { AuthController } from '../controllers/AuthController';
import { UserModel } from '../models/UserModel';

const authController = new AuthController();

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  // Password is now optional or auto-generated
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

// OPTIONS handler for CORS preflight
router.options('/register', (_req, res) => {
  res.status(204).end();
});

// Register endpoint
router.post('/register', registerValidation, async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  return authController.register(req, res);
});

// OPTIONS handler for CORS preflight - must come before POST
router.options('/login', (_req, res) => {
  res.status(204).end();
});

// Login endpoint
router.post('/login', loginValidation, async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  return authController.login(req, res);
});

// Email normalization middleware for login flows
const emailNormalization = [body('email').optional().isEmail().normalizeEmail()];

// Check user existence
router.post('/check-user', emailNormalization, (req: any, res: any) => authController.checkUserExistence(req, res));

// Request Login OTP
router.post('/otp/request', emailNormalization, (req: any, res: any) => authController.requestLoginOtp(req, res));

// Login with OTP
router.post('/otp/login', emailNormalization, (req: any, res: any) => authController.loginWithOtp(req, res));

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
    // Use native pg pool for profile lookup
    const userResult = await pool.query(`
      SELECT 
        u.id, u.email, first_name, last_name, avatar_url, phone, date_of_birth, 
        user_type, subscription_tier, family_ids, is_onboarding_complete, 
        preferences, role, is_active, created_at, updated_at
      FROM users u
      WHERE u.id = $1
    `, [req.user.id]);

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Get user's hourse using native pg pool
    const familyResult = await pool.query(`
      SELECT fm.family_id, fm.role, f.name, f.type
      FROM family_members fm
      LEFT JOIN families f ON fm.family_id = f.id
      WHERE fm.user_id = $1
      LIMIT 1
    `, [user.id]);

    const familyMember = familyResult.rows[0];

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
        familyName: familyMember?.name || null,
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
    const { firstName, lastName, phone, dateOfBirth, avatar, preferences } = req.body;

    const fields = [];
    const params = [req.user.id];
    let idx = 2;

    if (firstName) { fields.push(`first_name = $${idx++}`); params.push(firstName); }
    if (lastName) { fields.push(`last_name = $${idx++}`); params.push(lastName); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); params.push(phone); }
    if (dateOfBirth) { fields.push(`date_of_birth = $${idx++}`); params.push(dateOfBirth); }
    if (avatar !== undefined) { fields.push(`avatar_url = $${idx++}`); params.push(avatar); }
    if (preferences) { fields.push(`preferences = $${idx++}`); params.push(JSON.stringify(preferences)); }

    fields.push(`updated_at = $${idx++}`);
    params.push(new Date().toISOString());

    const updateQuery = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $1 
      RETURNING id, email, first_name, last_name, avatar_url, phone, date_of_birth, user_type, subscription_tier, family_ids, is_onboarding_complete, preferences, updated_at
    `;

    const userResult = await pool.query(updateQuery, params);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Could not find user to update'
      });
    }

    // Get user's hourse
    const familyResult = await pool.query(`
      SELECT fm.family_id, fm.role, f.name, f.type
      FROM family_members fm
      LEFT JOIN families f ON fm.family_id = f.id
      WHERE fm.user_id = $1
      LIMIT 1
    `, [user.id]);

    const familyMember = familyResult.rows[0];

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
    // Update user's onboarding status using native pg pool
    const updateResult = await pool.query(`
      UPDATE users 
      SET is_onboarding_complete = true, updated_at = $1
      WHERE id = $2
      RETURNING id, email, first_name, last_name, avatar_url, phone, date_of_birth, user_type, subscription_tier, family_ids, is_onboarding_complete, preferences, created_at, updated_at
    `, [new Date().toISOString(), req.user.id]);

    const user = updateResult.rows[0];

    if (!user) {
      return res.status(500).json({
        error: 'Failed to complete onboarding',
        message: 'An error occurred while completing onboarding'
      });
    }

    // Get user's hourse
    const familyResult = await pool.query(`
      SELECT fm.family_id, fm.role, f.name, f.type
      FROM family_members fm
      LEFT JOIN families f ON fm.family_id = f.id
      WHERE fm.user_id = $1
      LIMIT 1
    `, [user.id]);

    const familyMember = familyResult.rows[0];

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
        familyName: familyMember?.name || null,
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

    // Find user by email using native pg pool
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = userResult.rows[0];

    // Always return success to prevent email enumeration attacks
    if (!user) {
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

    // Store reset token in database using native pg pool
    // First, delete any existing reset tokens for this user
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [user.id]
    );

    // Insert new reset token
    try {
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
         VALUES ($1, $2, $3, $4)`,
        [user.id, hashedToken, expiresAt.toISOString(), new Date().toISOString()]
      );
    } catch (tokenError) {
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

    // Hash the token to match stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token using native pg pool
    const tokenResult = await pool.query(
      `SELECT user_id, expires_at 
       FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > $2
       LIMIT 1`,
      [hashedToken, new Date().toISOString()]
    );
    const resetTokenData = tokenResult.rows[0];

    if (!resetTokenData) {
      return res.status(400).json({
        error: 'Invalid or expired token',
        message: 'The reset token is invalid or has expired. Please request a new password reset.'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password using native pg pool
    try {
      await pool.query(
        `UPDATE users 
         SET password_hash = $1, updated_at = $2
         WHERE id = $3`,
        [hashedPassword, new Date().toISOString(), resetTokenData.user_id]
      );
    } catch (updateError) {
      console.error('Failed to update password:', updateError);
      return res.status(500).json({
        error: 'Failed to reset password',
        message: 'An error occurred while resetting your password'
      });
    }

    // Delete the used reset token
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE token = $1',
      [hashedToken]
    );

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
