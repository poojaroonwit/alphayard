import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { buildCorsHeaders } from '@/server/lib/cors';
import { getAppId } from '@/server/lib/request';
import { otpService } from '@/server/services/OtpService';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req);
  try {
    const body = await req.json();
    const { email, phone } = body;

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, message: 'Email or phone required' },
        { status: 400, headers: cors }
      );
    }

    const user = await prisma.user.findFirst({
      where: email ? { email: email.toLowerCase() } : { phoneNumber: phone },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      // Return success to avoid user enumeration
      return NextResponse.json(
        { success: true, message: 'If an account exists, a code has been sent' },
        { headers: cors }
      );
    }

    const identifier = email ? email.toLowerCase() : phone;
    const type = email ? 'email' : 'phone';
    const otp = await otpService.createOtp(identifier, type as 'email' | 'phone', getAppId(req));

    const response: any = { success: true, message: 'Verification code sent' };

    // Only expose OTP in development for debugging
    if (process.env.NODE_ENV !== 'production') {
      response.debug_otp = otp;
    }

    return NextResponse.json(response, { headers: cors });
  } catch (error: any) {
    console.error('OTP request error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send code' },
      { status: 500, headers: cors }
    );
  }
}
