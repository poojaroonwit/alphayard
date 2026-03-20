import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/server/lib/prisma';
import { buildCorsHeaders } from '@/server/lib/cors';
import { otpService } from '@/server/services/OtpService';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req);
  try {
    const body = await req.json();
    const { email, otp, password } = body;

    if (!email || !otp || !password) {
      return NextResponse.json(
        { success: false, message: 'Email, OTP code, and new password are required' },
        { status: 400, headers: cors }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400, headers: cors }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Verify the OTP (issued by forgot-password via email channel)
    const valid = await otpService.verifyOtp(normalizedEmail, otp);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset code' },
        { status: 400, headers: cors }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404, headers: cors }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json(
      { success: true, message: 'Password reset successfully' },
      { headers: cors }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset password' },
      { status: 500, headers: cors }
    );
  }
}
