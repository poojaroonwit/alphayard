import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/server/lib/prisma'
import { config } from '@/server/config/env'

const buildCorsHeaders = (request: NextRequest) => {
  const origin = request.headers.get('origin') || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-ID',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  }
}

const unauthorized = (request: NextRequest, message: string) =>
  NextResponse.json(
    { error: 'unauthorized', error_description: message },
    { status: 401, headers: buildCorsHeaders(request) }
  )

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request),
  })
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
    const cookieToken = request.cookies.get('appkit_token')?.value || ''
    const token = bearerToken || cookieToken

    if (!token) {
      return unauthorized(request, 'Missing access token')
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any
    const userId = decoded?.userId || decoded?.id || decoded?.sub
    if (!userId || typeof userId !== 'string') {
      return unauthorized(request, 'Invalid token payload')
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isActive: true,
        isVerified: true,
      },
    })

    if (!user || !user.isActive) {
      return unauthorized(request, 'User not found or inactive')
    }

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.userType || 'user',
        isVerified: user.isVerified,
      },
      { headers: buildCorsHeaders(request) }
    )
  } catch (error: any) {
    const status = error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError' ? 401 : 500
    return NextResponse.json(
      {
        error: status === 401 ? 'unauthorized' : 'server_error',
        error_description: status === 401 ? 'Invalid or expired token' : 'Failed to fetch user profile',
      },
      { status, headers: buildCorsHeaders(request) }
    )
  }
}

