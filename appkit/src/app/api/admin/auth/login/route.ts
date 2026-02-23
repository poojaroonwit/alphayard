// Database-based Authentication API Routes
// Version: 2026-02-24-01:05 - Railway Debug Fix
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { databaseAuthService } from '@/services/databaseAuthService'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  console.log('🚀 LOGIN API v2026-02-24-01:05 - Railway Debug Version')
  console.log('🔐 Login API called')
  console.log('📊 DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
  
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('📧 Login attempt for email:', email)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Test database connection
    try {
      await prisma.$connect()
      console.log('✅ Database connected successfully')
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Find user in database
    console.log('🔍 Looking up user in database...')
    
    // Debug: Check what schema we're actually using
    console.log('🔍 Database schema debug...')
    try {
      const schemaCheck = await prisma.$queryRaw`SELECT current_schema()`
      console.log('📊 Current schema:', schemaCheck)
      
      const tableCheck = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      console.log('📋 Tables in public schema:', tableCheck)
      
      const userTableCheck = await prisma.$queryRaw`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public'`
      console.log('👤 User table exists (users):', userTableCheck)
      
      // Also check for any user-related tables
      const userRelatedTables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%user%'`
      console.log('👥 User-related tables:', userRelatedTables)
      
    } catch (schemaError) {
      console.error('❌ Schema debug failed:', schemaError)
    }

    // Debug: Check what users exist in database
    try {
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isVerified: true
        },
        take: 10 // Limit to prevent too much data
      })
      console.log('👥 All users in database:', allUsers.length)
      allUsers.forEach(user => {
        console.log(`  - ${user.email} (active: ${user.isActive}, verified: ${user.isVerified})`)
      })
    } catch (error) {
      console.error('❌ Failed to list users:', error)
    }
    
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true
      }
    })
    
    // Also try case-insensitive search as fallback
    if (!user) {
      console.log('🔍 Trying case-insensitive search...')
      const userCaseInsensitive = await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          passwordHash: true,
          isActive: true,
          isVerified: true,
          lastLoginAt: true
        }
      })
      
      if (userCaseInsensitive) {
        console.log('✅ Found user with case-insensitive search!')
        // Use the found user for the rest of the flow
        Object.assign(user || {}, userCaseInsensitive)
      }
    }
    
    console.log('👤 User found:', user ? 'YES' : 'NO')
    if (user) {
      console.log('👤 User details:', { 
        id: user.id, 
        email: user.email, 
        isActive: user.isActive, 
        isVerified: user.isVerified,
        hasPassword: !!user.passwordHash 
      })
    }
    
    if (!user || !user.isActive || !user.isVerified) {
      console.log('❌ User validation failed:', { 
        exists: !!user, 
        isActive: user?.isActive, 
        isVerified: user?.isVerified 
      })
      return NextResponse.json(
        { error: 'Invalid credentials or account not active' },
        { status: 401 }
      )
    }

    // Verify password
    console.log('🔐 Verifying password...')
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '')
    console.log('🔐 Password valid:', isPasswordValid)
    
    if (!isPasswordValid) {
      console.log('❌ Password verification failed')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Generate JWT token (mock for now - in production use proper JWT)
    const token = `jwt-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2)}`
    
    // Create session in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    const session = await databaseAuthService.createSession(
      user.id,
      token,
      token, // Use same token for refresh for now
      expiresAt
    )

    // Log login attempt
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        email: user.email,
        loginMethod: 'password',
        success: true,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        deviceType: 'web'
      }
    })

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
    
    // For failed logins, we don't create LoginHistory since we don't have userId
    // In production, you might want to create a separate FailedLoginAttempt table
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
