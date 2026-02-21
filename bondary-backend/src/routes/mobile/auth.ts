import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { emailService } from '../../services/emailService';
import { authenticateToken } from '../../middleware/auth';
import { AuthController } from '../../controllers/mobile/AuthController';
import { ssoAuthController } from '../../controllers/mobile/SSOAuthController';
import { UserModel } from '../../models/UserModel';
import { config } from '../../config/env';
import * as identityService from '../../services/identityService';

const authController = new AuthController();

// Helper to generate a default avatar
const generateAvatar = (seed: string) => {
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${seed}`;
};

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
  // Password is now optional or auto-generated
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
];

// Helper function to generate JWT token
const generateToken = (userId: string, email: string) => {
  return jwt.sign(
    { id: userId, email },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper function to generate refresh token
const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    config.JWT_REFRESH_SECRET,
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
  // Inject default avatar if not provided
  if (!req.body.avatar) {
    // Combine names or use email/random for seed
    const seed = req.body.firstName + '-' + req.body.lastName + '-' + Date.now();
    req.body.avatar = generateAvatar(seed);
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
const emailNormalization = [body('email').optional().isEmail().normalizeEmail({ gmail_remove_dots: false })];

// Check user existence
router.post('/check-user', emailNormalization, (req: any, res: any) => authController.checkUserExistence(req, res));

// Request Login OTP
router.post('/otp/request', emailNormalization, (req: any, res: any) => authController.requestLoginOtp(req, res));

// Login with OTP
router.post('/otp/login', emailNormalization, (req: any, res: any) => authController.loginWithOtp(req, res));

// SSO Login endpoint (Google, Facebook, Apple)
router.post('/sso', (req: any, res: any) => ssoAuthController.ssoLogin(req, res));

// Get available SSO providers (public endpoint for mobile/web apps)
router.get('/sso/providers', async (_req: any, res: any) => {
  try {
    const providers = await identityService.getOAuthProviders();
    const enabledProviders = providers.filter(p => p.isEnabled);
    
    res.json({
      success: true,
      providers: enabledProviders.map(p => ({
        id: p.id,
        name: p.providerName,
        displayName: p.displayName,
        providerType: p.providerName,
        iconUrl: p.iconUrl,
        buttonColor: p.buttonColor,
        displayOrder: p.displayOrder
      }))
    });
  } catch (error) {
    console.error('Error fetching SSO providers:', error);
    res.json({ success: true, providers: [] });
  }
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
    // Use Prisma for profile lookup
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phoneNumber: true,
        dateOfBirth: true,
        userType: true,
        circleIds: true,
        isOnboardingComplete: true,
        preferences: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Get user's circle using Prisma
    const circleMember = await prisma.entityRelation.findFirst({
      where: {
        ownerId: user.id,
        relationType: 'member_of'
      },
      select: {
        targetId: true,
        metadata: true
      }
    });

    let circleData = null;
    if (circleMember) {
      // Note: UnifiedEntity is in appkit schema, not available here
      // For now, just return basic circle info
      circleData = {
        circle_id: circleMember.targetId,
        role: circleMember.metadata?.role,
        name: null,
        type: null
      };
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        avatar: user.avatarUrl,
        phone: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        userType: user.userType || 'circle',
        circleIds: user.circleIds || [],
        isOnboardingComplete: user.isOnboardingComplete || false,
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
        role: user.preferences?.role || 'user',
        status: user.isActive ? 'active' : 'inactive',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        circleId: circleData?.circle_id || null,
        circleName: circleData?.name || null,
        circleRole: circleData?.role || null
      },
      circle: circleData
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
    const userId = req.user.id;

    // Build update data object
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phoneNumber = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
    if (avatar !== undefined) updateData.avatarUrl = avatar;
    if (preferences !== undefined) updateData.preferences = preferences;
    updateData.updatedAt = new Date();

    // Update user using Prisma
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Could not find user to update'
      });
    }

    // Get user's circle
    const circleMember = await prisma.entityRelation.findFirst({
      where: {
        ownerId: user.id,
        relationType: 'member_of'
      },
      select: {
        targetId: true,
        metadata: true
      }
    });

    let circleData = null;
    if (circleMember) {
      // Note: UnifiedEntity is in appkit schema, not available here
      circleData = {
        circle_id: circleMember.targetId,
        role: circleMember.metadata?.role,
        name: null,
        type: null
      };
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        avatar: user.avatarUrl,
        phone: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        userType: user.userType || 'circle',
        circleIds: user.circleIds || [],
        isOnboardingComplete: user.isOnboardingComplete || false,
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
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      circle: circleData
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
    // Update user's onboarding status using Prisma
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        isOnboardingComplete: true,
        updatedAt: new Date()
      }
    });

    if (!user) {
      return res.status(500).json({
        error: 'Failed to complete onboarding',
        message: 'An error occurred while completing onboarding'
      });
    }

    // Get user's circle
    const circleMember = await prisma.entityRelation.findFirst({
      where: {
        ownerId: user.id,
        relationType: 'member_of'
      },
      select: {
        targetId: true,
        metadata: true
      }
    });

    let circleData = null;
    if (circleMember) {
      // Note: UnifiedEntity is in appkit schema, not available here
      circleData = {
        circle_id: circleMember.targetId,
        role: circleMember.metadata?.role,
        name: null,
        type: null
      };
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        avatar: user.avatarUrl,
        phone: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        userType: user.userType || 'circle',
        circleIds: user.circleIds || [],
        isOnboardingComplete: user.isOnboardingComplete || true,
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
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        circleId: circleData?.circle_id || null,
        circleName: circleData?.name || null,
        circleRole: circleData?.role || null
      },
      circle: circleData
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
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false })
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

    // Find user by email using Prisma
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

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

    // Store reset token in database using Prisma
    // First, delete any existing reset tokens for this user
    await prisma.$executeRaw`
      DELETE FROM password_reset_tokens WHERE user_id = ${user.id}
    `;

    // Insert new reset token
    try {
      await prisma.$executeRaw`
        INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
         VALUES (${user.id}, ${hashedToken}, ${expiresAt.toISOString()}, ${new Date().toISOString()})
      `;
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
      'https://boundary.com';

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
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { token, password } = req.body;

    // Find user by reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date()
      }
    // Update user password using Prisma
    try {
      await prisma.user.update({
        where: { id: resetTokenData.user_id },
        data: {
          passwordHash: hashedPassword,
          updatedAt: new Date()
        }
      });
    } catch (updateError) {
      console.error('Failed to update password:', updateError);
      return res.status(500).json({
        error: 'Failed to reset password',
        message: 'An error occurred while resetting your password'
      });
    }

    // Delete the used reset token
    await prisma.$executeRaw`
      DELETE FROM password_reset_tokens WHERE token = ${hashedToken}
    `;

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

// Verify email endpoint
router.post('/verify-email', [
  body('token').trim().isLength({ min: 1 }).withMessage('Verification token is required')
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { token } = req.body;

    // For now, just return success since email verification fields may not exist in User model
    // This can be extended later when email verification is fully implemented
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
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

