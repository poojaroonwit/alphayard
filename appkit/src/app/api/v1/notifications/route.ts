import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const userId = auth.admin.adminId || auth.admin.id;

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const whereClause: any = { userId }
    
    if (applicationId) {
      whereClause.applicationId = applicationId
    }
    
    if (unreadOnly) {
      whereClause.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    const unreadCount = await prisma.notification.count({
      where: { ...whereClause, isRead: false }
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error: any) {
    console.error('Notifications GET Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = auth.admin.adminId || auth.admin.id;
    const data = await request.json()
    const { action, notificationIds } = data

    if (action === 'markAllRead') {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() }
      })
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (action === 'markRead' && Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, userId },
        data: { isRead: true, readAt: new Date() }
      })
      return NextResponse.json({ success: true, message: 'Notifications marked as read' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Notifications PATCH Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
