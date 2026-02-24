// Real-time Notifications - Complete implementation with database integration
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const applicationId = searchParams.get('applicationId')
    const unread = searchParams.get('unread')
    
    let whereClause: any = {}
    
    if (userId) {
      whereClause.userId = userId
    }
    
    if (applicationId) {
      whereClause.applicationId = applicationId
    }
    
    if (unread === 'true') {
      whereClause.isRead = false
    }
    
    let notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        application: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })
    
    // Format response
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      userId: notification.userId,
      userEmail: notification.user.email,
      applicationId: notification.applicationId,
      applicationName: notification.application?.name,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      imageUrl: notification.imageUrl,
      actionUrl: notification.actionUrl,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      readAt: notification.readAt
    }))
    
    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      total: formattedNotifications.length,
      unreadCount: formattedNotifications.filter(n => !n.isRead).length,
      message: 'Notifications retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get notifications:', error)
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { action, userId, applicationId, title, body, type, data, actionUrl } = requestBody
    
    switch (action) {
      case 'create':
        return await handleCreateNotification({
          userId,
          applicationId,
          title,
          body,
          type: type || 'info',
          data,
          actionUrl
        })
      case 'mark-read':
        return await handleMarkAsRead(body)
      case 'mark-all-read':
        return await handleMarkAllAsRead(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Failed to process notification:', error)
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, isRead } = body
    
    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }
    
    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: isRead,
        readAt: isRead ? new Date() : null
      }
    })
    
    return NextResponse.json({
      success: true,
      notification: {
        id: updatedNotification.id,
        isRead: updatedNotification.isRead,
        readAt: updatedNotification.readAt
      },
      message: 'Notification updated successfully'
    })
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const userId = searchParams.get('userId')
    const deleteAll = searchParams.get('deleteAll') === 'true'
    
    if (deleteAll && userId) {
      // Delete all notifications for user
      await prisma.notification.deleteMany({
        where: { userId }
      })
      
      return NextResponse.json({
        success: true,
        message: 'All notifications deleted successfully'
      })
    } else if (notificationId) {
      // Delete specific notification
      await prisma.notification.delete({
        where: { id: notificationId }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Notification deleted successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Notification ID or user ID required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}

// Helper functions
async function handleCreateNotification(notificationData: any) {
  const { userId, applicationId, title, body, type, data, actionUrl } = notificationData
  
  if (!userId || !title) {
    return NextResponse.json(
      { error: 'User ID and title are required' },
      { status: 400 }
    )
  }
  
  // Create notification
  const notification = await prisma.notification.create({
    data: {
      userId,
      applicationId: applicationId || null,
      title,
      body: body || '',
      type: type || 'info',
      data: data || {},
      actionUrl: actionUrl || null,
      isRead: false
    }
  })
  
  console.log(`🔐 Notification Created: ${title}`, {
    notificationId: notification.id,
    userId,
    type
  })
  
  return NextResponse.json({
    success: true,
    notification: {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      data: notification.data,
      actionUrl: notification.actionUrl,
      isRead: notification.isRead,
      createdAt: notification.createdAt
    },
    message: 'Notification created successfully'
  }, { status: 201 })
}

async function handleMarkAsRead(body: any) {
  const { notificationIds, userId } = body
  
  if (!notificationIds || !Array.isArray(notificationIds)) {
    return NextResponse.json(
      { error: 'Notification IDs array is required' },
      { status: 400 }
    )
  }
  
  await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId: userId
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  })
  
  return NextResponse.json({
    success: true,
    message: 'Notifications marked as read'
  })
}

async function handleMarkAllAsRead(body: any) {
  const { userId } = body
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    )
  }
  
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  })
  
  return NextResponse.json({
    success: true,
    message: 'All notifications marked as read'
  })
}
