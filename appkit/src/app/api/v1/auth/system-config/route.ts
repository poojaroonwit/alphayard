import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import { buildCorsHeaders } from '@/server/lib/cors'

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders(req)
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
    }, { headers: cors })
  } catch (error) {
    console.error('GET auth system-config error:', error)
    return NextResponse.json({ error: 'Failed to fetch system auth config' }, { status: 500, headers: cors })
  }
}
