// SSO Providers Management
import { NextRequest, NextResponse } from 'next/server'

// Mock SSO providers
const mockSSOProviders = [
  {
    id: 'google',
    name: 'Google',
    displayName: 'Continue with Google',
    type: 'oauth2',
    enabled: true,
    config: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
      scope: 'openid email profile',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
    },
    icon: 'google',
    color: '#4285f4'
  },
  {
    id: 'github',
    name: 'GitHub',
    displayName: 'Continue with GitHub',
    type: 'oauth2',
    enabled: true,
    config: {
      clientId: process.env.GITHUB_CLIENT_ID || 'mock-github-client-id',
      scope: 'user:email',
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user'
    },
    icon: 'github',
    color: '#333333'
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    displayName: 'Continue with Microsoft',
    type: 'oauth2',
    enabled: false,
    config: {
      clientId: process.env.MICROSOFT_CLIENT_ID || 'mock-microsoft-client-id',
      scope: 'openid email profile',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me'
    },
    icon: 'microsoft',
    color: '#00a4ef'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enabled = searchParams.get('enabled')
    
    let providers = mockSSOProviders
    if (enabled === 'true') {
      providers = providers.filter(p => p.enabled)
    }
    
    return NextResponse.json({
      success: true,
      providers: providers,
      message: 'SSO providers retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get SSO providers:', error)
    return NextResponse.json(
      { error: 'Failed to get SSO providers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, config } = body
    
    const provider = mockSSOProviders.find(p => p.id === providerId)
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }
    
    // Update provider configuration
    const updatedProvider = { ...provider, ...config, enabled: true }
    
    return NextResponse.json({
      success: true,
      provider: updatedProvider,
      message: 'SSO provider updated successfully'
    })
  } catch (error) {
    console.error('Failed to update SSO provider:', error)
    return NextResponse.json(
      { error: 'Failed to update SSO provider' },
      { status: 500 }
    )
  }
}
