import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { buildCorsHeaders } from '@/server/lib/cors';

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
        { exists: false, message: 'Email or phone is required' },
        { status: 400, headers: cors }
      );
    }

    let user = null;

    if (email) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true, email: true, phoneNumber: true, isActive: true,
          userMFA: { where: { isEnabled: true }, select: { mfaType: true } },
        },
      });
    } else if (phone) {
      user = await prisma.user.findFirst({
        where: { phoneNumber: phone },
        select: {
          id: true, email: true, phoneNumber: true, isActive: true,
          userMFA: { where: { isEnabled: true }, select: { mfaType: true } },
        },
      });
    }

    if (!user) {
      return NextResponse.json({ exists: false, isActive: false }, { headers: cors });
    }

    const mfaTypes = user.userMFA.map((m) => m.mfaType);
    const availableChannels: string[] = [];
    if (user.email) availableChannels.push('email');
    if (user.phoneNumber) availableChannels.push('sms');
    if (mfaTypes.includes('totp')) availableChannels.push('totp');

    return NextResponse.json(
      {
        exists: true,
        isActive: user.isActive,
        hasMfa: user.userMFA.length > 0,
        availableChannels,
        email: user.email,
        phoneNumber: user.phoneNumber ?? undefined,
      },
      { headers: cors }
    );
  } catch (error: any) {
    console.error('Check user error:', error);
    return NextResponse.json(
      { exists: false, message: 'Failed to check user' },
      { status: 500, headers: cors }
    );
  }
}
