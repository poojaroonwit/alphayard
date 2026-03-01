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
      
      // UUID Validation regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUuid = uuidRegex.test(cleanClientId);

      if (isValidUuid) {
        // First, try to find an Application directly if the clientId is actually an Application ID
        try {
          const directApp = await prisma.application.findUnique({
            where: { id: cleanClientId },
            select: { id: true }
          });

          if (directApp) {
            console.log(`[AppConfig API] Found Application directly using clientId as App ID:`, directApp.id);
            applicationId = directApp.id;
          }
        } catch (e) {
          console.error('[AppConfig API] Error querying Application by ID:', e);
        }
      }

      if (!applicationId) {
        // Find the application by client_id in OAuthClient
        try {
          const client = await prisma.oAuthClient.findFirst({
            where: { clientId: cleanClientId },
            select: { applicationId: true }
          });
          console.log(`[AppConfig API] Looked up cleanClientId: ${cleanClientId}, Found OAuthClient by clientId:`, client);
          if (client?.applicationId) {
            applicationId = client.applicationId;
          }
        } catch (e) {
          console.error('[AppConfig API] Error querying OAuthClient by clientId:', e);
        }
      }

      if (!applicationId && isValidUuid) {
        // Find the application by OAuthClient ID (UUID)
        try {
          const client = await prisma.oAuthClient.findUnique({
            where: { id: cleanClientId },
            select: { applicationId: true }
          });
          console.log(`[AppConfig API] Looked up cleanClientId: ${cleanClientId}, Found OAuthClient by ID:`, client);
          if (client?.applicationId) {
            applicationId = client.applicationId;
          }
        } catch (e) {
          console.error('[AppConfig API] Error querying OAuthClient by ID:', e);
        }
      }
    }

    if (!applicationId) {
      console.log('[AppConfig API] No applicationId found for this client_id:', clientId);
      return NextResponse.json({ branding: null, providers: [] });
    }

    // UUID Validation for applicationId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(applicationId)) {
      console.log('[AppConfig API] Invalid UUID format for applicationId:', applicationId);
      return NextResponse.json({ branding: null, providers: [] });
    }

    try {
      // Fetch Application
      console.log('[AppConfig API] Querying Application with ID:', applicationId);
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { branding: true, settings: true, name: true, logoUrl: true }
      });

      console.log('[AppConfig API] Found Application result:', application ? 'Yes' : 'No');

      if (!application) {
        return NextResponse.json({ branding: null, providers: [] });
      }

      // Fetch related SSO providers (both specific to this app and global ones)
      console.log('[AppConfig API] Querying SSO Providers for applicationId:', applicationId);
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

      console.log('[AppConfig API] Found SSO Providers count:', providers.length);

      const brandingData = typeof application.branding === 'object' && application.branding !== null 
        ? application.branding 
        : {};

      return NextResponse.json({
        branding: {
          ...brandingData,
          name: application.name,
          logoUrl: application.logoUrl
        },
        settings: application.settings,
        providers
      });
    } catch (innerError) {
      console.error('[AppConfig API] Critical error during DB queries:', innerError);
      throw innerError;
    }
  } catch (error: any) {
    console.error('[AppConfig API] Error fetching app config:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error?.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}
