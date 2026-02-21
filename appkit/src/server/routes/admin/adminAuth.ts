import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { adminUserController } from '../../controllers/admin/AdminUserController';
import { authenticateAdmin } from '../../middleware/adminAuth';

const router = Router();

// Modular admin login using the controller (includes permissions and auditing)
router.post('/login', adminUserController.login.bind(adminUserController));

// Get current user details (including permissions)
router.get('/me', authenticateAdmin as any, adminUserController.getCurrentUser.bind(adminUserController));

// Verify token endpoint (legacy/internal)
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
