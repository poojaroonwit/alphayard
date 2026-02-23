// SSO Providers Management - Complete implementation with database integration
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enabled = searchParams.get('enabled')
    
    let providers = await prisma.oAuthProvider.findMany({
      orderBy: { providerName: 'asc' }
    })
    
    if (enabled === 'true') {
      providers = providers.filter(p => p.isEnabled)
    }
    
    // Transform database records to API format
    const formattedProviders = providers.map((provider: any) => ({
      id: provider.id,
      name: provider.providerName,
      displayName: provider.displayName,
      type: provider.type || 'oauth2',
      enabled: provider.isEnabled,
      config: {
        clientId: provider.clientId,
        scope: provider.scopes || [],
        authUrl: provider.authorizationUrl,
        tokenUrl: provider.tokenUrl,
        userInfoUrl: provider.userinfoUrl,
        redirectUris: provider.allowedDomains || [],
        ...provider.claimsMapping
      },
      icon: provider.iconUrl,
      color: provider.buttonColor,
      metadata: {
        allowSignup: provider.allowSignup,
        requireEmailVerified: provider.requireEmailVerified,
        autoLinkByEmail: provider.autoLinkByEmail,
        defaultRole: provider.defaultRole
      },
      statistics: {
        totalLogins: 0, // Would need to track this separately
        lastLogin: null, // Would need to track this separately
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt
      }
    }))
    
    return NextResponse.json({
      success: true,
      providers: formattedProviders,
      total: formattedProviders.length,
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
    const { providerId, config, enabled = true } = body
    
    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }
    
    // Check if provider exists
    const existingProvider = await prisma.oauthProvider.findUnique({
      where: { id: providerId }
    })
    
    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }
    
    // Update provider configuration
    const updatedProvider = await prisma.oAuthProvider.update({
      where: { id: providerId },
      data: {
        isActive: enabled,
        ...(config && {
          clientId: config.clientId || existingProvider.clientId,
          clientSecret: config.clientSecret || existingProvider.clientSecret,
          scope: config.scope || existingProvider.scope,
          authUrl: config.authUrl || existingProvider.authUrl,
          tokenUrl: config.tokenUrl || existingProvider.tokenUrl,
          userInfoUrl: config.userInfoUrl || existingProvider.userInfoUrl,
          redirectUris: config.redirectUris || existingProvider.redirectUris,
          config: config.config || existingProvider.config
        }),
        updatedAt: new Date()
      }
    })
    
    // Log provider update
    console.log(`🔐 SSO Provider Updated: ${updatedProvider.name}`, {
      providerId,
      enabled,
      updatedBy: 'admin'
    })
    
    return NextResponse.json({
      success: true,
      provider: {
        id: updatedProvider.id,
        name: updatedProvider.name,
        displayName: updatedProvider.displayName || updatedProvider.name,
        type: updatedProvider.type,
        enabled: updatedProvider.isActive,
        config: {
          clientId: updatedProvider.clientId,
          scope: updatedProvider.scope,
          authUrl: updatedProvider.authUrl,
          tokenUrl: updatedProvider.tokenUrl,
          userInfoUrl: updatedProvider.userInfoUrl,
          redirectUris: updatedProvider.redirectUris || [],
          ...updatedProvider.config
        },
        icon: updatedProvider.icon,
        color: updatedProvider.color,
        metadata: updatedProvider.metadata || {}
      },
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, displayName, config, icon, color, enabled = true } = body
    
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }
    
    // Check if provider already exists
    const existingProvider = await prisma.oAuthProvider.findFirst({
      where: { 
        OR: [
          { name },
          { slug: name.toLowerCase().replace(/\s+/g, '-') }
        ]
      }
    })
    
    if (existingProvider) {
      return NextResponse.json(
        { error: 'Provider with this name already exists' },
        { status: 409 }
      )
    }
    
    // Create new SSO provider
    const newProvider = await prisma.oAuthProvider.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        displayName: displayName || name,
        type,
        clientId: config?.clientId || '',
        clientSecret: config?.clientSecret || '',
        scope: config?.scope || 'openid email profile',
        authUrl: config?.authUrl || '',
        tokenUrl: config?.tokenUrl || '',
        userInfoUrl: config?.userInfoUrl || '',
        redirectUris: config?.redirectUris || [],
        isActive: enabled,
        icon: icon || 'default',
        color: color || '#64748b',
        config: config?.config || {},
        metadata: {
          createdBy: 'admin',
          createdAt: new Date().toISOString()
        }
      }
    })
    
    console.log(`🔐 SSO Provider Created: ${newProvider.name}`, {
      providerId: newProvider.id,
      type: newProvider.type
    })
    
    return NextResponse.json({
      success: true,
      provider: {
        id: newProvider.id,
        name: newProvider.name,
        displayName: newProvider.displayName || newProvider.name,
        type: newProvider.type,
        enabled: newProvider.isActive,
        config: {
          clientId: newProvider.clientId,
          scope: newProvider.scope,
          authUrl: newProvider.authUrl,
          tokenUrl: newProvider.tokenUrl,
          userInfoUrl: newProvider.userInfoUrl,
          redirectUris: newProvider.redirectUris || [],
          ...newProvider.config
        },
        icon: newProvider.icon,
        color: newProvider.color,
        metadata: newProvider.metadata || {}
      },
      message: 'SSO provider created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create SSO provider:', error)
    return NextResponse.json(
      { error: 'Failed to create SSO provider' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')
    
    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }
    
    // Check if provider exists
    const existingProvider = await prisma.oauthProvider.findUnique({
      where: { id: providerId }
    })
    
    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }
    
    // Check if provider has active sessions
    const activeSessions = await prisma.userSession.count({
      where: {
        isActive: true,
        user: {
          userSessions: {
            some: {
              ssoProviderId: providerId
            }
          }
        }
      }
    })
    
    if (activeSessions > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete provider with active sessions',
          details: `Provider has ${activeSessions} active sessions`
        },
        { status: 400 }
      )
    }
    
    // Delete provider
    await prisma.oAuthProvider.delete({
      where: { id: providerId }
    })
    
    console.log(`🔐 SSO Provider Deleted: ${existingProvider.name}`, {
      providerId
    })
    
    return NextResponse.json({
      success: true,
      message: 'SSO provider deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete SSO provider:', error)
    return NextResponse.json(
      { error: 'Failed to delete SSO provider' },
      { status: 500 }
    )
  }
}
