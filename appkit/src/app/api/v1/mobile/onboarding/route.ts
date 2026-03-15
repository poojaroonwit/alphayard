import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { buildCorsHeaders } from '@/server/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

/**
 * GET /api/v1/mobile/onboarding
 * Returns onboarding screen config for the mobile app.
 */
export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders(req)
  try {
    const row = await prisma.systemConfig.findUnique({ where: { key: 'onboarding_config' } });
    const onboarding = (row?.value as any) || { screens: [], enabled: false };
    return NextResponse.json({ onboarding }, { headers: cors });
  } catch (error: any) {
    console.error('[mobile/onboarding] error:', error);
    return NextResponse.json({ onboarding: { screens: [], enabled: false } }, { headers: cors });
  }
}
