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
        select: { id: true, email: true, isActive: true },
      });
    } else if (phone) {
      user = await prisma.user.findFirst({
        where: { phoneNumber: phone },
        select: { id: true, email: true, isActive: true },
      });
    }

    return NextResponse.json(
      { exists: !!user, isActive: user?.isActive ?? false },
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
