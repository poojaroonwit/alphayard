import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';

const router = Router();

// Simple admin credentials (in production, use proper authentication)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123' // Change this in production!
};

// Simple admin login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userIdentifier = username || email;

    if (!userIdentifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    // Check against username 'admin' OR matching email
    const isValidUser = userIdentifier === ADMIN_CREDENTIALS.username || userIdentifier === 'admin@bondarys.com';

    if (isValidUser && password === ADMIN_CREDENTIALS.password) {
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: 'admin',
          username: 'admin',
          type: 'admin'
        },
        config.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({ 
        success: true,
        token,
        user: {
          id: 'admin',
          username: 'admin',
          type: 'admin'
        }
      });
    }

    // Fallback: Check database for real admin user
    try {
      const { UserModel } = require('../../models/UserModel');
      const bcrypt = require('bcrypt'); // or bcryptjs depending on what's installed
      
      const user = await UserModel.findOne({ 
        $or: [{ email: userIdentifier }, { username: userIdentifier }] 
      });

      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
        // Check password (assuming comparePassword method or direct bcrypt)
        // Adjust based on your User model implementation
        let isMatch = false;
        if (user.matchPassword) {
           isMatch = await user.matchPassword(password);
        } else if (user.password) {
           // Fallback to manual compare if method missing
           isMatch = await bcrypt.compare(password, user.password);
        }

        if (isMatch) {
             const token = jwt.sign(
              { 
                id: user._id, // Use real ID
                username: user.username || user.firstName,
                type: user.role
              },
              config.JWT_SECRET,
              { expiresIn: '24h' }
            );

            return res.json({ 
              success: true,
              token,
              user: {
                id: user._id,
                username: user.username || user.email,
                type: user.role
              }
            });
        }
      }
    } catch (dbError) {
      console.warn('DB Admin check failed:', dbError);
    }

    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    res.json({ 
      success: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        type: decoded.type
      }
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
