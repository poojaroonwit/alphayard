import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/server/lib/prisma'
import { config } from '@/server/config/env'
import { buildCorsHeaders } from '@/server/lib/cors'

function getMobileUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  if (!token) return null
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any
    return decoded?.userId || decoded?.id || decoded?.sub || null
  } catch {
    return null
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(req, 'GET, PATCH, OPTIONS'),
  })
}

export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders(req, 'GET, PATCH, OPTIONS')
  const userId = getMobileUserId(req)
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized', error_description: 'Missing or invalid token' }, { status: 401, headers: cors })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatarUrl: true,
        userType: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'unauthorized', error_description: 'User not found or inactive' }, { status: 401, headers: cors })
    }

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phoneNumber,
        avatar: user.avatarUrl,
        role: user.userType || 'user',
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      { headers: cors }
    )
  } catch (error: any) {
    const status = error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError' ? 401 : 500
    return NextResponse.json(
      { error: status === 401 ? 'unauthorized' : 'server_error', error_description: 'Failed to fetch user profile' },
      { status, headers: cors }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const cors = buildCorsHeaders(req, 'GET, PATCH, OPTIONS')
  const userId = getMobileUserId(req)
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized', error_description: 'Missing or invalid token' }, { status: 401, headers: cors })
  }

  try {
    const body = await req.json()
    const { firstName, lastName, phone, avatar, dateOfBirth, gender } = body

    const updateData: Record<string, any> = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (phone !== undefined) updateData.phoneNumber = phone
    if (avatar !== undefined) updateData.avatarUrl = avatar
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null
    if (gender !== undefined) updateData.gender = gender

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatarUrl: true,
        userType: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phoneNumber,
        avatar: user.avatarUrl,
        role: user.userType || 'user',
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      { headers: cors }
    )
  } catch (error: any) {
    console.error('[PATCH /api/v1/users/me] Error:', error)
    return NextResponse.json({ error: 'server_error', error_description: 'Failed to update profile' }, { status: 500, headers: cors })
  }
}
