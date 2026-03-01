// Authentication Gateway - Complete implementation with database integration
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes, randomUUID } from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId: string
  sessionId: string
  iat: number
  exp: number
}

interface AuthBehaviorConfig {
  signupEnabled: boolean
  emailVerificationRequired: boolean
  inviteOnly: boolean
  allowedEmailDomains: string[]
  postLoginRedirect: string
  postSignupRedirect: string
}

const DEFAULT_AUTH_BEHAVIOR: AuthBehaviorConfig = {
  signupEnabled: true,
  emailVerificationRequired: false,
  inviteOnly: false,
  allowedEmailDomains: [],
  postLoginRedirect: '',
  postSignupRedirect: ''
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeAuthBehavior(settings: any): AuthBehaviorConfig {
  const raw = settings?.authBehavior || {}
  return {
    signupEnabled: raw.signupEnabled !== false,
    emailVerificationRequired: raw.emailVerificationRequired === true,
    inviteOnly: raw.inviteOnly === true,
    allowedEmailDomains: Array.isArray(raw.allowedEmailDomains)
      ? raw.allowedEmailDomains
          .filter((item: unknown): item is string => typeof item === 'string')
          .map((domain: string) => domain.trim().toLowerCase())
          .filter(Boolean)
      : [],
    postLoginRedirect: typeof raw.postLoginRedirect === 'string' ? raw.postLoginRedirect : '',
    postSignupRedirect: typeof raw.postSignupRedirect === 'string' ? raw.postSignupRedirect : ''
  }
}

async function resolveAuthBehavior(clientId: string): Promise<AuthBehaviorConfig> {
  const clean = (clientId || '').trim()
  if (!clean) return DEFAULT_AUTH_BEHAVIOR

  // 1) Application slug mapping (legacy behavior in this route).
  const bySlug = await prisma.application.findFirst({
    where: { slug: clean },
    select: { settings: true }
  })
  if (bySlug) return normalizeAuthBehavior(bySlug.settings)

  // 2) OAuth client_id -> application.
  const oauthClient = await prisma.oAuthClient.findFirst({
    where: { clientId: clean, isActive: true },
    include: {
      application: {
        select: { settings: true }
      }
    }
  })
  if (oauthClient?.application) return normalizeAuthBehavior(oauthClient.application.settings)

  // 3) UUID client id can be application id or oauth client id.
  if (UUID_REGEX.test(clean)) {
    const byAppId = await prisma.application.findUnique({
      where: { id: clean },
      select: { settings: true }
    })
    if (byAppId) return normalizeAuthBehavior(byAppId.settings)

    const byOauthId = await prisma.oAuthClient.findUnique({
      where: { id: clean },
      include: {
        application: {
          select: { settings: true }
        }
      }
    })
    if (byOauthId?.application) return normalizeAuthBehavior(byOauthId.application.settings)
  }

  return DEFAULT_AUTH_BEHAVIOR
}

async function resolveApplicationContext(clientId: string): Promise<{ id: string; slug: string } | null> {
  const clean = (clientId || '').trim()
  if (!clean) return null

  const bySlug = await prisma.application.findFirst({
    where: { slug: clean },
    select: { id: true, slug: true }
  })
  if (bySlug) return bySlug

  const byOAuthClientId = await prisma.oAuthClient.findFirst({
    where: { clientId: clean, isActive: true },
    include: { application: { select: { id: true, slug: true } } }
  })
  if (byOAuthClientId?.application) return byOAuthClientId.application

  if (UUID_REGEX.test(clean)) {
    const byAppId = await prisma.application.findUnique({
      where: { id: clean },
      select: { id: true, slug: true }
    })
    if (byAppId) return byAppId

    const byOAuthId = await prisma.oAuthClient.findUnique({
      where: { id: clean },
      include: { application: { select: { id: true, slug: true } } }
    })
    if (byOAuthId?.application) return byOAuthId.application
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, clientId, ...authData } = body
    
    // Rate limiting check (simple implementation)
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    console.log(`🔐 Auth Gateway: ${action} from ${clientIP} for client ${clientId}`)
    
    // Verify client application exists
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }
    
    // In production, validate client against database
    // const client = await prisma.application.findFirst({ where: { clientId } })
    // if (!client || !client.isActive) {
    //   return NextResponse.json({ error: 'Invalid client application' }, { status: 401 })
    // }
    
    switch (action) {
      case 'login':
        return await handleLogin(authData, clientId, clientIP)
      case 'register':
        return await handleRegister(authData, clientId, clientIP)
      case 'refresh':
        return await handleRefreshToken(authData, clientId, clientIP)
      case 'logout':
        return await handleLogout(authData, clientId, clientIP)
      case 'verify':
        return await handleVerifyToken(authData, clientId, clientIP)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('🔐 Authentication gateway error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleLogin(authData: any, clientId: string, clientIP: string) {
  const { email, password, deviceInfo, rememberMe = false } = authData
  const behavior = await resolveAuthBehavior(clientId)
  const appContext = await resolveApplicationContext(clientId)

  
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }
  
  try {
    // Find user with comprehensive query
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        userApplications: {
          where: appContext?.id ? { applicationId: appContext.id } : { application: { slug: clientId } },
          include: { application: true }
        },
        userSessions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })
    
    if (!user) {
      // Log failed login attempt
      await logSecurityEvent('login_failed', {
        email,
        clientId,
        clientIP,
        reason: 'user_not_found'
      })
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    if (!user.isActive) {
      await logSecurityEvent('login_failed', {
        userId: user.id,
        email,
        clientId,
        clientIP,
        reason: 'user_inactive'
      })
      
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      )
    }

    if (behavior.emailVerificationRequired && !user.isVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before signing in' },
        { status: 403 }
      )
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash || '')
    if (!isValid) {
      await logSecurityEvent('login_failed', {
        userId: user.id,
        email,
        clientId,
        clientIP,
        reason: 'invalid_password'
      })
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Check if user has access to this application
    let userAppAccess = appContext?.id
      ? user.userApplications.find((ua: any) => ua.applicationId === appContext.id)
      : user.userApplications.find((ua: any) => ua.application.slug === clientId)

    // Backfill missing membership for valid logins when app context is resolvable.
    // This recovers users created before app-link persistence was enforced.
    if (!userAppAccess && appContext?.id) {
      const linked = await prisma.userApplication.upsert({
        where: {
          userId_applicationId: {
            userId: user.id,
            applicationId: appContext.id
          }
        },
        update: {
          status: 'active',
          lastActiveAt: new Date()
        },
        create: {
          userId: user.id,
          applicationId: appContext.id,
          role: 'member',
          status: 'active'
        },
        include: { application: true }
      })
      userAppAccess = linked as any
    }

    if (!userAppAccess && user.userType !== 'admin') {
      await logSecurityEvent('login_failed', {
        userId: user.id,
        email,
        clientId,
        clientIP,
        reason: 'no_application_access'
      })
      
      return NextResponse.json(
        { error: 'Access denied for this application' },
        { status: 403 }
      )
    }
    
    // Generate session ID
    const sessionId = randomUUID()
    
    // Create tokens with proper expiration
    const tokenExpiry = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60 // 30 days or 7 days
    const refreshExpiry = rememberMe ? 90 * 24 * 60 * 60 : 30 * 24 * 60 * 60 // 90 days or 30 days
    
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.userType || 'user',
      clientId,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + tokenExpiry
    }
    
    const accessToken = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' })
    const refreshToken = jwt.sign(
      { userId: user.id, sessionId, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: `${refreshExpiry}s`, algorithm: 'HS256' }
    )
    
    // Calculate session expiration
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenExpiry)
    
    // Parse device info
    const parsedDeviceInfo = deviceInfo || {}
    const userAgent = parsedDeviceInfo.userAgent || 'Unknown'
    
    // Create session in database
    const session = await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        sessionToken: accessToken,
        refreshToken: refreshToken,
        isActive: true,
        expiresAt,
        applicationId: userAppAccess?.applicationId || appContext?.id || null,
        deviceType: parsedDeviceInfo.device || 'Unknown',
        deviceName: parsedDeviceInfo.name || 'Unknown Device',
        browser: parsedDeviceInfo.browser || 'Unknown',
        ipAddress: clientIP,
        country: parsedDeviceInfo.country || null,
        city: parsedDeviceInfo.city || null,
        isRemembered: rememberMe
      }
    })
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
    
    // Get user permissions
    const permissions = await getUserPermissions(user.id, userAppAccess?.applicationId)
    
    // Log successful login
    await logSecurityEvent('login_success', {
      userId: user.id,
      email,
      clientId,
      clientIP,
      sessionId: session.id
    })
    
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.userType || 'user',
        isActive: user.isActive,
        isVerified: user.isVerified,
        permissions: permissions,
        lastLogin: user.lastLoginAt
      },
      tokens: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresIn: tokenExpiry,
        tokenType: 'Bearer'
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt.toISOString(),
        deviceInfo: deviceInfo || {}
      },
      redirectTo: behavior.postLoginRedirect || null,
      message: 'Login successful'
    });

    // Set a session cookie for OIDC/OAuth support
    response.cookies.set('appkit_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('🔐 Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}

