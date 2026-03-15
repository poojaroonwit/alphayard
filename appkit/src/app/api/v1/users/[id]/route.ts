import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { buildCorsHeaders } from '@/server/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

/**
 * GET /api/v1/users/:id
 * Used by the AppKit SDK (identity.getUserById) for service-to-service user lookup.
 * This endpoint is intentionally permissive to support cross-service auth validation.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const cors = buildCorsHeaders(req)
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400, headers: cors });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatarUrl: true,
        isActive: true,
        isVerified: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phoneNumber,
      avatar: user.avatarUrl,
      isActive: user.isActive,
      isVerified: user.isVerified,
      userType: user.userType,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }, { headers: cors });

  } catch (error: any) {
    console.error('Get user by ID error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: cors });
  }
}
