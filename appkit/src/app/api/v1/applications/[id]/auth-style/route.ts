import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';

type DeviceType = 'mobileApp' | 'mobileWeb' | 'desktopWeb';
const ALLOWED_DEVICES: DeviceType[] = ['mobileApp', 'mobileWeb', 'desktopWeb'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const requestedDevice = req.nextUrl.searchParams.get('device') as DeviceType | null;

    if (requestedDevice && !ALLOWED_DEVICES.includes(requestedDevice)) {
      return NextResponse.json({ error: 'Invalid device value' }, { status: 400 });
    }

    let app = UUID_REGEX.test(id)
      ? await prisma.application.findUnique({
          where: { id },
          select: { id: true, settings: true }
        })
      : null;

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
    const legacyStyle =
      authStyle &&
      typeof authStyle === 'object' &&
      !Array.isArray(authStyle) &&
      !authStyle.devices
        ? authStyle
        : null;
    const providers = Array.isArray(authStyle.providers) ? authStyle.providers : [];
    const mobileCommonLayout =
      authStyle?.mobileCommonLayout && typeof authStyle.mobileCommonLayout === 'object'
        ? authStyle.mobileCommonLayout
        : null;

    const applyMobileCommonLayout = (style: any, device: DeviceType) => {
      if (!style || (device !== 'mobileApp' && device !== 'mobileWeb') || !mobileCommonLayout) {
        return style
      }
      return {
        ...style,
        ...mobileCommonLayout,
      }
    }

    if (requestedDevice) {
      const resolvedStyle =
        devices[requestedDevice] ||
        devices.desktopWeb ||
        devices.mobileWeb ||
        devices.mobileApp ||
        legacyStyle ||
        null;

      return NextResponse.json({
        appId: app.id,
        device: requestedDevice,
        style: applyMobileCommonLayout(resolvedStyle, requestedDevice),
        mobileCommonLayout,
        providers
      });
    }

    return NextResponse.json({
      appId: app.id,
      devices: Object.keys(devices).length > 0 ? devices : (legacyStyle ? { desktopWeb: legacyStyle } : {}),
      mobileCommonLayout,
      providers
    });
  } catch (error) {
    console.error('Error fetching auth style:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
