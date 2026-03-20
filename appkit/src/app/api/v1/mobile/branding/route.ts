import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { buildCorsHeaders } from '@/server/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req, 'GET, OPTIONS') })
}

/**
 * GET /api/v1/mobile/branding
 * Returns branding/theme config for the mobile app.
 */
export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders(req, 'GET, OPTIONS')
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');
    const appId = searchParams.get('app_id');

    let applicationId = appId;
    if (!applicationId && clientId) {
      const client = await prisma.oAuthClient.findFirst({
        where: { clientId },
        select: { applicationId: true },
      });
      if (client?.applicationId) applicationId = client.applicationId;
    }

    if (!applicationId) {
      return NextResponse.json({ branding: {} }, { headers: cors });
    }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { branding: true, name: true, logoUrl: true },
    });

    const brandingData = (typeof app?.branding === 'object' && app.branding !== null)
      ? app.branding
      : {};

    return NextResponse.json({
      branding: { ...brandingData, name: app?.name, logoUrl: app?.logoUrl },
    }, { headers: cors });
  } catch (error: any) {
    console.error('[mobile/branding] error:', error);
    return NextResponse.json({ branding: {} }, { headers: cors });
  }
}