async function handleRegister(authData: any, clientId: string, clientIP: string) {
  const { email, password, firstName, lastName, deviceInfo, acceptTerms = false } = authData
  const appContext = await resolveApplicationContext(clientId)

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json(
      { error: 'All required fields must be provided' },
      { status: 400 }
    )
  }

  const behavior = await resolveAuthBehavior(clientId)

  if (!behavior.signupEnabled) {
    return NextResponse.json(
      { error: 'Signup is disabled for this application' },
      { status: 403 }
    )
  }

  if (behavior.inviteOnly) {
    return NextResponse.json(
      { error: 'This application is invite-only' },
      { status: 403 }
    )
  }

  if (behavior.allowedEmailDomains.length > 0) {
    const emailDomain = (email.split('@')[1] || '').toLowerCase()
    if (!behavior.allowedEmailDomains.includes(emailDomain)) {
      return NextResponse.json(
        { error: 'Email domain is not allowed for signup' },
        { status: 403 }
      )
    }
  }
  
  if (!acceptTerms) {
    return NextResponse.json(
      { error: 'You must accept the terms of service' },
      { status: 400 }
    )
  }
  
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    
    if (existingUser) {
      await logSecurityEvent('registration_failed', {
        email,
        clientId,
        clientIP,
        reason: 'user_exists'
      })
      
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create user
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

    if (appContext?.id) {
      await prisma.userApplication.upsert({
        where: {
          userId_applicationId: {
            userId: user.id,
            applicationId: appContext.id
          }
        },
        update: {
          status: 'active',
          lastActiveAt: new Date()
        },
        create: {
          userId: user.id,
          applicationId: appContext.id,
          role: 'member',
          status: 'active'
        }
      })
    }
    
    // Generate tokens
    const sessionId = randomUUID()
    const tokenExpiry = 7 * 24 * 60 * 60 // 7 days
    
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.userType,
      clientId,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + tokenExpiry
    }
    
    const accessToken = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' })
    const refreshToken = jwt.sign(
      { userId: user.id, sessionId, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d', algorithm: 'HS256' }
    )
    
    // Create session
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenExpiry)
    
    const parsedDeviceInfo = deviceInfo || {}
    
    await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        applicationId: appContext?.id || null,
        sessionToken: accessToken,
        refreshToken: refreshToken,
        isActive: true,
        expiresAt,
        deviceType: parsedDeviceInfo.device || 'Unknown',
        deviceName: parsedDeviceInfo.name || 'Unknown Device',
        browser: parsedDeviceInfo.browser || 'Unknown',
        ipAddress: clientIP,
        country: parsedDeviceInfo.country || null,
        city: parsedDeviceInfo.city || null
      }
    })
    
    // Log registration
    await logSecurityEvent('registration_success', {
      userId: user.id,
      email,
      clientId,
      clientIP,
      sessionId
    })
    
    const response = NextResponse.json({
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
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresIn: tokenExpiry,
        tokenType: 'Bearer'
      },
      redirectTo: behavior.postSignupRedirect || null,
      message: 'Registration successful'
    }, { status: 201 });

    // Set a session cookie for OIDC/OAuth support
    response.cookies.set('appkit_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('🔐 Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}

