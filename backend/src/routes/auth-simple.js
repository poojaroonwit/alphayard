const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Simple auth middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'bondarys-dev-secret-key';

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Invalid or expired token'
        });
      }

      // Set user info from token
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
const generateToken = (userId, email) => {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET || 'bondarys-dev-secret-key',
    { expiresIn: '1d' }
  );
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType } = req.body;

    // Simple validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'All fields are required'
      });
    }

    // Generate token
    const userId = 'user-' + Date.now();
    const token = generateToken(userId, email);

    // Return user data
    const user = {
      id: userId,
      email,
      firstName,
      lastName,
      userType: userType || 'hourse',
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
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email and password are required'
      });
    }

    // Simple demo login - accept any email/password
    const userId = 'user-' + Date.now();
    const token = generateToken(userId, email);

    const user = {
      id: userId,
      email,
      firstName: 'Demo',
      lastName: 'User',
      userType: 'hourse',
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
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Demo mode - return user data from token
    const user = {
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

module.exports = router;
