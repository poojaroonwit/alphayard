import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';

type DeviceType = 'mobileApp' | 'mobileWeb' | 'desktopWeb';
const ALLOWED_DEVICES: DeviceType[] = ['mobileApp', 'mobileWeb', 'desktopWeb'];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const requestedDevice = req.nextUrl.searchParams.get('device') as DeviceType | null;

    if (requestedDevice && !ALLOWED_DEVICES.includes(requestedDevice)) {
      return NextResponse.json({ error: 'Invalid device value' }, { status: 400 });
    }

    let app = await prisma.application.findUnique({
      where: { id },
      select: { id: true, settings: true }
    });

    // Backward-compatibility: allow OAuth client_id in place of app ID.
    if (!app) {
      const oauthClient = await prisma.oAuthClient.findUnique({
        where: { clientId: id },
        include: {
          application: {
            select: { id: true, settings: true }
          }
        }
      });
      if (oauthClient?.application) {
        app = oauthClient.application;
      }
    }

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const settings =
      typeof app.settings === 'string'
        ? JSON.parse(app.settings || '{}')
        : (app.settings || {});
    const authStyle = settings?.authStyle || {};

    const devices = authStyle.devices || {};
    const providers = Array.isArray(authStyle.providers) ? authStyle.providers : [];

    if (requestedDevice) {
      return NextResponse.json({
        appId: app.id,
        device: requestedDevice,
        style: devices[requestedDevice] || null,
        providers
      });
    }

    return NextResponse.json({
      appId: app.id,
      devices,
      providers
    });
  } catch (error) {
    console.error('Error fetching auth style:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
