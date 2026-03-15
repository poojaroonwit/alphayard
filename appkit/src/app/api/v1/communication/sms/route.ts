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

interface SmsProviderConfig {
  type: 'twilio' | 'vonage';
  accountSid?: string;
  authToken?: string;
  apiKey?: string;
  apiSecret?: string;
  fromNumber: string;
}

async function getSmsConfig(): Promise<SmsProviderConfig | null> {
  const row = await prisma.systemConfig.findUnique({ where: { key: 'default_comm_config' } });
  if (!row?.value) return null;
  const commCfg = row.value as any;
  const twilioProvider = Array.isArray(commCfg.providers)
    ? commCfg.providers.find((p: any) => p.type === 'twilio' && p.enabled)
    : null;
  if (twilioProvider?.settings?.accountSid) {
    return { type: 'twilio', ...twilioProvider.settings };
  }
  const vonageProvider = Array.isArray(commCfg.providers)
    ? commCfg.providers.find((p: any) => p.type === 'vonage' && p.enabled)
    : null;
  if (vonageProvider?.settings?.apiKey) {
    return { type: 'vonage', ...vonageProvider.settings };
  }
  return null;
}

async function sendViaTwilio(to: string, message: string, cfg: SmsProviderConfig): Promise<string> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`;
  const body = new URLSearchParams({ To: to, From: cfg.fromNumber, Body: message });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString('base64')}`,
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err?.message || `Twilio error ${res.status}`);
  }
  const result = await res.json() as any;
  return result.sid || `twilio-${Date.now()}`;
}

async function sendViaVonage(to: string, message: string, cfg: SmsProviderConfig): Promise<string> {
  const res = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: cfg.apiKey,
      api_secret: cfg.apiSecret,
      to,
      from: cfg.fromNumber,
      text: message,
    }),
  });
  if (!res.ok) throw new Error(`Vonage error ${res.status}`);
  const result = await res.json() as any;
  const firstMsg = result?.messages?.[0];
  if (firstMsg?.status !== '0') {
    throw new Error(firstMsg?.['error-text'] || 'Vonage send failed');
  }
  return firstMsg?.['message-id'] || `vonage-${Date.now()}`;
}

/**
 * POST /api/v1/communication/sms
 * Send an SMS message.
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

    const smsConfig = await getSmsConfig();
    if (!smsConfig) {
      console.warn('[communication/sms] No SMS provider configured');
      return NextResponse.json({ messageId: `no-sms-provider-${Date.now()}` });
    }

    // Simple template rendering (replace {{key}} placeholders)
    let message = template;
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      }
    }

    let messageId: string;
    if (smsConfig.type === 'twilio') {
      messageId = await sendViaTwilio(to, message, smsConfig);
    } else {
      messageId = await sendViaVonage(to, message, smsConfig);
    }

    console.log(`[communication/sms] SMS sent via ${smsConfig.type} to ${to}:`, messageId);
    return NextResponse.json({ messageId });
  } catch (error: any) {
    console.error('[communication/sms] error:', error);
    return NextResponse.json(
      { error: 'send_failed', error_description: error?.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
