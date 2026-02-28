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

  if (!token) {
    return { error: 'Access denied', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    // Infer admin type from role claim for legacy tokens missing the type field
    const tokenType = decoded.type || (decoded.role === 'admin' || decoded.role === 'super_admin' ? 'admin' : undefined);

    if (tokenType !== 'admin') {
      console.warn(`[auth] Rejected non-admin token (type: '${decoded.type}', role: '${decoded.role}') for ${decoded.email}`);
      return { error: 'Admin access required', status: 403 };
    }

    // Verify user exists in DB and is active
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: decoded.adminId || decoded.id },
      select: { id: true, isActive: true, isSuperAdmin: true, email: true }
    });

    if (!adminUser || !adminUser.isActive) {
      return { error: 'Invalid or inactive user', status: 401 };
    }

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
  } catch (err) {
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
