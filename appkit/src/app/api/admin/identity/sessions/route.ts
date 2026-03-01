// Session Management - Complete implementation with database integration
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const applicationId = searchParams.get('applicationId')
    const active = searchParams.get('active')
    
    let whereClause: any = {}
    
    if (userId) {
      whereClause.userId = userId
    }
    
    if (applicationId) {
      whereClause.applicationId = applicationId
    }
    
    if (active === 'true') {
      whereClause.isActive = true
    } else if (active === 'false') {
      whereClause.isActive = false
    }
    
    let sessions = await prisma.userSession.findMany({
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
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      userEmail: session.user.email,
      applicationId: session.applicationId,
      applicationName: session.application?.name,
      token: session.sessionToken,
      refreshToken: session.refreshToken,
      isActive: session.isActive,
      deviceInfo: {
        deviceType: session.deviceType,
        deviceName: session.deviceName,
        browser: session.browser,
        os: session.os,
        userAgent: 'Unknown' // Default since field doesn't exist in model
      },
      location: {
        ipAddress: session.ipAddress,
        country: session.country,
        city: session.city
      },
      security: {
        isRemembered: session.isRemembered,
        mfaVerified: session.mfaVerified,
        riskScore: session.riskScore
      },
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      revokedBy: session.revokedBy,
      revokeReason: session.revokeReason
    }))
    
    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
      total: formattedSessions.length,
      activeCount: formattedSessions.filter(s => s.isActive).length,
      message: 'Sessions retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get sessions:', error)
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')
    const revokeAll = searchParams.get('revokeAll') === 'true'
    
    if (sessionId) {
      // Revoke specific session
      const session = await prisma.userSession.findUnique({
        where: { id: sessionId }
      })
      
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }
      
      await prisma.userSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          revokedAt: new Date(),
          revokeReason: 'Manual revocation'
        }
      })
      
      console.log(`🔐 Session Revoked: ${sessionId}`, {
        sessionId,
        userId: session.userId
      })
      
      return NextResponse.json({
        success: true,
        message: 'Session revoked successfully'
      })
    } else if (userId && revokeAll) {
      // Revoke all sessions for user
      await prisma.userSession.updateMany({
        where: { userId },
        data: {
          isActive: false,
          revokedAt: new Date(),
          revokeReason: 'Bulk revocation'
        }
      })
      
      console.log(`🔐 All Sessions Revoked for User: ${userId}`, {
        userId
      })
      
      return NextResponse.json({
        success: true,
        message: 'All user sessions revoked successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Session ID or user ID required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Failed to revoke session:', error)
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, applicationId, deviceInfo, rememberMe = false } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Generate session ID and tokens
    const sessionId = generateSessionId()
    const tokenExpiry = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60 // 30 days or 7 days
    
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenExpiry)
    
    // Create session
    const session = await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: userId,
        applicationId: applicationId || null,
        sessionToken: generateToken(),
        refreshToken: generateToken(),
        isActive: true,
        expiresAt,
        deviceType: deviceInfo?.device || 'Unknown',
        deviceName: deviceInfo?.name || 'Unknown Device',
        browser: deviceInfo?.browser || 'Unknown',
        os: deviceInfo?.os || 'Unknown',
        ipAddress: deviceInfo?.ipAddress || null,
        country: deviceInfo?.country || null,
        city: deviceInfo?.city || null,
        isRemembered: rememberMe
      }
    })
    
    console.log(`🔐 Session Created: ${session.id}`, {
      sessionId: session.id,
      userId: userId,
      applicationId: applicationId
    })
    
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        userId: session.userId,
        applicationId: session.applicationId,
        isActive: session.isActive,
        deviceInfo: {
          deviceType: session.deviceType,
          deviceName: session.deviceName,
          browser: session.browser,
          os: session.os
        },
        createdAt: session.createdAt,
        expiresAt: session.expiresAt
      },
      message: 'Session created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, deviceInfo, extendSession = false } = body
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    // Check if session exists
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId }
    })
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    // Update session
    const updateData: any = {
      lastActivityAt: new Date()
    }
    
    if (deviceInfo) {
      updateData.deviceType = deviceInfo.device || session.deviceType
      updateData.deviceName = deviceInfo.name || session.deviceName
      updateData.browser = deviceInfo.browser || session.browser
      updateData.os = deviceInfo.os || session.os
    }
    
    if (extendSession) {
      const newExpiry = new Date()
      newExpiry.setSeconds(newExpiry.getSeconds() + (7 * 24 * 60 * 60)) // Add 7 days
      updateData.expiresAt = newExpiry
    }
    
    const updatedSession = await prisma.userSession.update({
      where: { id: sessionId },
      data: updateData
    })
    
    console.log(`🔐 Session Updated: ${sessionId}`, {
      sessionId,
      extended: extendSession
    })
    
    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        userId: updatedSession.userId,
        isActive: updatedSession.isActive,
        lastActivityAt: updatedSession.lastActivityAt,
        expiresAt: updatedSession.expiresAt
      },
      message: 'Session updated successfully'
    })
  } catch (error) {
    console.error('Failed to update session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateSessionId(): string {
  return randomUUID()
}

function generateToken(): string {
  return Buffer.from(`${Date.now()}_${Math.random().toString(36).substr(2, 32)}`).toString('base64')
}
