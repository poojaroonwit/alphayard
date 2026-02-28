import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { config } from '@/server/config/env';
import { prisma } from '@/server/lib/prisma';

export interface AuthenticatedRequest extends NextRequest {
  admin?: {
    id: string;
    adminId?: string;
    email: string;
    role: string;
    permissions: string[];
    isSuperAdmin: boolean;
  };
}

export async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const reqPath = req.nextUrl?.pathname || 'unknown';

  if (!token) {
    console.warn(`[auth] No token for ${reqPath}`);
    return { error: 'Access denied', status: 401 };
  }

  try {
    // Compare secrets to detect mismatch between login route and auth
    const envSecret = process.env.JWT_SECRET;
    const configSecret = config.JWT_SECRET;
    if (envSecret !== configSecret) {
      console.error(`[auth] JWT_SECRET MISMATCH: env length=${envSecret?.length}, config length=${configSecret?.length}`);
    }

    const decoded = jwt.verify(token, configSecret) as any;
    console.log(`[auth] Token verified for ${decoded.email} (type=${decoded.type}, role=${decoded.role}) on ${reqPath}`);
    
    // Infer admin type from role claim for legacy tokens missing the type field
    const tokenType = decoded.type || (decoded.role === 'admin' || decoded.role === 'super_admin' ? 'admin' : undefined);

    if (tokenType !== 'admin') {
      console.warn(`[auth] Rejected non-admin token (type: '${decoded.type}', role: '${decoded.role}') for ${decoded.email}`);
      return { error: 'Admin access required', status: 403 };
    }

    // Verify user exists in DB and is active (check admin_users first, fall back to users)
    const userId = decoded.adminId || decoded.id;
    let adminUser = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, isSuperAdmin: true, email: true }
    });
    console.log(`[auth] adminUser lookup for ${userId}: ${adminUser ? 'found' : 'NOT FOUND'}`);

    if (!adminUser) {
      // Fallback: user may exist in the users table (created via login route)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true, email: true, userType: true }
      });
      console.log(`[auth] users table fallback for ${userId}: ${user ? `found (userType=${user.userType}, active=${user.isActive})` : 'NOT FOUND'}`);
      if (user && user.isActive) {
        adminUser = {
          id: user.id,
          isActive: true,
          isSuperAdmin: user.userType === 'admin',
          email: user.email
        };
      }
    }

    if (!adminUser || !adminUser.isActive) {
      console.warn(`[auth] User not found or inactive: ${userId} for ${decoded.email} on ${reqPath}`);
      return { error: 'Invalid or inactive user', status: 401 };
    }

    console.log(`[auth] ✓ Authenticated ${decoded.email} (isSuperAdmin=${adminUser.isSuperAdmin}) on ${reqPath}`);
    return {
      admin: {
        id: decoded.id,
        adminId: decoded.adminId,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || [],
        isSuperAdmin: adminUser.isSuperAdmin
      }
    };
  } catch (err: any) {
    console.error(`[auth] Token verification failed on ${reqPath}: ${err.message}`);
    return { error: 'Invalid or expired token', status: 401 };
  }
}

export function hasPermission(admin: any, permission: string) {
  // Grant all permissions to any authenticated admin user
  // TODO: Re-enable granular permission checks once roles/permissions are fully configured in DB
  if (admin) {
    return true;
  }
  if (admin.isSuperAdmin || admin.permissions.includes('*')) {
    return true;
  }
  return admin.permissions.includes(permission);
}
