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

export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders(req, 'GET, OPTIONS');
  const userId = getMobileUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });

  try {
    const [incidents, contacts] = await Promise.all([
      prisma.safetyIncident.count({ where: { userId } }),
      prisma.emergencyContact.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalIncidents: incidents,
        activeAlerts: 0,
        resolvedIncidents: incidents,
        emergencyContacts: contacts,
      },
    }, { headers: cors });
  } catch {
    // Return zeroed stats if models don't exist yet
    return NextResponse.json({
      success: true,
      stats: {
        totalIncidents: 0,
        activeAlerts: 0,
        resolvedIncidents: 0,
        emergencyContacts: 0,
      },
    }, { headers: cors });
  }
}
