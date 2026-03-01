import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/server/lib/prisma'
import { config } from '@/server/config/env'

interface AuthBehaviorConfig {
  emailVerificationRequired: boolean
  postLoginRedirect: string
}

const DEFAULT_AUTH_BEHAVIOR: AuthBehaviorConfig = {
  emailVerificationRequired: false,
  postLoginRedirect: ''
}

function normalizeAuthBehavior(settings: any): AuthBehaviorConfig {
  const raw = settings?.authBehavior || {}
  return {
    emailVerificationRequired: raw.emailVerificationRequired === true,
    postLoginRedirect: typeof raw.postLoginRedirect === 'string' ? raw.postLoginRedirect : ''
  }
}

async function resolveAuthBehavior(clientId?: string): Promise<AuthBehaviorConfig> {
  const clean = (clientId || '').trim()
  if (!clean) return DEFAULT_AUTH_BEHAVIOR

  const bySlug = await prisma.application.findFirst({
    where: { slug: clean },
    select: { settings: true }
  })
  if (bySlug) return normalizeAuthBehavior(bySlug.settings)

  const oauthClient = await prisma.oAuthClient.findFirst({
    where: { clientId: clean, isActive: true },
    include: {
      application: {
        select: { settings: true }
      }
    }
  })
  if (oauthClient?.application) return normalizeAuthBehavior(oauthClient.application.settings)

  return DEFAULT_AUTH_BEHAVIOR
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, clientId } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const behavior = await resolveAuthBehavior(clientId)

    // Try admin_users table first, then fall back to users table
    let userId: string
    let userEmail: string
    let userName: string
    let roleName = 'admin'
    let permissions: string[] = ['*']
    let isSuperAdmin = false

    console.log(`[login] Attempting login for: ${email.toLowerCase()}`)

    const adminUser = await prisma.adminUser.findFirst({
      where: { 
        email: email.toLowerCase(),
        isActive: true 
      },
      include: { role: true }
    })
    console.log(`[login] admin_users lookup: ${adminUser ? 'FOUND' : 'not found'}`)

    if (adminUser) {
      // Validate password against admin_users
      const isValid = await bcrypt.compare(password, adminUser.passwordHash)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }
      userId = adminUser.id
      userEmail = adminUser.email
      userName = adminUser.name || ''
      roleName = adminUser.role?.name || 'admin'
      isSuperAdmin = adminUser.isSuperAdmin || adminUser.email === 'admin@appkit.com'

      if (!isSuperAdmin && adminUser.roleId) {
        const rolePermissions = await prisma.adminRolePermission.findMany({
          where: { roleId: adminUser.roleId },
          include: { permission: true }
        })
        permissions = rolePermissions.map((rp: any) => `${rp.permission.module}:${rp.permission.action}`)
      }

      await prisma.adminUser.update({
        where: { id: adminUser.id },
        data: { lastLoginAt: new Date() }
      })
    } else {
      // Fallback: check users table (seed creates admin@appkit.com here)
      const user = await prisma.user.findFirst({
        where: { 
          email: email.toLowerCase(),
          isActive: true 
        }
      })
      console.log(`[login] users table lookup: ${user ? `FOUND (id=${user.id}, type=${user.userType}, active=${user.isActive})` : 'not found'}`)
      if (!user) {
        // Debug: count total users in DB
        const count = await prisma.user.count()
        console.log(`[login] Total users in DB: ${count}`)
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }
      const isValid = await bcrypt.compare(password, user.passwordHash || '')
      console.log(`[login] Password check: ${isValid ? 'VALID' : 'INVALID'} (hash exists: ${!!user.passwordHash})`)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }
      userId = user.id
      userEmail = user.email
      userName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
      isSuperAdmin = user.userType === 'admin'

      if (behavior.emailVerificationRequired && !user.isVerified) {
        return NextResponse.json({ error: 'Please verify your email before signing in' }, { status: 403 })
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: userId,
        adminId: userId,
        email: userEmail,
        firstName: userName,
        lastName: '',
        role: roleName,
        permissions,
        type: 'admin',
        isSuperAdmin
      },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    )

    console.log(`[login] ✓ ${userEmail} logged in (isSuperAdmin=${isSuperAdmin})`)
    
    // Create the response
    const response = NextResponse.json({ 
      success: true, 
      token,
      user: {
        id: userId,
        email: userEmail,
        firstName: userName,
        role: roleName,
        permissions,
        isSuperAdmin
      },
      redirectTo: behavior.postLoginRedirect || null
    });

    // Set a session cookie for OIDC/OAuth support
    response.cookies.set('appkit_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error: any) {
    console.error('Local admin login error:', error)
    return NextResponse.json({ error: 'Login failed', details: error.message }, { status: 500 })
  }
}
