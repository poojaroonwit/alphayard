import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/lib/prisma';
import { config } from '@/server/config/env';
import { buildCorsHeaders } from '@/server/lib/cors';
import { otpService } from '@/server/services/OtpService';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

/**
 * POST /api/v1/auth/otp/verify
 *
 * Verifies an OTP code. Used for:
 *   - 2FA at login (when user has 2FA enabled or app policy requires MFA)
 *   - Phone number verification (SMS channel)
 *   - Email verification at registration (email channel)
 *
 * OTP channel is determined by the identifier type:
 *   - email identifier → email channel
 *   - phone identifier → SMS channel
 *
 * On success for login-type verification, returns fresh JWTs.
 *
 * Body: { email?, phone?, otp, purpose? }
 *   purpose: 'login' | 'verify-email' | 'verify-phone' (default: 'login')
 */
export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req);
  try {
    const body = await req.json();
    const { email, phone, otp, purpose = 'login' } = body;

    if (!otp) {
      return NextResponse.json(
        { success: false, message: 'Verification code is required' },
        { status: 400, headers: cors }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, message: 'Email or phone is required' },
        { status: 400, headers: cors }
      );
    }

    const identifier = email ? email.toLowerCase() : phone;
    const channel: 'email' | 'phone' = email ? 'email' : 'phone';

    // Resolve the user
    const user = await prisma.user.findFirst({
      where: email ? { email: identifier } : { phoneNumber: phone },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatarUrl: true,
        isActive: true,
        isVerified: true,
        isOnboardingComplete: true,
        createdAt: true,
        updatedAt: true,
        userMFA: {
          where: { isEnabled: true },
          select: { mfaType: true, isEnabled: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification attempt' },
        { status: 400, headers: cors }
      );
    }

    // For login purpose: check whether OTP is actually required
    // OTP at login is only required if:
    //   1. User has 2FA enabled (any mfaType), or
    //   2. App SecurityPolicy has mfaRequired = true
    if (purpose === 'login') {
      const has2FA = user.userMFA.length > 0;

      if (!has2FA) {
        // Check app-level policy via X-App-ID / X-App-Slug header
        const appId = req.headers.get('x-app-id');
        const appSlug = req.headers.get('x-app-slug');
        let appMfaRequired = false;

        if (appId || appSlug) {
          const policy = await prisma.securityPolicy.findFirst({
            where: appId
              ? { applicationId: appId }
              : { application: { slug: appSlug! } },
            select: { mfaRequired: true },
          });
          appMfaRequired = policy?.mfaRequired ?? false;
        }

        if (!appMfaRequired) {
          return NextResponse.json(
            { success: false, message: 'OTP verification is not required for this account' },
            { status: 400, headers: cors }
          );
        }
      }
    }

    // Verify the OTP (channel determines which Redis key is checked)
    const valid = await otpService.verifyOtp(identifier, otp);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification code' },
        { status: 400, headers: cors }
      );
    }

    // For phone verification: mark phone as verified via isVerified if not already set
    // For email verification: mark user as verified
    if (purpose === 'verify-phone' || purpose === 'verify-email') {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, verifiedAt: new Date() },
      });
    }

    // Issue fresh JWTs so the caller can proceed authenticated
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

    return NextResponse.json(
      {
        success: true,
        message: 'Verification successful',
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
          isVerified: true,
          isOnboardingComplete: user.isOnboardingComplete,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { headers: cors }
    );
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500, headers: cors }
    );
  }
}