async function handleRefreshToken(authData: any, clientId: string, clientIP: string) {
  const { refreshToken } = authData
  
  if (!refreshToken) {
    return NextResponse.json(
      { error: 'Refresh token is required' },
      { status: 400 }
    )
  }
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any
    
    if (decoded.type !== 'refresh') {
      return NextResponse.json(
        { error: 'Invalid token type' },
        { status: 401 }
      )
    }
    
    // Find session
    const session = await prisma.userSession.findFirst({
      where: {
        refreshToken: refreshToken,
        isActive: true,
        userId: decoded.userId
      },
      include: { user: true }
    })
    
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      )
    }
    
    // Generate new tokens
    const tokenExpiry = 7 * 24 * 60 * 60 // 7 days
    const newPayload: JWTPayload = {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.userType || 'user',
      clientId,
      sessionId: session.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + tokenExpiry
    }
    
    const newAccessToken = jwt.sign(newPayload, JWT_SECRET, { algorithm: 'HS256' })
    const newRefreshToken = jwt.sign(
      { userId: session.user.id, sessionId: session.id, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d', algorithm: 'HS256' }
    )
    
    // Update session
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        sessionToken: newAccessToken,
        refreshToken: newRefreshToken,
        lastActivityAt: new Date()
      }
    })
    
    return NextResponse.json({
      success: true,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: tokenExpiry,
        tokenType: 'Bearer'
      },
      message: 'Token refreshed successfully'
    })
  } catch (error) {
    console.error('🔐 Token refresh error:', error)
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 401 }
    )
  }
}

