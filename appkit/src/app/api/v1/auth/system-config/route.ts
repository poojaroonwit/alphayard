import { NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'

export async function GET() {
  try {
    const [generalRow, ssoRow, providers] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'system.general' } }),
      prisma.systemConfig.findUnique({ where: { key: 'system.sso' } }),
      prisma.oAuthProvider.findMany({
        where: { applicationId: null, isEnabled: true },
        select: {
          id: true,
          providerName: true,
          displayName: true,
          iconUrl: true,
          buttonColor: true,
          buttonText: true,
          authorizationUrl: true,
        },
        orderBy: { displayOrder: 'asc' },
      }),
    ])

    return NextResponse.json({
      general: generalRow?.value || {},
      sso: ssoRow?.value || {},
      providers,
    })
  } catch (error) {
    console.error('GET auth system-config error:', error)
    return NextResponse.json({ error: 'Failed to fetch system auth config' }, { status: 500 })
  }
}
