// Session Management - Centralized session tracking
import { NextRequest, NextResponse } from 'next/server'

// Mock active sessions
const mockSessions = [
  {
    id: 'sess_1',
    userId: 'f1707668-141f-4290-b93d-8f8ca8a0f860',
    userEmail: 'admin@appkit.com',
    applicationId: '1',
    applicationName: 'AppKit Admin',
    token: 'mock-jwt-token-1',
    refreshToken: 'mock-refresh-token-1',
    isActive: true,
    deviceInfo: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ip: '192.168.1.100',
      device: 'Desktop',
      browser: 'Chrome',
      os: 'Windows'
    },
    location: {
      country: 'United States',
      city: 'New York',
      timezone: 'America/New_York'
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    lastActivity: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
    expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
  },
  {
    id: 'sess_2',
    userId: '2',
    userEmail: 'user@example.com',
    applicationId: '2',
    applicationName: 'Boundary Mobile',
    token: 'mock-jwt-token-2',
    refreshToken: 'mock-refresh-token-2',
    isActive: true,
    deviceInfo: {
      userAgent: 'Boundary Mobile/1.0.0 (iOS)',
      ip: '10.0.0.1',
      device: 'Mobile',
      browser: 'Mobile App',
      os: 'iOS'
    },
    location: {
      country: 'United States',
      city: 'San Francisco',
      timezone: 'America/Los_Angeles'
    },
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    lastActivity: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    expiresAt: new Date(Date.now() + 7200000).toISOString() // 2 hours from now
  },
  {
    id: 'sess_3',
    userId: 'f1707668-141f-4290-b93d-8f8ca8a0f860',
    userEmail: 'admin@appkit.com',
    applicationId: '2',
    applicationName: 'Boundary Mobile',
    token: 'mock-jwt-token-3',
    refreshToken: 'mock-refresh-token-3',
    isActive: false,
    deviceInfo: {
      userAgent: 'Boundary Mobile/1.0.0 (Android)',
      ip: '10.0.0.2',
      device: 'Mobile',
      browser: 'Mobile App',
      os: 'Android'
    },
    location: {
      country: 'United States',
      city: 'Chicago',
      timezone: 'America/Chicago'
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    lastActivity: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    expiresAt: new Date(Date.now() - 3600000).toISOString() // Expired 1 hour ago
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const applicationId = searchParams.get('applicationId')
    const active = searchParams.get('active')
    
    let sessions = mockSessions
    
    if (userId) {
      sessions = sessions.filter(s => s.userId === userId)
    }
    
    if (applicationId) {
      sessions = sessions.filter(s => s.applicationId === applicationId)
    }
    
    if (active === 'true') {
      sessions = sessions.filter(s => s.isActive)
    } else if (active === 'false') {
      sessions = sessions.filter(s => !s.isActive)
    }
    
    // Sort by last activity (most recent first)
    sessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    
    return NextResponse.json({
      success: true,
      sessions: sessions,
      total: sessions.length,
      activeCount: sessions.filter(s => s.isActive).length,
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
      return NextResponse.json({
        success: true,
        message: 'Session revoked successfully'
      })
    } else if (userId && revokeAll) {
      // Revoke all sessions for user
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
