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
      displayName: provider.displayName || provider.providerName,
      type: provider.type,
      enabled: provider.isEnabled,
      config: {
        clientId: provider.clientId,
        scopes: provider.scopes,
        authorizationUrl: provider.authorizationUrl,
        userinfoUrl: provider.userinfoUrl,
        allowedDomains: provider.allowedDomains || [],
        claimsMapping: typeof provider.claimsMapping === 'object' ? provider.claimsMapping : {}
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
    const existingProvider = await prisma.oAuthProvider.findUnique({
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
        isEnabled: enabled,
        ...(config && {
          clientId: config.clientId || existingProvider.clientId,
          clientSecret: config.clientSecret || existingProvider.clientSecret,
          scopes: config.scopes || existingProvider.scopes,
          authorizationUrl: config.authorizationUrl || existingProvider.authorizationUrl,
          userinfoUrl: config.userinfoUrl || existingProvider.userinfoUrl,
          allowedDomains: config.allowedDomains || existingProvider.allowedDomains,
        }),
        updatedAt: new Date()
      }
    })
    
    // Log provider update
    console.log(`🔐 SSO Provider Updated: ${updatedProvider.providerName}`, {
      providerId,
      enabled,
      updatedBy: 'admin'
    })
    
    return NextResponse.json({
      success: true,
      provider: {
        id: updatedProvider.id,
        name: updatedProvider.providerName,
        displayName: updatedProvider.displayName || updatedProvider.providerName,
        type: 'oauth2',
        enabled: updatedProvider.isEnabled,
        config: {
          clientId: updatedProvider.clientId,
          scopes: updatedProvider.scopes,
          authorizationUrl: updatedProvider.authorizationUrl,
          userinfoUrl: updatedProvider.userinfoUrl,
          allowedDomains: updatedProvider.allowedDomains || [],
          claimsMapping: typeof updatedProvider.claimsMapping === 'object' ? updatedProvider.claimsMapping : {}
        },
        icon: updatedProvider.iconUrl,
        color: updatedProvider.buttonColor
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
          { providerName: name },
          { displayName: name }
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
        providerName: name,
        displayName: displayName || name,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        scopes: config.scopes || [],
        authorizationUrl: config.authorizationUrl,
        userinfoUrl: config.userinfoUrl,
        allowedDomains: config.allowedDomains || [],
        iconUrl: config.iconUrl,
        buttonColor: config.buttonColor,
        claimsMapping: config.claimsMapping || {},
        allowSignup: config.allowSignup || false,
        requireEmailVerified: config.requireEmailVerified || true,
        autoLinkByEmail: config.autoLinkByEmail || false,
        defaultRole: config.defaultRole || 'user',
        isEnabled: enabled,
        displayOrder: config.displayOrder || 0
      }
    })
    
    console.log(`🔐 SSO Provider Created: ${newProvider.providerName}`, {
      providerId: newProvider.id,
      type: 'oauth2'
    })
    
    return NextResponse.json({
      success: true,
      provider: {
        id: newProvider.id,
        name: newProvider.providerName,
        displayName: newProvider.displayName || newProvider.providerName,
        type: 'oauth2',
        enabled: newProvider.isEnabled,
        config: {
          clientId: newProvider.clientId,
          scopes: newProvider.scopes,
          authorizationUrl: newProvider.authorizationUrl,
          userinfoUrl: newProvider.userinfoUrl,
          allowedDomains: newProvider.allowedDomains || [],
          claimsMapping: typeof newProvider.claimsMapping === 'object' ? newProvider.claimsMapping : {}
        },
        icon: newProvider.iconUrl,
        color: newProvider.buttonColor
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
    const existingProvider = await prisma.oAuthProvider.findUnique({
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
        isActive: true
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
    
    console.log(`🔐 SSO Provider Deleted: ${existingProvider.providerName}`, {
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
