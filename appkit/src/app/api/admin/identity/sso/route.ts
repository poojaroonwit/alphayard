// SSO Login Endpoint - OAuth flows for external providers
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const clientId = searchParams.get('clientId')
    const redirectUri = searchParams.get('redirectUri')
    const state = searchParams.get('state')
    
    if (!provider || !clientId) {
      return NextResponse.json(
        { error: 'Provider and client ID are required' },
        { status: 400 }
      )
    }
    
    // Mock OAuth URLs for different providers
    const oauthUrls = {
      google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        params: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
          redirect_uri: redirectUri || 'https://appkits.up.railway.app/auth/callback/google',
          response_type: 'code',
          scope: 'openid email profile',
          state: state || 'random-state',
          access_type: 'offline'
        })
      },
      github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        params: new URLSearchParams({
          client_id: process.env.GITHUB_CLIENT_ID || 'mock-github-client-id',
          redirect_uri: redirectUri || 'https://appkits.up.railway.app/auth/callback/github',
          scope: 'user:email',
          state: state || 'random-state'
        })
      },
      microsoft: {
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        params: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID || 'mock-microsoft-client-id',
          redirect_uri: redirectUri || 'https://appkits.up.railway.app/auth/callback/microsoft',
          response_type: 'code',
          scope: 'openid email profile',
          state: state || 'random-state',
          response_mode: 'query'
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
    
    const authUrl = `${oauthConfig.authUrl}?${oauthConfig.params.toString()}`
    
    return NextResponse.json({
      success: true,
      authUrl: authUrl,
      state: state || 'random-state',
      message: `Redirect to ${provider} for authentication`
    })
  } catch (error) {
    console.error('SSO login error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate SSO login' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, code, state, clientId } = body
    
    if (!provider || !code || !clientId) {
      return NextResponse.json(
        { error: 'Provider, code, and client ID are required' },
        { status: 400 }
      )
    }
    
    // Mock OAuth token exchange
    const mockUserInfo = {
      google: {
        id: 'google-123',
        email: 'user@gmail.com',
        name: 'Google User',
        firstName: 'Google',
        lastName: 'User',
        avatar: 'https://lh3.googleusercontent.com/avatar.jpg'
      },
      github: {
        id: 'github-456',
        email: 'user@github.com',
        name: 'GitHub User',
        firstName: 'GitHub',
        lastName: 'User',
        avatar: 'https://avatars.githubusercontent.com/u/123456'
      },
      microsoft: {
        id: 'microsoft-789',
        email: 'user@outlook.com',
        name: 'Microsoft User',
        firstName: 'Microsoft',
        lastName: 'User',
        avatar: 'https://graph.microsoft.com/v1.0/me/photo/$value'
      }
    }
    
    const userInfo = mockUserInfo[provider as keyof typeof mockUserInfo]
    if (!userInfo) {
      return NextResponse.json(
        { error: 'Unsupported provider' },
        { status: 400 }
      )
    }
    
    // Generate tokens
    const token = `mock-sso-${provider}-${Date.now()}`
    const refreshToken = `mock-sso-refresh-${provider}-${Date.now()}`
    
    return NextResponse.json({
      success: true,
      user: userInfo,
      tokens: {
        accessToken: token,
        refreshToken: refreshToken,
        expiresIn: 604800,
        tokenType: 'Bearer'
      },
      provider: provider,
      message: `${provider} authentication successful`
    })
  } catch (error) {
    console.error('SSO callback error:', error)
    return NextResponse.json(
      { error: 'Failed to complete SSO authentication' },
      { status: 500 }
    )
  }
}
