// Authentication Gateway - Main auth endpoint for all applications
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, clientId, ...authData } = body
    
    // Verify client application
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }
    
    switch (action) {
      case 'login':
        return handleLogin(authData, clientId)
      case 'register':
        return handleRegister(authData, clientId)
      case 'refresh':
        return handleRefreshToken(authData, clientId)
      case 'logout':
        return handleLogout(authData, clientId)
      case 'verify':
        return handleVerifyToken(authData, clientId)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Authentication gateway error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleLogin(authData: any, clientId: string) {
  const { email, password, deviceInfo } = authData
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  })
  
  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }
  
  // Verify password
  if (user.passwordHash) {
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
  }
  
  // Generate tokens (mock implementation)
  const token = `mock-jwt-${Date.now()}-${user.id}`
  const refreshToken = `mock-refresh-${Date.now()}-${user.id}`
  
  // Create session
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days
  
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.userType || 'user',
      isActive: user.isActive,
      isVerified: user.isVerified
    },
    tokens: {
      accessToken: token,
      refreshToken: refreshToken,
      expiresIn: 604800, // 7 days
      tokenType: 'Bearer'
    },
    session: {
      id: `sess_${Date.now()}`,
      expiresAt: expiresAt.toISOString(),
      deviceInfo: deviceInfo || {}
    },
    message: 'Login successful'
  })
}

async function handleRegister(authData: any, clientId: string) {
  const { email, password, firstName, lastName, deviceInfo } = authData
  
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  })
  
  if (existingUser) {
    return NextResponse.json(
      { error: 'User already exists' },
      { status: 409 }
    )
  }
  
  // Create user
  const hashedPassword = await bcrypt.hash(password, 12)
  
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      firstName,
      lastName,
      passwordHash: hashedPassword,
      isActive: true,
      isVerified: false,
      userType: 'user'
    }
  })
  
  // Generate tokens
  const token = `mock-jwt-${Date.now()}-${user.id}`
  const refreshToken = `mock-refresh-${Date.now()}-${user.id}`
  
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.userType,
      isActive: user.isActive,
      isVerified: user.isVerified
    },
    tokens: {
      accessToken: token,
      refreshToken: refreshToken,
      expiresIn: 604800,
      tokenType: 'Bearer'
    },
    message: 'Registration successful'
  }, { status: 201 })
}

async function handleRefreshToken(authData: any, clientId: string) {
  const { refreshToken } = authData
  
  // Mock token refresh
  const newToken = `mock-jwt-refreshed-${Date.now()}`
  
  return NextResponse.json({
    success: true,
    tokens: {
      accessToken: newToken,
      expiresIn: 604800,
      tokenType: 'Bearer'
    },
    message: 'Token refreshed successfully'
  })
}

async function handleLogout(authData: any, clientId: string) {
  const { accessToken } = authData
  
  // Mock logout - would invalidate session/token
  return NextResponse.json({
    success: true,
    message: 'Logout successful'
  })
}

async function handleVerifyToken(authData: any, clientId: string) {
  const { accessToken } = authData
  
  // Mock token verification
  if (accessToken && accessToken.startsWith('mock-jwt-')) {
    return NextResponse.json({
      success: true,
      valid: true,
      user: {
        id: 'f1707668-141f-4290-b93d-8f8ca8a0f860',
        email: 'admin@appkit.com',
        role: 'admin'
      },
      message: 'Token is valid'
    })
  }
  
  return NextResponse.json({
    success: false,
    valid: false,
    message: 'Invalid token'
  }, { status: 401 })
}
