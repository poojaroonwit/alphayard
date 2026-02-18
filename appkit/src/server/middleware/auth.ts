import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/UserModel';
import { prisma } from '../lib/prisma';
import { config } from '../config/env';
import { tokenBlacklistService } from '../services/tokenBlacklistService';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role?: string;
    type?: string;
  };
  admin?: {
    id: string;
    email: string;
    type?: string;
  };
  circleId?: string;
  circleRole?: string;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const fs = require('fs');
  const log = (msg: string) => { try { fs.appendFileSync('debug_auth.log', `[${new Date().toISOString()}] ${msg}\n`); } catch (e) { } };

  // Allow OPTIONS requests (CORS preflight) without token
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      log('No token provided');
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verified JWT token
    const jwtSecret = config.JWT_SECRET;

    // PRODUCTION SECURITY: Reject mock tokens in production
    if (token === 'mock-access-token') {
      if (process.env.NODE_ENV === 'production') {
        log('Mock token attempted in production - blocked');
        return res.status(401).json({
          error: 'Access denied',
          message: 'Invalid authentication method'
        });
      }
      
      // Development-only: Allow with warning
      console.warn('[SECURITY WARNING] Using mock token in development mode');
      const TEST_USER_ID = 'f739edde-45f8-4aa9-82c8-c1876f434683';

      // Use Prisma to fetch user
      const user = await prisma.user.findUnique({
        where: { id: TEST_USER_ID }
      });

      if (!user) {
        req.user = {
          id: TEST_USER_ID,
          email: 'dev-test@appkit.local'
        };
      } else {
        req.user = {
          id: user.id,
          email: user.email
        };
      }
      return next();
    }

    // Check if token is blacklisted
    const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      log('Token is blacklisted');
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token has been invalidated'
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    console.log('[AUTH] Token decoded - ID:', decoded.id, 'Email:', decoded.email, 'Type:', decoded.type);

    // SPECIAL CASE: Handle admin tokens (from adminAuth.ts)
    if (decoded.type === 'admin' || decoded.id === 'admin' || decoded.role === 'admin' || decoded.role === 'super_admin') {
      req.user = {
        id: decoded.id || decoded.adminId || 'admin',
        adminId: decoded.adminId || decoded.id,
        email: decoded.email || 'admin@appkit.com',
        name: decoded.name,
        role: decoded.role || 'admin',
        permissions: decoded.permissions || [],
        isSuperAdmin: decoded.isSuperAdmin || false,
        type: decoded.type || 'admin'
      } as any;
      return next();
    }

    // Check if user still exists and is active
    console.log('[AUTH] Looking up user by ID:', decoded.id);
    const user = await UserModel.findById(decoded.id);
    console.log('[AUTH] User found:', user ? { id: user.id, email: user.email, isActive: user.isActive } : 'NOT FOUND');

    if (!user) {
      log(`User not found for ID: ${decoded.id}`);
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      log(`User inactive: ${user.email}`);
      return res.status(401).json({
        error: 'Access denied',
        message: 'Account is disabled'
      });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: (user as any).role
    } as any;
    
    try {
      require('fs').appendFileSync('debug_auth.log', `[${new Date().toISOString()}] [authenticateToken] Success. UserID: ${user.id}, ExtractedRole: ${(user as any).role}\n`);
    } catch (e) {}

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      log(`JWT Error: ${error.message}`);
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      log('Token expired');
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired'
      });
    }

    log(`Auth Middleware Error: ${error}`);
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    const jwtSecret = config.JWT_SECRET;
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Use Prisma to fetch user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true
      }
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email
      };
    }

    next();
  } catch (error) {
    // If there's an error, just continue without authentication
    next();
  }
};

// Role-based access control middleware
export const requireRole = (requiredRole: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    try {
      const roleFromRequest = (req as any).userRole || (req as any).user?.role;
      try {
        require('fs').appendFileSync('debug_auth.log', `[${new Date().toISOString()}] [requireRole] User: ${req.user?.id}, Role from request: ${roleFromRequest}, Required: ${requiredRole}\n`);
      } catch (e) {}

      if (!roleFromRequest) {
        try {
          require('fs').appendFileSync('debug_auth.log', `[${new Date().toISOString()}] [requireRole] Access denied: Role not present\n`);
        } catch (e) {}
        return res.status(403).json({
          error: 'Access denied',
          message: 'Role not present on request'
        });
      }

      if (roleFromRequest !== requiredRole && roleFromRequest !== 'super_admin') {
        try {
          require('fs').appendFileSync('debug_auth.log', `[${new Date().toISOString()}] [requireRole] Access denied: Role ${roleFromRequest} does not match ${requiredRole}\n`);
        } catch (e) {}
        return res.status(403).json({
          error: 'Access denied',
          message: `Requires role: ${requiredRole}. Your role: ${roleFromRequest}`
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Role verification failed'
      });
    }
  };
};

export const requireCircleMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Use Prisma to find circle membership
    const circleMember = await prisma.circleMember.findFirst({
      where: { userId: req.user.id },
      select: {
        circleId: true,
        role: true
      }
    });

    if (!circleMember) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You must be a member of a circle to access this resource'
      });
      return;
    }

    // Add circle info to request
    req.circleId = circleMember.circleId;
    req.circleRole = circleMember.role;

    next();
  } catch (error) {
    console.error('circle member check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify circle membership',
    });
    return;
  }
};

export const optionalCircleMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Use Prisma to find circle membership
    const circleMember = await prisma.circleMember.findFirst({
      where: { userId: req.user.id },
      select: {
        circleId: true,
        role: true
      }
    });

    if (circleMember) {
      req.circleId = circleMember.circleId;
      req.circleRole = circleMember.role;
    }

    next();
  } catch (error) {
    console.error('Optional circle member check error:', error);
    next();
  }
};

export const requireCircleOwner = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Use Prisma to find owner membership
    const circleMember = await prisma.circleMember.findFirst({
      where: {
        userId: req.user.id,
        role: 'owner'
      },
      select: {
        circleId: true,
        role: true
      }
    });

    if (!circleMember) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You must be a circle owner to access this resource'
      });
      return;
    }

    req.circleId = circleMember.circleId;
    req.circleRole = circleMember.role;

    next();
  } catch (error) {
    console.error('circle owner check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify circle ownership'
    });
    return;
  }
};

// Check for Admin Access
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is from admin_users table (type: 'admin' in token)
    if (req.user.type === 'admin') {
      // Use Prisma to verify admin user exists and is active
      const adminUser = await prisma.adminUser.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          isActive: true
        }
      });
      
      if (adminUser && adminUser.isActive !== false) {
        // Store admin info for later use
        req.admin = req.user;
        next();
        return;
      }
    }

    // Fallback: Check regular users table for active status
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        isActive: true
      }
    });

    if (user && user.isActive) {
      // User exists and is active, but not an admin - deny access
    }

    res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required'
    });
    return;

  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify admin privileges'
    });
    return;
  }
};

export const validateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid API Key' });
  }
  next();
};
