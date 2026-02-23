// Database-based Authentication API Routes
import { NextRequest, NextResponse } from 'next/server'
import { databaseAuthService } from '@/services/databaseAuthService'

// Mock user database for now - in production this would query your actual database
const mockUsers = [
  {
    id: 'admin-user-id',
    email: 'admin@appkit.com',
    firstName: 'Admin',
    lastName: 'User',
    passwordHash: '$2b$10$example.hash', // In production, use proper hashing
    isActive: true
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Find user (mock implementation)
    const user = mockUsers.find(u => u.email === email && u.isActive)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // In production, verify password hash
    // For now, accept any password for the admin user
    if (email === 'admin@appkit.com' && password !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate mock token
    const token = `mock-jwt-token-${Date.now()}-${Math.random().toString(36).substring(2)}`
    
    // Create session in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const session = await databaseAuthService.createSession(
      user.id,
      token,
      token, // Use same token for refresh for now
      expiresAt
    )

    // Return auth response
    return NextResponse.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: 'admin',
        permissions: ['read', 'write', 'admin']
      },
      sessionId: session.id,
      expiresAt: session.expiresAt
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
