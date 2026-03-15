import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { appkitClient as appkit } from '../../lib/appkitClient';

const router = Router();

// POST /mobile-auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email, password } = req.body;

    // Use AppKit for login
    const authResult = await appkit.auth.login({ email, password }) as any;

    if (!authResult || (authResult.success === false)) {
      return res.status(401).json({ error: authResult?.message || 'Invalid credentials' });
    }

    res.json({
      success: true,
      user: authResult.user,
      tokens: {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /mobile-auth/register
router.post('/register', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name required'),
  body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;

    // Use AppKit for registration
    const authResult = await appkit.auth.register({
      email,
      password,
      firstName,
      lastName
    });

    if (!authResult || authResult.success === false) {
      return res.status(400).json({ error: (authResult as any).message || 'Registration failed' });
    }

    res.status(201).json({
      success: true,
      user: authResult.user,
      tokens: {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken
      }
    });

  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /mobile-auth/refresh
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { refreshToken } = req.body;

    // Use AppKit for token refresh
    this.tokenStorage.setTokens({ refreshToken, accessToken: '', expiresAt: 0 }); // Mock storage for refresh
    const tokens = await appkit.auth.refreshToken();

    res.json({
      success: true,
      tokens: {
        accessToken: tokens?.accessToken,
        refreshToken: tokens?.refreshToken
      }
    });

  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: error.message || 'Invalid refresh token' });
  }
});

// POST /mobile-auth/logout
router.post('/logout', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    // Forward logout to AppKit (invalidates server session)
    await appkit.auth.logout();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /mobile-auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email } = req.body;

    // Forward to AppKit
    await appkit.auth.forgotPassword({ email });

    // Don't reveal if user exists or not (security best practice)
    res.json({ success: true, message: 'If an account exists, a reset link has been sent' });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /mobile-auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { token, password } = req.body;

    // Forward to AppKit
    const result = await appkit.auth.resetPassword({ token, password });

    res.json({ success: result.success !== false, message: result.message || 'Password has been reset successfully' });

  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /mobile-auth/verify-email
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Verification token required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { token } = req.body;
    
    // Forward to AppKit
    const result = await appkit.auth.verifyEmail({ email: '', code: token });

    res.json({ success: (result as any).success !== false, message: (result as any).message || 'Email verified' });

  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
