import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { config } from '@/server/config/env';
import { emailTemplateService } from '@/server/services/emailTemplateService';

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

export async function GET(request: NextRequest) {
  if (!verifyServiceToken(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 20);
    const applicationId = searchParams.get('applicationId') || undefined;

    const result = await emailTemplateService.listTemplates(applicationId, page, limit);

    // Map to SDK MessageTemplate shape
    const templates = result.templates.map((t) => ({
      id: t.id,
      name: t.name,
      channel: 'email' as const,
      subject: t.subject,
      body: t.htmlContent,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({ templates, total: result.total, page: result.page, limit: result.limit });
  } catch (error: any) {
    console.error('[communication/templates] List error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
