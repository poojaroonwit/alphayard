import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';

// In-memory OTP store: key = email|phone, value = { otp, expiresAt }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone } = body;

    const identifier = email?.toLowerCase() || phone;
    if (!identifier) {
      return NextResponse.json({ success: false, message: 'Email or phone required' }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findFirst({
      where: email
        ? { email: email.toLowerCase() }
        : { phoneNumber: phone },
      select: { id: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      // Return success anyway to avoid user enumeration
      return NextResponse.json({ success: true, message: 'If an account exists, a code has been sent' });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(identifier, { otp, expiresAt });

    // Log OTP for development (replace with email/SMS sending in production)
    console.log(`[OTP] Code for ${identifier}: ${otp}`);

    const isDev = process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      ...(isDev && { debug_otp: otp }),
    });
  } catch (error: any) {
    console.error('OTP request error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send code' }, { status: 500 });
  }
}

// Export the store so the login route can access it
export { otpStore };
