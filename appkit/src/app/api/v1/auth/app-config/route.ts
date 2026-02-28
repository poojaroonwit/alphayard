import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const clientId = searchParams.get('client_id');
    const appId = searchParams.get('app_id');

    console.log('[AppConfig API] Received clientId:', clientId, 'appId:', appId);

    let applicationId = appId;

    if (!applicationId && clientId) {
      const cleanClientId = clientId.trim();
      // Find the application by client_id using findFirst to avoid unique constraint matching errors
      const client = await prisma.oAuthClient.findFirst({
        where: { clientId: cleanClientId },
        select: { applicationId: true }
      });
      console.log(`[AppConfig API] Looked up cleanClientId: ${cleanClientId}, Found OAuthClient:`, client);
      if (client?.applicationId) {
        applicationId = client.applicationId;
      }
    }

    if (!applicationId) {
      console.log('[AppConfig API] No applicationId found for this client_id, returning empty branding.');
      return NextResponse.json({ branding: null, providers: [] });
    }


    // Fetch Application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { branding: true, settings: true, name: true, logoUrl: true }
    });

    console.log('[AppConfig API] Found Application:', application);

    if (!application) {
      return NextResponse.json({ branding: null, providers: [] });
    }

    // Fetch related SSO providers (both specific to this app and global ones)
    const providers = await prisma.oAuthProvider.findMany({
      where: {
        OR: [
          { applicationId },
          { applicationId: null }
        ],
        isEnabled: true
      },
      select: {
        id: true,
        providerName: true,
        displayName: true,
        iconUrl: true,
        buttonColor: true,
        buttonText: true,
        authorizationUrl: true,
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });

    return NextResponse.json({
      branding: {
        ...(typeof application.branding === 'object' && application.branding !== null ? application.branding : {}),
        name: application.name,
        logoUrl: application.logoUrl
      },
      settings: application.settings,
      providers
    });
  } catch (error) {
    console.error('Error fetching app config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
