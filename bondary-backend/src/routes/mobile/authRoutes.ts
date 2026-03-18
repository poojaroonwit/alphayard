import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import axios from 'axios';

const appkitBase = (config as any).APPKIT_URL || 'http://localhost:3002';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface LoginData {
  email: string;
  password: string;
  deviceInfo?: {
    deviceId: string;
    platform: string;
    appVersion: string;
    osVersion: string;
  };
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  deviceInfo?: {
    deviceId: string;
    platform: string;
    appVersion: string;
    osVersion: string;
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
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

const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, false, undefined, undefined, errors.array()[0].msg);
  }
  next();
};

// ============================================================================
// Routes
// ============================================================================

const router = Router();

/**
 * POST /auth/check-user
 * Check if a user exists by email or phone
 */
router.post('/check-user', [
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().notEmpty().withMessage('Phone is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return sendResponse(res, 400, false, undefined, undefined, 'Email or phone is required');
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email: email.toLowerCase() } : {},
          phone ? { phoneNumber: phone } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      },
      select: { id: true, isActive: true }
    });

    return res.json({
      success: true,
      exists: !!user,
      isActive: user?.isActive ?? false
    });
  } catch (error) {
    console.error('Check user error:', error);
    return res.status(500).json({ success: false, error: 'Failed to check user' });
  }
});

/**
 * POST /auth/otp/request
 * Request a one-time password (OTP)
 */
router.post('/otp/request', [
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().notEmpty().withMessage('Phone is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    const response = await axios.post(`${appkitBase}/api/v1/auth/otp/request`, {
      email,
      phone
    });

    return res.json(response.data);
  } catch (error: any) {
    if (error.response?.data) {
      return res.status(error.response.status).json(error.response.data);
    }
    console.error('OTP request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to request OTP' });
  }
});

/**
 * POST /auth/login
 * Mobile app login endpoint
 */
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('deviceInfo').optional().isObject().withMessage('Device info must be an object'),
  body('deviceInfo.platform').optional().isIn(['ios', 'android', 'web']).withMessage('Invalid platform'),
  body('deviceInfo.appVersion').optional().isString().withMessage('Invalid app version')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { email, password, deviceInfo } = req.body as LoginData;

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return sendResponse(res, 401, false, undefined, undefined, 'Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      return sendResponse(res, 401, false, undefined, undefined, 'Account is deactivated');
    }

    // Check password
    if (!user.passwordHash) {
      return sendResponse(res, 401, false, undefined, undefined, 'No password set');
    }
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return sendResponse(res, 401, false, undefined, undefined, 'Invalid credentials');
    }

    // Generate JWT tokens
    const payload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      type: 'user',
      circleId: null, // Will be set after circle creation
      deviceInfo
    };

    const accessToken = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn: 86400 // 24 hours
    };

    // Remove password from response and ensure field names match AppKit SDK
    const { passwordHash, phoneNumber, ...userData } = user as any;
    const userResponse = {
      ...userData,
      phone: phoneNumber || userData.phone
    };

    return res.status(200).json({
      success: true,
      user: userResponse,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Mobile login error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Login failed');
  }
});

/**
 * POST /auth/register
 * Mobile app registration endpoint
 */
router.post('/register', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number format'),
  body('dateOfBirth').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date format (YYYY-MM-DD)'),
  body('deviceInfo').optional().isObject().withMessage('Device info must be an object'),
  body('deviceInfo.platform').optional().isIn(['ios', 'android', 'web']).withMessage('Invalid platform'),
  body('deviceInfo.appVersion').optional().isString().withMessage('Invalid app version')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, dateOfBirth, deviceInfo } = req.body as RegisterData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return sendResponse(res, 409, false, undefined, undefined, 'User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phoneNumber: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        isActive: true
      }
    });

    // Create default circle for new user if no circle exists
    const existingCircle = await prisma.circle.findFirst({});

    let circleId = existingCircle?.id;
    
    if (!circleId) {
      const newCircle = await prisma.circle.create({
        data: {
          name: 'My Circle',
          description: 'Personal circle',
          owners: {
            create: {
              userId: user.id,
              role: 'owner'
            }
          }
        }
      });
      circleId = newCircle.id;

      // Add user to circle
      await prisma.circleMember.create({
        data: {
          userId: user.id,
          circleId,
          role: 'admin'
        }
      });
    }

    // Generate JWT tokens
    const payload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      type: 'user',
      circleId,
      deviceInfo
    };

    const accessToken = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn: 86400 // 24 hours
    };

    // Remove sensitive data from response and ensure field names match AppKit SDK
    const { passwordHash: _, phoneNumber, ...userData } = user as any;
    const userResponse = {
      ...userData,
      phone: phoneNumber || userData.phone
    };

    return res.status(201).json({
      success: true,
      user: userResponse,
      accessToken,
      refreshToken,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Mobile registration error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Registration failed');
  }
});

/**
 * POST /auth/logout
 * Mobile app logout endpoint
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    // In a real implementation, you might want to invalidate the refresh token
    // For now, just return success
    sendResponse(res, 200, true, undefined, 'Logout successful');
  } catch (error) {
    console.error('Mobile logout error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Logout failed');
  }
});

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendResponse(res, 400, false, undefined, undefined, 'Refresh token is required');
    }

    // Verify refresh token
    try {
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET) as any;
      
      if (decoded.type !== 'refresh') {
        return sendResponse(res, 401, false, undefined, undefined, 'Invalid refresh token');
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user || !user.isActive) {
        return sendResponse(res, 401, false, undefined, undefined, 'User not found or inactive');
      }

      // Generate new access token
      const payload = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        type: 'user',
        circleId: null
      };

      const newAccessToken = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '24h' });

      const tokens: AuthTokens = {
        accessToken: newAccessToken,
        refreshToken,
        expiresIn: 86400 // 24 hours
      };

      sendResponse(res, 200, true, { tokens }, 'Token refreshed successfully');
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        if (error.name === 'TokenExpiredError') {
          return sendResponse(res, 401, false, undefined, undefined, 'Refresh token expired');
        }
        if (error.name === 'JsonWebTokenError') {
          return sendResponse(res, 401, false, undefined, undefined, 'Invalid refresh token');
        }
      }
      
      console.error('Token refresh error:', error);
      sendResponse(res, 401, false, undefined, undefined, 'Token refresh failed');
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Token refresh failed');
  }
});

/**
 * GET /auth/verify-email/:token
 * Verify email verification token
 */
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    // Mock implementation - in real app, verify token from database
    sendResponse(res, 200, true, { verified: true }, 'Email verified successfully');
  } catch (error) {
    console.error('Email verification error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Email verification failed');
  }
});

/**
 * POST /auth/forgot-password
 * Send password reset email
 */
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Mock implementation - in real app, send reset email
    sendResponse(res, 200, true, undefined, 'Password reset email sent');
  } catch (error) {
    console.error('Forgot password error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to send reset email');
  }
});

/**
 * POST /auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword').isLength({ min: 8 }).withMessage('Password confirmation required'),
  body('password').equals('confirmPassword').withMessage('Passwords must match')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    // Mock implementation - in real app, verify token and update password
    sendResponse(res, 200, true, undefined, 'Password reset successfully');
  } catch (error) {
    console.error('Reset password error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to reset password');
  }
});

export default router;
