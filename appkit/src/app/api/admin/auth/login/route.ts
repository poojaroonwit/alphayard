// Database-based Authentication API Routes
// Version: 2026-02-24-01:05 - Railway Debug Fix
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import bcrypt from 'bcryptjs'
import { databaseAuthService } from '@/services/databaseAuthService'

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
    console.log('🔍 Database schema debug (PUBLIC ONLY)...')
    try {
      const schemaCheck = await prisma.$queryRaw`SELECT current_schema()`
      console.log('📊 Current schema:', schemaCheck)
      
      // Check users table in public schema only
      const userTableCheck = await prisma.$queryRaw`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public'`
      console.log('👤 User table in public schema:', userTableCheck)
      
      // Check all tables in public schema
      const publicTables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      console.log('� All tables in public schema:', publicTables)
      
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
      
      // TEMPORARY: Create admin user if no users exist
      if (allUsers.length === 0) {
        console.log('🔧 No users found, creating admin user...')
        try {
          const adminPassword = 'admin123'
          const hashedPassword = await bcrypt.hash(adminPassword, 12)
          
          const adminUser = await prisma.user.create({
            data: {
              email: 'admin@appkit.com',
              firstName: 'Admin',
              lastName: 'User',
              passwordHash: hashedPassword,
              isActive: true,
              isVerified: true,
              userType: 'admin'
            }
          })
          
          console.log('✅ Created admin user:', adminUser.email)
          console.log('👤 Admin user details:', {
            id: adminUser.id,
            email: adminUser.email,
            isActive: adminUser.isActive,
            isVerified: adminUser.isVerified,
            userType: adminUser.userType
          })
        } catch (createError) {
          console.error('❌ Failed to create admin user:', createError)
          console.error('Error details:', createError instanceof Error ? createError.message : 'Unknown error')
          // Don't throw error, continue with login attempt
        }
      }
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
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    
    // Extract the first valid IP from forwarded headers
    let ipAddress = '127.0.0.1' // Default fallback
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim())
      ipAddress = ips[0] || '127.0.0.1'
    } else if (realIp) {
      ipAddress = realIp
    }
    
    // Basic IP validation - ensure it's not empty or 'unknown'
    if (!ipAddress || ipAddress === 'unknown' || ipAddress.trim() === '') {
      ipAddress = '127.0.0.1'
    }
    
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        email: user.email,
        loginMethod: 'password',
        success: true,
        ipAddress: ipAddress.trim(),
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
    console.error('❌ Login API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available')
    
    // Return more detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Internal server error during login',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
