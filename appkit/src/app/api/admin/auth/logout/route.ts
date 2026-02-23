// Database-based Logout API Route
import { NextRequest, NextResponse } from 'next/server'
import { databaseAuthService } from '@/services/databaseAuthService'

export async function POST(request: NextRequest) {
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

    // Find and revoke session
    const session = await databaseAuthService.getSessionByToken(token)
    if (session) {
      await databaseAuthService.revokeSession(session.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
