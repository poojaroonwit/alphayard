import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/lib/prisma';
import { config } from '@/server/config/env';
import { buildCorsHeaders } from '@/server/lib/cors';

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
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req, 'GET, OPTIONS') });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  const cors = buildCorsHeaders(req, 'GET, OPTIONS');
  const userId = getMobileUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });

  const { name } = params;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    if (name === 'circles') {
      const where = {
        OR: [
          { members: { some: { userId } } },
          { owners: { some: { userId } } },
        ],
      };

      const [total, circles] = await Promise.all([
        prisma.circle.count({ where }),
        prisma.circle.findMany({
          where,
          include: {
            members: {
              include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
            },
            owners: {
              include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      const items = circles.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        type: c.circleType,
        inviteCode: c.circleCode,
        createdAt: c.createdAt,
        ownerId: c.owners[0]?.userId,
        members: c.members.map((m) => ({
          id: m.user.id,
          firstName: m.user.firstName,
          lastName: m.user.lastName,
          email: m.user.email,
          avatar: m.user.avatarUrl,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      }));

      return NextResponse.json({ success: true, items, total, page, limit }, { headers: cors });
    }

    // Unknown collection
    return NextResponse.json({ error: `Collection '${name}' not found` }, { status: 404, headers: cors });
  } catch (error: any) {
    console.error(`Collection ${name} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: cors });
  }
}
