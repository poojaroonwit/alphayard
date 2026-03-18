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
    const { email, phone, otp } = body;

    if ((!email && !phone) || !otp) {
      return NextResponse.json(
        { success: false, message: 'Identifier and OTP required' },
        { status: 400, headers: cors }
      );
    }

    const user = await prisma.user.findFirst({
      where: email ? { email: email.toLowerCase() } : { phoneNumber: phone },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Invalid code' },
        { status: 401, headers: cors }
      );
    }

    const identifier = email ? email.toLowerCase() : phone;
    const verified = await otpService.verifyOtp(identifier, String(otp));

    if (!verified) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired code' },
        { status: 401, headers: cors }
      );
    }

    // OTP valid
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
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { headers: cors }
    );
  } catch (error: any) {
    console.error('OTP login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500, headers: cors }
    );
  }
}
