import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/lib/prisma';
import { config } from '@/server/config/env';
import { buildCorsHeaders } from '@/server/lib/cors';
import { otpService } from '@/server/services/OtpService';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req);
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email and verification code are required' },
        { status: 400, headers: cors }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // OTP for email verification always uses email channel
    const valid = await otpService.verifyOtp(normalizedEmail, code);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification code' },
        { status: 400, headers: cors }
      );
    }

    const user = await prisma.user.update({
      where: { email: normalizedEmail },
      data: { isVerified: true, verifiedAt: new Date() },
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
      },
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
        message: 'Email verified successfully',
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
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { success: false, message: 'Email verification failed' },
      { status: 500, headers: cors }
    );
  }
}
