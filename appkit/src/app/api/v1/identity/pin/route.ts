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
    // Accept both mobile users (type: 'user') and admins
    return decoded.id || decoded.adminId || null;
  } catch {
    return null;
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req, 'GET, POST, OPTIONS') });
}

export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders(req, 'GET, POST, OPTIONS');
  const userId = getMobileUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pinCode: true } as any,
    });
    return NextResponse.json({ hasPin: !!user?.pinCode }, { headers: cors });
  } catch (error: any) {
    console.error('Get PIN status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: cors });
  }
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req, 'GET, POST, OPTIONS');
  const userId = getMobileUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });

  try {
    const { pin } = await req.json();
    if (!pin || !/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be 4-6 digits' }, { status: 400, headers: cors });
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { pinCode: hashedPin } as any,
    });

    return NextResponse.json({ success: true, message: 'PIN updated successfully' }, { headers: cors });
  } catch (error: any) {
    console.error('Update PIN error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: cors });
  }
}
