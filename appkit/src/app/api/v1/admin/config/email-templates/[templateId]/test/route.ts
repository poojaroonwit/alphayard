import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { emailTemplateService } from '@/server/services/emailTemplateService';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/v1/admin/config/email-templates/[templateId]/test
 * Send a test render of a template to a given email address.
 * Body: { to: string, data?: Record<string, any> }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const auth = await authenticate(request);
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const templateId = params.templateId;
    if (!UUID_REGEX.test(templateId)) {
      return NextResponse.json({ error: 'Invalid template ID format' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { to, data } = body as { to?: string; data?: Record<string, any> };

    if (!to) {
      return NextResponse.json({ error: 'to is required' }, { status: 400 });
    }

    const sent = await emailTemplateService.sendTestEmail(templateId, to, data || {});
    if (!sent) {
      return NextResponse.json({ error: 'Failed to send test email — template not found or SMTP error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error: any) {
    console.error('[email-templates/test] error:', error);
    return NextResponse.json(
      { error: 'send_failed', error_description: error?.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}
