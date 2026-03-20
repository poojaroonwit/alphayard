import { NextRequest, NextResponse } from 'next/server';
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400, headers: cors }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, isActive: true },
    });

    // Always respond success to prevent user enumeration
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: true, message: 'If an account exists, a reset code has been sent' },
        { headers: cors }
      );
    }

    const otp = await otpService.createOtp(email.toLowerCase(), 'email');

    const response: any = { success: true, message: 'Password reset code sent to your email' };
    if (process.env.NODE_ENV !== 'production') {
      response.debug_otp = otp;
    }

    return NextResponse.json(response, { headers: cors });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500, headers: cors }
    );
  }
}
