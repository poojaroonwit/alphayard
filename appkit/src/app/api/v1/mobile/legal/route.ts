import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';

/**
 * GET /api/v1/mobile/legal
 * Returns legal documents (ToS, Privacy Policy) for the mobile app.
 */
export async function GET(req: NextRequest) {
  try {
    const row = await prisma.systemConfig.findUnique({ where: { key: 'legal_config' } });
    const legal = (row?.value as any) || {};
    return NextResponse.json({ legal });
  } catch (error: any) {
    console.error('[mobile/legal] error:', error);
    return NextResponse.json({ legal: {} });
  }
}
