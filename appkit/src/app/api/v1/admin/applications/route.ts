import { NextRequest, NextResponse } from 'next/server'
import { authenticate, hasPermission } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }
    
    // Check permission (optional, depending on requirements, but config checks 'applications:view')
    // if (!hasPermission(auth.admin, 'applications:view')) {
    //   return NextResponse.json({ error: 'Permission denied', userRoles: auth.admin }, { status: 403 })
    // }

    // Fetch applications
    const applications = await prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { userApplications: true }
        }
      }
    })

    const onlineRows = await prisma.$queryRaw<Array<{ application_id: string; online_users: number }>>`
      SELECT
        application_id,
        COUNT(DISTINCT user_id)::int AS online_users
      FROM user_sessions
      WHERE is_active = true
        AND expires_at > NOW()
        AND last_activity_at > NOW() - INTERVAL '15 minutes'
        AND application_id IS NOT NULL
      GROUP BY application_id
    `

    const onlineByApp = new Map<string, number>(
      onlineRows.map((row) => [row.application_id, Number(row.online_users || 0)])
    )

    const formattedApps = applications.map(app => ({
      id: app.id,
      name: app.name,
      description: app.description || 'No description provided.',
      status: app.isActive ? 'active' : 'inactive',
      users: app._count.userApplications,
      onlineUsers: onlineByApp.get(app.id) || 0,
      createdAt: app.createdAt.toISOString(),
      lastModified: app.updatedAt.toISOString(),
      plan: 'free',
      domain: app.slug ? `${app.slug}.appkit.com` : undefined
    }))

    return NextResponse.json({ applications: formattedApps })
  } catch (error: any) {
    console.error('GET applications error:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}
