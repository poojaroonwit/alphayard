import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/server/lib/prisma'
import { config } from '@/server/config/env'
import { buildCorsHeaders } from '@/server/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request, 'GET, OPTIONS') })
}

export async function GET(request: NextRequest) {
  const corsHeaders = buildCorsHeaders(request, 'GET, OPTIONS')
  try {
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
    const cookieToken = request.cookies.get('appkit_token')?.value || ''
    const token = bearerToken || cookieToken

    if (!token) {
      return NextResponse.json({ error: 'unauthorized', error_description: 'Missing access token' }, { status: 401, headers: corsHeaders })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, config.JWT_SECRET)
    } catch {
      return NextResponse.json({ error: 'unauthorized', error_description: 'Invalid or expired token' }, { status: 401, headers: corsHeaders })
    }

    const userId = decoded?.userId || decoded?.id || decoded?.sub
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized', error_description: 'Invalid token payload' }, { status: 401, headers: corsHeaders })
    }

    // Determine which application this request belongs to via X-App-ID header or active app
    const appId = request.headers.get('x-app-id') || request.nextUrl.searchParams.get('appId')

    const whereClause: any = appId
      ? { applicationId: appId }
      : {}

    // Return circles the user is a member of
    const memberships = await prisma.circleMember.findMany({
      where: { userId, circle: whereClause },
      include: {
        circle: {
          select: {
            id: true,
            name: true,
            description: true,
            circleType: true,
            parentId: true,
            applicationId: true,
            createdAt: true,
          },
        },
      },
    })

    const circles = memberships.map((m: any) => ({ ...m.circle, role: m.role }))

    return NextResponse.json({ circles }, { headers: corsHeaders })
  } catch (error) {
    console.error('[GET /api/v1/circles] Error:', error)
    return NextResponse.json({ error: 'server_error', error_description: 'Failed to fetch circles' }, { status: 500, headers: corsHeaders })
  }
}
