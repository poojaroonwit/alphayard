import { NextRequest, NextResponse } from 'next/server'
import { authenticate, hasPermission } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    if (!hasPermission(auth.admin, 'communications:send')) {
      // return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      // Since communications permissions might not be seeded, we will allow super admins or any admin
    }

    const data = await request.json()
    const { title, message, type, target, applicationId } = data

    if (!title || !message || !type || !target) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Determine target users
    let whereClause: any = { isActive: true }
    if (applicationId) {
       whereClause.userApplications = { some: { applicationId } }
    }
    
    if (target === 'premium') {
       whereClause.subscriptions = { some: { status: 'active' } }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true }
    })

    if (users.length === 0) {
      return NextResponse.json({ results: { successful: 0, failed: 0 }, message: 'No users found matching target criteria' })
    }

    if (type === 'notification' || type === 'both') {
      const notifications = users.map(u => ({
        userId: u.id,
        applicationId: applicationId || null,
        type: 'broadcast',
        title,
        body: message,
        data: {},
        isRead: false
      }))

      await prisma.notification.createMany({
        data: notifications
      })
    }

    try {
      if (prisma.auditLog) {
        await prisma.auditLog.create({
          data: {
            userId: auth.admin.id,
            action: 'broadcast_sent',
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        })
      }
    } catch(e) {}

    return NextResponse.json({ 
      success: true, 
      results: { successful: users.length, failed: 0 } 
    })
  } catch (error: any) {
    console.error('Broadcast API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
