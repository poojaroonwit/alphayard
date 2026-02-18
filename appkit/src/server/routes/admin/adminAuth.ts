import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../../config/env';
import { prisma } from '../../lib/prisma';

const router = Router();

// Simple admin login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userIdentifier = username || email;

    if (!userIdentifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    // Check database for admin user
    try {
      const adminUser = await prisma.adminUser.findFirst({
        where: {
          email: userIdentifier,
          isActive: true
        },
        include: {
          role: true
        }
      });

      if (adminUser && adminUser.passwordHash) {
        const isMatch = await bcrypt.compare(password, adminUser.passwordHash);

        if (isMatch) {
          const token = jwt.sign(
            { 
              id: adminUser.id,
              adminId: adminUser.id,
              email: adminUser.email,
              name: adminUser.name,
              roleId: adminUser.roleId,
              role: adminUser.role?.name || 'admin',
              permissions: [],
              isSuperAdmin: adminUser.isSuperAdmin,
              type: 'admin'
            },
            config.JWT_SECRET,
            { expiresIn: '24h' }
          );

          // Update last login
          await prisma.adminUser.update({
            where: { id: adminUser.id },
            data: { lastLoginAt: new Date() }
          });

          return res.json({ 
            success: true,
            token,
            user: {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.name,
              role: adminUser.role?.name || 'admin',
              isSuperAdmin: adminUser.isSuperAdmin
            }
          });
        }
      }
    } catch (dbError) {
      console.warn('DB Admin check failed:', dbError);
    }

    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error: any) {
    console.error('Admin login error:', error);
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
