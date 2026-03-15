import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/lib/prisma';
import { config } from '@/server/config/env';
import { auditService, AuditAction } from '@/server/services/auditService';
import { buildCorsHeaders } from '@/server/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req)
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400, headers: cors });
    }

    const normalizedEmail = email.toLowerCase();

    // Try admin user first
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
      include: {
        role: true,
        adminUserApplications: {
          include: { application: true }
        }
      }
    });

    if (adminUser && adminUser.isActive) {
      // Verify admin password
      const isValidPassword = await bcrypt.compare(password, adminUser.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: cors });
      }

      // Create permissions array
      let permissions: string[] = [];
      if (adminUser.isSuperAdmin) {
        permissions = ['*'];
      } else if (adminUser.role) {
        const rolePermissions = await prisma.adminRolePermission.findMany({
          where: { roleId: adminUser.roleId! },
          include: { permission: true }
        });
        permissions = rolePermissions.map((rp: any) => `${rp.permission.module}:${rp.permission.action}`);
      }

      const token = jwt.sign(
        {
          id: adminUser.id,
          adminId: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.name.split(' ')[0] || '',
          lastName: adminUser.name.split(' ').slice(1).join(' ') || '',
          role: adminUser.role?.name || 'admin',
          type: 'admin',
          isSuperAdmin: adminUser.isSuperAdmin,
          permissions
        },
        config.JWT_SECRET,
        { expiresIn: '24h' }
      );

      await prisma.adminUser.update({
        where: { id: adminUser.id },
        data: { lastLoginAt: new Date() }
      });

      try {
        await auditService.logAuthEvent(
          adminUser.id, AuditAction.LOGIN, 'AdminUser', {},
          req.headers.get('x-forwarded-for') || '127.0.0.1',
          req.headers.get('user-agent') || 'Unknown'
        );
      } catch (_) {}

      const adminResponse = NextResponse.json({
        token,
        accessToken: token,
        refreshToken: token,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role?.name,
          isSuperAdmin: adminUser.isSuperAdmin,
          avatarUrl: adminUser.avatarUrl
        }
      }, { headers: cors });
      adminResponse.cookies.set('appkit_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60
      });
      return adminResponse;
    }

    // Try mobile user
    const mobileUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!mobileUser || !mobileUser.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: cors });
    }

    if (!mobileUser.passwordHash) {
      return NextResponse.json({ error: 'No password set. Please use SSO to login.' }, { status: 401, headers: cors });
    }

    const isValidUserPassword = await bcrypt.compare(password, mobileUser.passwordHash);
    if (!isValidUserPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: cors });
    }

    // Generate mobile user JWT
    const accessToken = jwt.sign(
      {
        id: mobileUser.id,
        email: mobileUser.email,
        firstName: mobileUser.firstName,
        lastName: mobileUser.lastName,
        type: 'user',
      },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const refreshToken = jwt.sign(
      { id: mobileUser.id, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: mobileUser.id },
      data: { lastLoginAt: new Date() }
    });

    const response = NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      token: accessToken,
      user: {
        id: mobileUser.id,
        email: mobileUser.email,
        firstName: mobileUser.firstName,
        lastName: mobileUser.lastName,
        phone: mobileUser.phoneNumber,
        avatar: mobileUser.avatarUrl,
        isActive: mobileUser.isActive,
        createdAt: mobileUser.createdAt,
        updatedAt: mobileUser.updatedAt,
      }
    }, { headers: cors });

    return response;

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: cors });
  }
}
