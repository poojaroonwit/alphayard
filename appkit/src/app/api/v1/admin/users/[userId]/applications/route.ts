import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

// GET /api/v1/admin/users/[userId]/applications
// Returns all applications a user is associated with via UserApplication
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const { userId } = params

    const userApps = await prisma.userApplication.findMany({
      where: { userId },
      include: {
        application: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            settings: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    const applications = userApps.map((ua) => ({
      id: ua.application.id,
      name: ua.application.name || ua.application.slug || 'Unnamed App',
      slug: ua.application.slug,
      status: ua.status,
      applicationIsActive: ua.application.isActive ?? true,
      domain: ua.application.slug ? `${ua.application.slug}.appkit.com` : undefined,
      role: ua.role,
      appPoints: ua.appPoints,
      joinedAt: ua.joinedAt,
      lastActiveAt: ua.lastActiveAt,
    }))

    return NextResponse.json({ applications })
  } catch (error: any) {
    console.error('Failed to fetch user applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
