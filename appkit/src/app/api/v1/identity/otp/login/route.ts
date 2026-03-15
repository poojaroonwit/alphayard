import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/lib/prisma';
import { config } from '@/server/config/env';
import { otpStore } from '@/app/api/v1/auth/otp/request/route';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, otp } = body;

    const identifier = email?.toLowerCase() || phone;
    if (!identifier || !otp) {
      return NextResponse.json({ success: false, message: 'Identifier and OTP required' }, { status: 400 });
    }

    // Look up stored OTP
    const stored = otpStore.get(identifier);
    if (!stored) {
      return NextResponse.json({ success: false, message: 'Invalid or expired code' }, { status: 401 });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(identifier);
      return NextResponse.json({ success: false, message: 'Code has expired' }, { status: 401 });
    }

    if (stored.otp !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid code' }, { status: 401 });
    }

    // OTP valid — consume it
    otpStore.delete(identifier);

    // Look up the user
    const user = await prisma.user.findFirst({
      where: email
        ? { email: email.toLowerCase() }
        : { phoneNumber: phone },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'User not found or inactive' }, { status: 401 });
    }

    // Issue JWT
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        type: 'user',
      },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error('OTP login error:', error);
    return NextResponse.json({ success: false, message: 'Login failed' }, { status: 500 });
  }
}
