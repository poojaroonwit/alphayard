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
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        if (decoded.type === 'user') {
          // Revoke all active sessions for this user
          await prisma.userSession.updateMany({
            where: { userId: decoded.id, isActive: true },
            data: { isActive: false, revokedAt: new Date(), revokeReason: 'logout' },
          });
        }
      } catch {
        // Invalid token — still return success
      }
    }

    return NextResponse.json({ success: true, message: 'Logged out successfully' }, { headers: cors });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500, headers: cors }
    );
  }
}
