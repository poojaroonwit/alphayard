import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/UserModel';
import pool from '../config/database'; // Using postgres pool directly
import { config } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role?: string;
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

    // DEV BYPASS: Allow mock-access-token for development
    if (token === 'mock-access-token') {
      // log('Using dev mock token');
      // Use a known test user ID
      const TEST_USER_ID = 'f739edde-45f8-4aa9-82c8-c1876f434683';

      // Add user info to request directly without DB check (or with DB check)
      // We'll verify against DB to be safe and populate email correctly
      const res = await pool.query('SELECT * FROM public.users WHERE id = $1', [TEST_USER_ID]);
      let user = res.rows[0];

      if (!user) {
        // If test user missing in public.users, just mock it
        user = { id: TEST_USER_ID, email: 'jaroonwitpool@gmail.com', is_active: true };
      }

      req.user = {
        id: user.id || TEST_USER_ID,
        email: user.email
      };
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    // log(`Token verified for ID: ${decoded.id}`);

    // SPECIAL CASE: Handle hardcoded 'admin' user from adminAuth.ts
    if (decoded.id === 'admin') {
      req.user = {
        id: 'admin',
        email: 'admin@bondarys.com',
        role: 'admin'
      } as any;
      return next();
    }

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
    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as any;

    const res = await pool.query(
      `SELECT id, email, raw_user_meta_data, role FROM public.users WHERE id = $1`,
      [decoded.id]
    );
    const user = res.rows[0];

    if (user) {
      // Extract role from metadata or direct column
      const meta = user.raw_user_meta_data || {};
      const userRole = user.role || meta.role;
      
      req.user = {
        id: user.id,
        email: user.email,
        role: userRole
      };
    }
    
    // Debug log provided token role vs db role
    // console.log(`[authenticateToken] User: ${user?.email}, Role: ${req.user?.role}`);

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
    const { rows } = await pool.query(
      'SELECT circle_id, role FROM circle_members WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    const circleMember = rows[0];

    if (!circleMember) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You must be a member of a circle to access this resource'
      });
      return;
    }

    // Add circle info to request
    req.circleId = circleMember.circle_id;
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
    const { rows } = await pool.query(
      'SELECT circle_id, role FROM circle_members WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    const circleMember = rows[0];

    if (circleMember) {
      req.circleId = circleMember.circle_id;
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
    const { rows } = await pool.query(
      "SELECT circle_id, role FROM circle_members WHERE user_id = $1 AND role = 'owner' LIMIT 1",
      [req.user.id]
    );
    const circleMember = rows[0];

    if (!circleMember) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You must be a circle owner to access this resource'
      });
      return;
    }

    req.circleId = circleMember.circle_id;
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
    const { rows } = await pool.query(
      "SELECT is_active as is_super_admin, role, raw_user_meta_data->>'role' as meta_role FROM public.users WHERE id = $1",
      [req.user.id]
    );
    const user = rows[0];

    if (user && (user.is_super_admin || user.role === 'admin' || user.role === 'super_admin' || user.meta_role === 'admin' || user.meta_role === 'super_admin')) {
      next();
      return;
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
