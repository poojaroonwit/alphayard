import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';

/**
 * GET /api/v1/mobile/onboarding
 * Returns onboarding screen config for the mobile app.
 */
export async function GET(req: NextRequest) {
  try {
    const row = await prisma.systemConfig.findUnique({ where: { key: 'onboarding_config' } });
    const onboarding = (row?.value as any) || { screens: [], enabled: false };
    return NextResponse.json({ onboarding });
  } catch (error: any) {
    console.error('[mobile/onboarding] error:', error);
    return NextResponse.json({ onboarding: { screens: [], enabled: false } });
  }
}
