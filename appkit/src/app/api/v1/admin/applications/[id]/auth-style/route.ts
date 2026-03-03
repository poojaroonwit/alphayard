import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const { devices, providers, mobileCommonLayout } = body;

    // First try finding an Application by its actual ID
    let app = UUID_REGEX.test(id)
      ? await prisma.application.findUnique({
          where: { id }
        })
      : null;

    // If not found, it might be a client_id that the user pasted in the dashboard.
    // Try finding the Application linked to this client_id to be helpful.
    if (!app) {
      const oauthClient = await prisma.oAuthClient.findUnique({
        where: { clientId: id },
        include: { application: true }
      });
      if (oauthClient && oauthClient.application) {
        app = oauthClient.application;
      }
    }

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Merge settings into the application's settings JSON field if needed,
    // or store auth style inside branding or settings. 
    // AppKit components like LoginPageContent expect settings.authStyle or similar.
    const currentSettings = typeof app.settings === 'string' 
      ? JSON.parse(app.settings || '{}') 
      : (app.settings || {});

    // Update the auth style inside settings
    const updatedSettings = {
      ...currentSettings,
      authStyle: {
        devices,
        providers,
        mobileCommonLayout: mobileCommonLayout || currentSettings?.authStyle?.mobileCommonLayout || null,
      }
    };

    const updatedApp = await prisma.application.update({
      where: { id: app.id },
      data: {
        settings: updatedSettings
      }
    });

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (error) {
    console.error('Error updating auth style:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
