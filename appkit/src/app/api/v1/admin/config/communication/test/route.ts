import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import nodemailer from 'nodemailer';

type Cfg = Record<string, string>;

/** Rejects after ms milliseconds with a timeout error */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Connection timed out after ${ms / 1000}s — check host/port and firewall`)), ms)
    ),
  ]);
}

// ─── Email ─────────────────────────────────────────────────────────────────

async function testSmtp(to: string, cfg: Cfg) {
  const host = cfg.host || '';
  if (!host) throw new Error('SMTP host is required');
  const transporter = nodemailer.createTransport({
    host,
    port: Number(cfg.port || 587),
    secure: cfg.secure === 'true',
    auth: cfg.username ? { user: cfg.username, pass: cfg.password || '' } : undefined,
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 10_000,
  });
  await withTimeout(transporter.verify(), 10_000);
  await withTimeout(
    transporter.sendMail({
      from: `${cfg.fromName || 'AppKit'} <${cfg.fromEmail || 'noreply@example.com'}>`,
      to,
      subject: 'AppKit SMTP Test',
      html: '<p>This is a test email from <strong>AppKit</strong>. Your SMTP configuration is working correctly.</p>',
      text: 'This is a test email from AppKit. Your SMTP configuration is working correctly.',
    }),
    12_000,
  );
}

async function testSendgrid(to: string, cfg: Cfg) {
  if (!cfg.apiKey) throw new Error('SendGrid API key is required');
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: cfg.fromEmail || 'noreply@appkit.com', name: cfg.fromName || 'AppKit' },
      subject: 'AppKit SendGrid Test',
      content: [{ type: 'text/plain', value: 'This is a test email from AppKit via SendGrid. Your configuration is working.' }],
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).errors?.[0]?.message || `SendGrid error: ${res.status}`);
  }
}

async function testMailgun(to: string, cfg: Cfg) {
  if (!cfg.apiKey) throw new Error('Mailgun API key is required');
  if (!cfg.domain) throw new Error('Mailgun domain is required');
  const auth = Buffer.from(`api:${cfg.apiKey}`).toString('base64');
  const params = new URLSearchParams({
    from: cfg.fromEmail || `noreply@${cfg.domain}`,
    to,
    subject: 'AppKit Mailgun Test',
    text: 'This is a test email from AppKit via Mailgun. Your configuration is working.',
  });
  const res = await fetch(`https://api.mailgun.net/v3/${cfg.domain}/messages`, {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).message || `Mailgun error: ${res.status}`);
  }
}

async function testSes(to: string, cfg: Cfg) {
  // SES REST requires AWS Signature v4 (no SDK installed).
  // Validate required fields and return config-check result.
  if (!cfg.accessKeyId) throw new Error('Access Key ID is required');
  if (!cfg.secretAccessKey) throw new Error('Secret Access Key is required');
  if (!cfg.region) throw new Error('Region is required');
  // Lightweight SES connectivity check: attempt to list identities (GetSendQuota) — skipped without SDK.
  // Return config-validated message so the user knows credentials were accepted.
  return { success: true, message: `SES config validated for region ${cfg.region}. To fully test, send a real email through your application.` };
}

// ─── SMS ───────────────────────────────────────────────────────────────────

async function testTwilio(to: string, cfg: Cfg) {
  if (!cfg.accountSid) throw new Error('Account SID is required');
  if (!cfg.authToken) throw new Error('Auth Token is required');
  if (!cfg.fromNumber) throw new Error('From Number is required');
  const auth = Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString('base64');
  const params = new URLSearchParams({ From: cfg.fromNumber, To: to, Body: 'AppKit test message. Your Twilio SMS configuration is working.' });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`, {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Twilio error: ${res.status}`);
}

async function testVonage(to: string, cfg: Cfg) {
  if (!cfg.apiKey) throw new Error('API Key is required');
  if (!cfg.apiSecret) throw new Error('API Secret is required');
  const res = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: cfg.apiKey,
      api_secret: cfg.apiSecret,
      from: cfg.fromNumber || 'AppKit',
      to: to.replace(/^\+/, ''),
      text: 'AppKit test message. Your Vonage SMS configuration is working.',
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  const msg = data.messages?.[0];
  if (msg?.status !== '0') throw new Error(msg?.['error-text'] || `Vonage error: status ${msg?.status}`);
}

