import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/lib/prisma';
import { config } from '@/server/config/env';
import { buildCorsHeaders } from '@/server/lib/cors';

function getMobileUser(req: NextRequest): { id: string } | null {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    if (decoded.type !== 'user') return null;
    return { id: decoded.id };
  } catch {
    return null;
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req, 'GET, PATCH, OPTIONS') });
}

export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders(req, 'GET, PATCH, OPTIONS');

  const tokenUser = getMobileUser(req);
  if (!tokenUser) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401, headers: cors });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: tokenUser.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatarUrl: true,
        dateOfBirth: true,
        gender: true,
        bio: true,
        userType: true,
        preferences: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404, headers: cors });
    }

    const prefs = (user.preferences as any) || {};
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName} ${user.lastName}`.trim(),
          phone: user.phoneNumber,
          avatar: user.avatarUrl,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          bio: user.bio,
          userType: user.userType,
          preferences: user.preferences,
          isOnboardingComplete: prefs.isOnboardingComplete === true,
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt,
        },
      },
      { headers: cors }
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch profile' },
      { status: 500, headers: cors }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const cors = buildCorsHeaders(req, 'GET, PATCH, OPTIONS');

  const tokenUser = getMobileUser(req);
  if (!tokenUser) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401, headers: cors });
  }

  try {
    const body = await req.json();
    const { firstName, lastName, phone, avatar, dateOfBirth, gender, bio, isOnboardingComplete } = body;

    // Merge isOnboardingComplete into preferences JSON
    let preferencesUpdate: any = undefined;
    if (isOnboardingComplete !== undefined) {
      const current = await prisma.user.findUnique({ where: { id: tokenUser.id }, select: { preferences: true } });
      const existing = (current?.preferences as any) || {};
      preferencesUpdate = { ...existing, isOnboardingComplete: !!isOnboardingComplete };
    }

    const updated = await prisma.user.update({
      where: { id: tokenUser.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phoneNumber: phone }),
        ...(avatar !== undefined && { avatarUrl: avatar }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(gender !== undefined && { gender }),
        ...(bio !== undefined && { bio }),
        ...(preferencesUpdate !== undefined && { preferences: preferencesUpdate }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatarUrl: true,
        dateOfBirth: true,
        gender: true,
        bio: true,
        userType: true,
        preferences: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const updatedPrefs = (updated.preferences as any) || {};
    return NextResponse.json(
      {
        success: true,
        user: {
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          name: `${updated.firstName} ${updated.lastName}`.trim(),
          phone: updated.phoneNumber,
          avatar: updated.avatarUrl,
          dateOfBirth: updated.dateOfBirth,
          gender: updated.gender,
          bio: updated.bio,
          userType: updated.userType,
          preferences: updated.preferences,
          isOnboardingComplete: updatedPrefs.isOnboardingComplete === true,
          isActive: updated.isActive,
          isVerified: updated.isVerified,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      },
      { headers: cors }
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update profile' },
      { status: 500, headers: cors }
    );
  }
}
