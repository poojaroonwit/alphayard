import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const clientId = searchParams.get('client_id');
    const appId = searchParams.get('app_id');

    let applicationId = appId;

    if (!applicationId && clientId) {
      // Find the application by client_id
      const client = await prisma.oAuthClient.findUnique({
        where: { clientId },
        select: { applicationId: true }
      });
      if (client?.applicationId) {
        applicationId = client.applicationId;
      }
    }

    if (!applicationId) {
      return NextResponse.json({ branding: null, providers: [] });
    }

    // Fetch Application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { branding: true, settings: true, name: true, logoUrl: true }
    });

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
