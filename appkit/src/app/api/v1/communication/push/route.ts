import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { config } from '@/server/config/env';
import { prisma } from '@/server/lib/prisma';

function verifyServiceToken(authHeader: string | null): boolean {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }) as any;
    return payload.grant_type === 'client_credentials';
  } catch {
    return false;
  }
}

async function getFirebaseConfig(): Promise<{ serverKey: string; projectId: string } | null> {
  const row = await prisma.systemConfig.findUnique({ where: { key: 'default_comm_config' } });
  if (!row?.value) return null;
  const commCfg = row.value as any;
  const provider = Array.isArray(commCfg.providers)
    ? commCfg.providers.find((p: any) => p.type === 'firebase' && p.enabled)
    : null;
  if (!provider?.settings?.serverKey) return null;
  return { serverKey: provider.settings.serverKey, projectId: provider.settings.projectId };
}

/**
 * POST /api/v1/communication/push
 * Send a push notification to a user's registered devices.
 * Requires service token (client_credentials grant).
 * Body: { userId: string, title: string, body: string, data?: object, imageUrl?: string }
 */
export async function POST(request: NextRequest) {
  if (!verifyServiceToken(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, title, body: msgBody, data, imageUrl } = body;

    if (!userId || !title || !msgBody) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'userId, title, and body are required' },
        { status: 400 }
      );
    }

    // Save in-app notification regardless of push provider
    await prisma.notification.create({
      data: {
        userId,
        type: 'push',
        title,
        body: msgBody,
        data: data || {},
        imageUrl: imageUrl || null,
        isRead: false,
      },
    });

    // Attempt Firebase FCM push if configured
    const firebase = await getFirebaseConfig();
    if (firebase) {
      const tokens = await prisma.userPushToken.findMany({
        where: { userId, isActive: true },
        select: { token: true, platform: true },
      });

      if (tokens.length > 0) {
        const fcmPayload = {
          registration_ids: tokens.map(t => t.token),
          notification: { title, body: msgBody, ...(imageUrl ? { image: imageUrl } : {}) },
          data: data || {},
        };

        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${firebase.serverKey}`,
          },
          body: JSON.stringify(fcmPayload),
        });

        if (!fcmResponse.ok) {
          const errText = await fcmResponse.text();
          console.error('[communication/push] FCM error:', errText);
        } else {
          console.log(`[communication/push] FCM push sent to ${tokens.length} device(s) for user ${userId}`);
        }
      }
    } else {
      console.warn('[communication/push] No Firebase config found; in-app notification saved only');
    }

    return NextResponse.json({ messageId: `push-${Date.now()}` });
  } catch (error: any) {
    console.error('[communication/push] error:', error);
    return NextResponse.json(
      { error: 'send_failed', error_description: error?.message || 'Failed to send push notification' },
      { status: 500 }
    );
  }
}
