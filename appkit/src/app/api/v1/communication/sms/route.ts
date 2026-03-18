import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { config } from '@/server/config/env';
import { communicationService } from '@/server/services/CommunicationService';

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

/**
 * POST /api/v1/communication/sms
 * Send an SMS message via the PRIMARY SMS provider.
 * Requires service token (client_credentials grant).
 * Body: { to: string, template: string, data?: Record<string, any> }
 */
export async function POST(request: NextRequest) {
  if (!verifyServiceToken(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, template, data } = body as { to?: string; template?: string; data?: Record<string, any> };

    if (!to || !template) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'to and template are required' },
        { status: 400 }
      );
    }

    // Simple template rendering (replace {{key}} placeholders)
    let message = template;
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      }
    }

    const result = await communicationService.sendSms(to, message);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[communication/sms] error:', error);
    return NextResponse.json(
      { error: 'send_failed', error_description: error?.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
