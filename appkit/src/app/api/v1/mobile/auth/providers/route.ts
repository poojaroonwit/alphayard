import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { buildCorsHeaders } from '@/server/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req, 'GET, OPTIONS') })
}

/**
 * GET /api/v1/mobile/auth/providers
 * Returns enabled SSO/OAuth providers for the mobile app login screen.
 * Called by the AppKit SDK's BrandingModule.getSSOProviders().
 */
export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders(req, 'GET, OPTIONS')
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');
    const appId = searchParams.get('app_id');

    let applicationId = appId;

    // Resolve applicationId from clientId if needed
    if (!applicationId && clientId) {
      const client = await prisma.oAuthClient.findFirst({
        where: { clientId },
        select: { applicationId: true },
      });
      if (client?.applicationId) applicationId = client.applicationId;
    }

    const where: any = { isEnabled: true };
    if (applicationId) {
      where.OR = [{ applicationId }, { applicationId: null }];
    }

    const providersRaw = await prisma.oAuthProvider.findMany({
      where,
      select: {
        id: true,
        providerName: true,
        displayName: true,
        iconUrl: true,
        buttonColor: true,
        buttonText: true,
        authorizationUrl: true,
        scopes: true,
        platformConfig: true,
        displayOrder: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    const providers = providersRaw.map((p) => ({
      id: p.id,
      providerName: p.providerName,
      displayName: p.displayName,
      iconUrl: p.iconUrl,
      buttonColor: p.buttonColor,
      buttonText: p.buttonText,
      authorizationUrl: p.authorizationUrl,
      scopes: p.scopes,
      platformConfig: p.platformConfig,
    }));

    return NextResponse.json({ providers }, { headers: cors });
  } catch (error: any) {
    console.error('[mobile/auth/providers] error:', error);
    return NextResponse.json({ providers: [] }, { headers: cors });
  }
}