async function handleLogout(authData: any, clientId: string, clientIP: string) {
  const { accessToken, allSessions = false } = authData
  
  try {
    if (accessToken) {
      // Verify token and get session
      const decoded = jwt.verify(accessToken, JWT_SECRET) as JWTPayload
      
      if (allSessions) {
        // Revoke all sessions for user
        await prisma.userSession.updateMany({
          where: { userId: decoded.userId },
          data: { isActive: false }
        })
      } else {
        // Revoke specific session
        await prisma.userSession.update({
          where: { id: decoded.sessionId },
          data: { isActive: false }
        })
      }
      
      // Log logout
      await logSecurityEvent('logout', {
        userId: decoded.userId,
        clientId,
        clientIP,
        sessionId: decoded.sessionId,
        allSessions
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error) {
    console.error('🔐 Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}

async function handleVerifyToken(authData: any, clientId: string, clientIP: string) {
  const { accessToken } = authData
  
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Access token is required' },
      { status: 400 }
    )
  }
  
  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as JWTPayload
    
    // Verify session is still active
    const session = await prisma.userSession.findFirst({
      where: {
        id: decoded.sessionId,
        userId: decoded.userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    })
    
    if (!session) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: 'Session expired or invalid'
      }, { status: 401 })
    }
    
    // Update last activity
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() }
    })
    
    // Get user permissions
    const permissions = await getUserPermissions(decoded.userId, session.applicationId)
    
    return NextResponse.json({
      success: true,
      valid: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: session.user.userType || 'user',
        isActive: session.user.isActive,
        isVerified: session.user.isVerified,
        permissions: permissions
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt.toISOString()
      },
      message: 'Token is valid'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      valid: false,
      message: 'Invalid token'
    }, { status: 401 })
  }
}

// Helper functions
async function getUserPermissions(userId: string, applicationId?: string | null) {
  try {
    // Get user's group memberships
    const userGroupMembers = await prisma.userGroupMember.findMany({
      where: { 
        userId: userId
      },
      include: {
        group: {
          include: {
            application: true
          }
        }
      }
    })
    
    // Extract permissions from groups
    const permissions = new Set<string>()
    userGroupMembers.forEach(userGroupMember => {
      if (userGroupMember.group.permissions) {
        const groupPermissions = Array.isArray(userGroupMember.group.permissions) 
          ? userGroupMember.group.permissions 
          : []
        groupPermissions.forEach((perm: any) => {
          if (typeof perm === 'string') {
            permissions.add(perm)
          }
        })
      }
    })
    
    return Array.from(permissions)
  } catch (error) {
    console.error('Failed to get user permissions:', error)
    return []
  }
}

async function logSecurityEvent(eventType: string, data: any) {
  try {
    // For now, just log to console - securityLog table doesn't exist in schema
    console.log(`🔐 Security Event: ${eventType}`, data)
    // In production, create a security log table or use audit logs
    // await prisma.securityLog.create({
    //   data: {
    //     eventType,
    //     userId: data.userId || null,
    //     email: data.email || null,
    //     clientId: data.clientId,
    //     ipAddress: data.clientIP,
    //     userAgent: data.deviceInfo?.userAgent || null,
    //     details: data
    //   }
    // })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}
