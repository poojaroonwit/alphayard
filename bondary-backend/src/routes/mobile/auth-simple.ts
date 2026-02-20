import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';

const router = express.Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const JWT_SECRET = config.JWT_SECRET;

// Simple auth middleware
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Invalid or expired token'
        });
      }

      req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email
      };

      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// Helper function to generate JWT token
const generateToken = (userId: string, email: string) => {
  return jwt.sign(
    { id: userId, email },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, userType } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'All fields are required'
      });
    }

    const userId = 'user-' + Date.now();
    const token = generateToken(userId, email);

    const user = {
      id: userId,
      email,
      firstName,
      lastName,
      userType: userType || 'circle',
      isOnboardingComplete: true,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      user,
      token,
      accessToken: token,
      refreshToken: 'refresh-' + Date.now()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Registration failed'
    });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email and password are required'
      });
    }

    const userId = 'user-' + Date.now();
    const token = generateToken(userId, email);

    const user = {
      id: userId,
      email,
      firstName: 'Demo',
      lastName: 'User',
      userType: 'circle',
      isOnboardingComplete: true,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      user,
      token,
      accessToken: token,
      refreshToken: 'refresh-' + Date.now()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Login failed'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = {
      id: req.user?.id,
      email: req.user?.email,
      firstName: 'Demo',
      lastName: 'User',
      avatar: '👤',
      createdAt: new Date().toISOString(),
      circleId: '1',
      circleName: 'Demo circle',
      circleRole: 'admin',
      isOnboardingComplete: true
    };

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user data'
    });
  }
});

export default router;
