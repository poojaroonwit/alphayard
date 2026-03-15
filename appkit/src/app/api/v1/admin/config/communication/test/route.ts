import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import nodemailer from 'nodemailer';

/**
 * POST /api/v1/admin/config/communication/test
 * Send a test email using the provided (or saved) SMTP config.
 * Body: { to: string, smtp?: { host, port, secure, username, password, fromEmail, fromName } }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { to, smtp } = body as {
      to?: string;
      smtp?: { host?: string; port?: number; secure?: boolean; username?: string; password?: string; fromEmail?: string; fromName?: string };
    };

    if (!to) {
      return NextResponse.json({ error: 'to is required' }, { status: 400 });
    }

    // Build SMTP config — prefer body fields, fall back to env vars
    const host = smtp?.host || process.env.SMTP_HOST || '';
    const port = Number(smtp?.port || process.env.SMTP_PORT || 587);
    const secure = smtp?.secure ?? (process.env.SMTP_SECURE === 'true');
    const user = smtp?.username || process.env.SMTP_USER || '';
    const pass = smtp?.password || process.env.SMTP_PASS || '';
    const fromEmail = smtp?.fromEmail || process.env.SMTP_FROM || 'noreply@example.com';
    const fromName = smtp?.fromName || 'AppKit';

    if (!host) {
      return NextResponse.json({ error: 'SMTP host is not configured' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });

    await transporter.verify();
    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: 'AppKit SMTP Test',
      html: `<p>This is a test email from <strong>AppKit</strong>. Your SMTP configuration is working correctly.</p>`,
      text: 'This is a test email from AppKit. Your SMTP configuration is working correctly.',
    });

    return NextResponse.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error: any) {
    console.error('[communication/test] SMTP test error:', error);
    return NextResponse.json(
      { error: 'smtp_test_failed', error_description: error?.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}
