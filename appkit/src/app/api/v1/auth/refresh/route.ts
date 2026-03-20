import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/lib/prisma';
import { config } from '@/server/config/env';
import { buildCorsHeaders } from '@/server/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req);
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token required' },
        { status: 400, headers: cors }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, config.JWT_SECRET) as any;
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired refresh token' },
        { status: 401, headers: cors }
      );
    }

    if (decoded.type !== 'refresh') {
      return NextResponse.json(
        { success: false, message: 'Invalid token type' },
        { status: 401, headers: cors }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'User not found or inactive' },
        { status: 401, headers: cors }
      );
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, type: 'user' },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const newRefreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      { success: true, accessToken, refreshToken: newRefreshToken },
      { headers: cors }
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to refresh token' },
      { status: 500, headers: cors }
    );
  }
}
