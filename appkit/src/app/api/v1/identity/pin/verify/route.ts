import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/lib/prisma';
import { config } from '@/server/config/env';
import { buildCorsHeaders } from '@/server/lib/cors';
import bcrypt from 'bcrypt';

function getMobileUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    return decoded.id || decoded.adminId || null;
  } catch {
    return null;
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req);
  const userId = getMobileUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });

  try {
    const { pin } = await req.json();
    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400, headers: cors });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pinCode: true } as any,
    });

    if (!user || !user.pinCode) {
      return NextResponse.json({ error: 'PIN not set', verified: false }, { status: 404, headers: cors });
    }

    const isValid = await bcrypt.compare(pin, user.pinCode);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid PIN', verified: false }, { status: 401, headers: cors });
    }

    return NextResponse.json({ success: true, verified: true, message: 'PIN verified successfully' }, { headers: cors });
  } catch (error: any) {
    console.error('Verify PIN error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: cors });
  }
}
