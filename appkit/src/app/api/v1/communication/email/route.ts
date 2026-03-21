import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { config } from '@/server/config/env';
import { getAppId } from '@/server/lib/request';
import { communicationService } from '@/server/services/CommunicationService';

function verifyServiceToken(authHeader: string | null): { clientId: string } | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }) as any;
    if (payload.grant_type !== 'client_credentials') return null;
    return { clientId: payload.client_id || payload.sub };
  } catch {
    return null;
  }
}

/**
 * POST /api/v1/communication/email
 * Send an email via the PRIMARY email provider using a named template.
 * Requires service token (client_credentials grant).
 * Body: { to: string, template: string, subject?: string, data?: Record<string, any> }
 */
export async function POST(request: NextRequest) {
  const auth = verifyServiceToken(request.headers.get('authorization'));
  if (!auth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, template, subject, data } = body;

    if (!to || !template) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'to and template are required' },
        { status: 400 }
      );
    }

    const result = await communicationService.sendEmailByTemplate({
      slug: template,
      to,
      subject,
      data: data || {},
      applicationId: getAppId(request),
    });

    return NextResponse.json({ messageId: result.messageId });
  } catch (error: any) {
    console.error('[communication/email] Send error:', error);
    return NextResponse.json(
      { error: 'send_failed', error_description: error?.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
