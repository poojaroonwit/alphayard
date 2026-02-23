// Database-based Current User API Route
import { NextRequest, NextResponse } from 'next/server'
import { databaseAuthService } from '@/services/databaseAuthService'

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    // Find session
    const session = await databaseAuthService.getSessionByToken(token)
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: session.user,
      permissions: [
        { module: 'dashboard', action: 'read' },
        { module: 'users', action: 'read' },
        { module: 'users', action: 'write' },
        { module: 'content', action: 'read' },
        { module: 'content', action: 'write' },
        { module: 'settings', action: 'read' },
        { module: 'settings', action: 'write' },
        { module: 'admin', action: 'read' },
        { module: 'admin', action: 'write' }
      ],
      isSuperAdmin: true
    })

  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
