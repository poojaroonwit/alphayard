import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/lib/prisma';
import { config } from '@/server/config/env';
import { buildCorsHeaders } from '@/server/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

/**
 * POST /api/v1/auth/direct-login
 *
 * Passwordless login for users who have NOT configured any 2FA method.
 * If the user has 2FA enabled this endpoint refuses and the client must
 * use the OTP channel instead.
 *
 * Body: { email?, phone? }
 */
export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req);
  try {
    const body = await req.json();
    const { email, phone } = body;

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, message: 'Email or phone is required' },
        { status: 400, headers: cors }
      );
    }

    const user = await prisma.user.findFirst({
      where: email ? { email: email.toLowerCase() } : { phoneNumber: phone },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatarUrl: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        userMFA: { where: { isEnabled: true }, select: { mfaType: true } },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 401, headers: cors }
      );
    }

    // Refuse if user has 2FA configured — must use OTP channel
    if (user.userMFA.length > 0) {
      return NextResponse.json(
        { success: false, message: '2FA is enabled — please verify via your configured channel', requiresMfa: true },
        { status: 403, headers: cors }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, type: 'user' },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phoneNumber,
          avatar: user.avatarUrl,
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { headers: cors }
    );
  } catch (error: any) {
    console.error('Direct login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500, headers: cors }
    );
  }
}
