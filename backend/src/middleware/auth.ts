import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import pool from '../config/database'; // Using postgres pool directly

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
  familyId?: string;
  familyRole?: string;
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

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'bondarys-dev-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as any;

    // log(`Token verified for ID: ${decoded.id}`);

    // Check if user still exists and is active
    const user = await UserModel.findById(decoded.id);

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
      email: user.email
    };

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

    const jwtSecret = process.env.JWT_SECRET || 'bondarys-dev-secret-key';
    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as any;

    const res = await pool.query('SELECT id, email, is_active FROM users WHERE id = $1', [decoded.id]);
    const user = res.rows[0];

    if (user && user.is_active) {
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
      // Extract role from a trusted source. Prefer upstream assignment (e.g., gateway),
      // fallback to JWT claim parsed earlier into req as needed by your stack.
      const roleFromRequest = (req as any).userRole || (req as any).user?.role;

      if (!roleFromRequest) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Role not present on request'
        });
      }

      if (roleFromRequest !== requiredRole && roleFromRequest !== 'super_admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: `Requires role: ${requiredRole}`
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

export const requireFamilyMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      'SELECT family_id, role FROM family_members WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    const familyMember = rows[0];

    if (!familyMember) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You must be a member of a hourse to access this resource'
      });
      return;
    }

    // Add hourse info to request
    req.familyId = familyMember.family_id;
    req.familyRole = familyMember.role;

    next();
  } catch (error) {
    console.error('hourse member check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify hourse membership'
    });
    return;
  }
};

export const requireFamilyOwner = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      "SELECT family_id, role FROM family_members WHERE user_id = $1 AND role = 'owner' LIMIT 1",
      [req.user.id]
    );
    const familyMember = rows[0];

    if (!familyMember) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You must be a hourse owner to access this resource'
      });
      return;
    }

    req.familyId = familyMember.family_id;
    req.familyRole = familyMember.role;

    next();
  } catch (error) {
    console.error('hourse owner check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify hourse ownership'
    });
    return;
  }
};