async function testMessagebird(to: string, cfg: Cfg) {
  if (!cfg.accessKey) throw new Error('Access Key is required');
  const res = await fetch('https://rest.messagebird.com/messages', {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `AccessKey ${cfg.accessKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originator: cfg.originator || 'AppKit',
      recipients: [to.replace(/^\+/, '')],
      body: 'AppKit test message. Your MessageBird configuration is working.',
    }),
  });
  if (!res.ok) {
    const data: any = await res.json().catch(() => ({}));
    throw new Error(data.errors?.[0]?.description || `MessageBird error: ${res.status}`);
  }
}

// ─── Push ──────────────────────────────────────────────────────────────────

async function testFirebase(to: string, cfg: Cfg) {
  if (!cfg.serverKey) throw new Error('Server Key is required');
  if (!to) throw new Error('Device token is required');
  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `key=${cfg.serverKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      notification: { title: 'AppKit Test Notification', body: 'Your Firebase push notification configuration is working.' },
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (data.failure === 1) throw new Error(data.results?.[0]?.error || 'FCM rejected the request');
  if (!res.ok) throw new Error(`Firebase error: ${res.status}`);
}

async function testOnesignal(to: string, cfg: Cfg) {
  if (!cfg.appId) throw new Error('App ID is required');
  if (!cfg.apiKey) throw new Error('REST API Key is required');
  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Basic ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: cfg.appId,
      include_player_ids: [to],
      headings: { en: 'AppKit Test Notification' },
      contents: { en: 'Your OneSignal push notification configuration is working.' },
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (data.errors) throw new Error(Array.isArray(data.errors) ? data.errors[0] : JSON.stringify(data.errors));
  if (!res.ok) throw new Error(`OneSignal error: ${res.status}`);
}

async function testApns(cfg: Cfg) {
  // APNs requires HTTP/2 + ES256 JWT with a .p8 private key — not feasible without native http2 client.
  // Validate required fields instead.
  if (!cfg.keyId) throw new Error('Key ID is required');
  if (!cfg.teamId) throw new Error('Team ID is required');
  if (!cfg.bundleId) throw new Error('Bundle ID is required');
  return { success: true, message: 'APNs config fields validated. A live device-token test requires native HTTP/2 which is not available in this environment. Use your app to send a real push and verify delivery.' };
}

// ─── Route ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Legacy SMTP-only body (backward compat)
    if (!body.channel && body.smtp) {
      const { to, smtp } = body as { to?: string; smtp?: Cfg };
      if (!to) return NextResponse.json({ error: 'to is required' }, { status: 400 });
      await testSmtp(to, smtp || {});
      return NextResponse.json({ success: true, message: `Test email sent to ${to}` });
    }

    const { channel, provider, to, config: cfg = {} } = body as {
      channel?: 'email' | 'sms' | 'push';
      provider?: string;
      to?: string;
      config?: Cfg;
    };

    if (!channel || !provider) {
      return NextResponse.json({ error: 'channel and provider are required' }, { status: 400 });
    }

    let earlyReturn: { success: boolean; message: string } | null = null;

    if (channel === 'email') {
      if (!to) return NextResponse.json({ error: 'Recipient email (to) is required' }, { status: 400 });
      if (provider === 'smtp') await testSmtp(to, cfg);
      else if (provider === 'sendgrid') await testSendgrid(to, cfg);
      else if (provider === 'mailgun') await testMailgun(to, cfg);
      else if (provider === 'ses') earlyReturn = await testSes(to, cfg) as any;
      else return NextResponse.json({ error: `Unknown email provider: ${provider}` }, { status: 400 });
    } else if (channel === 'sms') {
      if (!to) return NextResponse.json({ error: 'Recipient phone number (to) is required' }, { status: 400 });
      if (provider === 'twilio') await testTwilio(to, cfg);
      else if (provider === 'vonage') await testVonage(to, cfg);
      else if (provider === 'messagebird') await testMessagebird(to, cfg);
      else return NextResponse.json({ error: `Unknown SMS provider: ${provider}` }, { status: 400 });
    } else if (channel === 'push') {
      if (provider === 'firebase') {
        if (!to) return NextResponse.json({ error: 'Device token (to) is required' }, { status: 400 });
        await testFirebase(to, cfg);
      } else if (provider === 'onesignal') {
        if (!to) return NextResponse.json({ error: 'Player ID / device token (to) is required' }, { status: 400 });
        await testOnesignal(to, cfg);
      } else if (provider === 'apns') {
        earlyReturn = await testApns(cfg) as any;
      } else {
        return NextResponse.json({ error: `Unknown push provider: ${provider}` }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: `Invalid channel: ${channel}` }, { status: 400 });
    }

    if (earlyReturn) return NextResponse.json(earlyReturn);
    const destination = to ? ` to ${to}` : '';
    return NextResponse.json({ success: true, message: `Test ${channel} sent${destination} via ${provider}` });
  } catch (error: any) {
    console.error('[communication/test] error:', error);
    const msg = error?.message || 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'test_failed', message: msg, error_description: msg },
      { status: 500 },
    );
  }
}
