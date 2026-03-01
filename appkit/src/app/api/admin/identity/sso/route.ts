// SSO Login Endpoint - OAuth flows for real SSO OAuth implementation
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const redirectUri = searchParams.get('redirect_uri')
    const state = searchParams.get('state')
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }
    
    // Get OAuth provider configuration from database
    const oauthProvider = await prisma.oAuthProvider.findFirst({
      where: {
        providerName: provider,
        isEnabled: true
      }
    })
    
    if (!oauthProvider) {
      return NextResponse.json(
        { error: 'OAuth provider not found or disabled' },
        { status: 404 }
      )
    }
    
    // Get scopes array from JSON field
    const scopes = Array.isArray(oauthProvider.scopes) ? oauthProvider.scopes : []
    
    // Build OAuth URLs based on provider
    const oauthUrls = {
      google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        params: new URLSearchParams({
          client_id: oauthProvider.clientId,
          redirect_uri: redirectUri || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://appkits.up.railway.app'}/auth/callback/google`,
          response_type: 'code',
          scope: scopes.join(' '),
          state: state || `google-${Date.now()}`,
          access_type: 'offline',
          prompt: 'consent'
        })
      },
      github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        params: new URLSearchParams({
          client_id: oauthProvider.clientId,
          redirect_uri: redirectUri || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://appkits.up.railway.app'}/auth/callback/github`,
          scope: scopes.join(' '),
          state: state || `github-${Date.now()}`
        })
      },
      microsoft: {
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        params: new URLSearchParams({
          client_id: oauthProvider.clientId,
          redirect_uri: redirectUri || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://appkits.up.railway.app'}/auth/callback/microsoft`,
          response_type: 'code',
          scope: scopes.join(' '),
          state: state || `microsoft-${Date.now()}`
        })
      }
    }
    
    const oauthConfig = oauthUrls[provider as keyof typeof oauthUrls]
    if (!oauthConfig) {
      return NextResponse.json(
        { error: 'Unsupported provider' },
        { status: 400 }
      )
    }
    
    // Build authorization URL
    const authUrl = `${oauthConfig.authUrl}?${oauthConfig.params.toString()}`
    
    return NextResponse.json({
      success: true,
      authUrl,
      state: oauthConfig.params.get('state'),
      provider
    })
  } catch (error) {
    console.error('SSO auth URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, code, state, redirectUri } = body
    
    if (!provider || !code) {
      return NextResponse.json(
        { error: 'Provider and authorization code are required' },
        { status: 400 }
      )
    }
    
    // Get OAuth provider configuration
    const oauthProvider = await prisma.oAuthProvider.findFirst({
      where: {
        providerName: provider,
        isEnabled: true
      }
    })
    
    if (!oauthProvider) {
      return NextResponse.json(
        { error: 'OAuth provider not found or disabled' },
        { status: 404 }
      )
    }
    
    // Exchange authorization code for access token
    let tokenResponse
    let userInfo
    
    if (provider === 'google') {
      // Google OAuth token exchange
      const tokenUrl = 'https://oauth2.googleapis.com/token'
      const googleTokenData = new URLSearchParams({
        client_id: oauthProvider.clientId,
        client_secret: oauthProvider.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://appkits.up.railway.app'}/auth/callback/google`
      })
      
      tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: googleTokenData.toString()
      })
      
      const tokenData = await tokenResponse.json()
      
      if (!tokenResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to exchange authorization code' },
          { status: 400 }
        )
      }
      
      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      })
      
      userInfo = await userInfoResponse.json()
      
    } else if (provider === 'github') {
      // GitHub OAuth token exchange
      const tokenUrl = 'https://github.com/login/oauth/access_token'
      const githubTokenData = new URLSearchParams({
        client_id: oauthProvider.clientId,
        client_secret: oauthProvider.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://appkits.up.railway.app'}/auth/callback/github`
      })
      
      tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: githubTokenData.toString()
      })
      
      const tokenData = await tokenResponse.json()
      
      if (!tokenResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to exchange authorization code' },
          { status: 400 }
        )
      }
      
      // Get user info from GitHub
      const userInfoResponse = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `token ${tokenData.access_token}` }
      })
      
      userInfo = await userInfoResponse.json()
      
    } else if (provider === 'microsoft') {
      // Microsoft OAuth token exchange
      const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
      const microsoftTokenData = new URLSearchParams({
        client_id: oauthProvider.clientId,
        client_secret: oauthProvider.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://appkits.up.railway.app'}/auth/callback/microsoft`,
        scope: 'openid email profile'
      })
      
      tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: microsoftTokenData.toString()
      })
      
      const tokenData = await tokenResponse.json()
      
      if (!tokenResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to exchange authorization code' },
          { status: 400 }
        )
      }
      
      // Get user info from Microsoft
      const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      })
      
      userInfo = await userInfoResponse.json()
    } else {
      return NextResponse.json(
        { error: 'Unsupported provider' },
        { status: 400 }
      )
    }
    
    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        email: userInfo.email.toLowerCase()
      }
    })
    
    if (!user) {
      // Create new user if auto-signup is enabled
      if (!oauthProvider.allowSignup) {
        return NextResponse.json(
          { error: 'User not found and auto-signup is disabled' },
          { status: 404 }
        )
      }
      
      user = await prisma.user.create({
        data: {
          email: userInfo.email.toLowerCase(),
          firstName: userInfo.name?.split(' ')[0] || userInfo.given_name || '',
          lastName: userInfo.name?.split(' ').slice(1).join(' ') || userInfo.family_name || '',
          isActive: true,
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }
    
    // Generate JWT tokens
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development'
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        provider: provider
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    )
    
    const refreshToken = jwt.sign(
      { 
        userId: user.id,
        provider: provider
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )
    
    // Create session
    const sessionId = randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour session
    
    await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        applicationId: null, // SSO sessions are not app-specific
        expiresAt,
        isActive: true,
        lastActivityAt: new Date(),
        createdAt: new Date()
      }
    })
    
    // Log security event
    console.log(`🔐 SSO Login: ${provider} - ${user.email} - Session: ${sessionId}`)
    
    const response = NextResponse.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isVerified: user.isVerified
      },
      session: {
        id: sessionId,
        expiresAt: expiresAt.toISOString()
      },
      provider
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
  } catch (error) {
    console.error('SSO token exchange error:', error)
    return NextResponse.json(
      { error: 'Failed to exchange authorization code' },
      { status: 500 }
    )
  }
}
