// Application Registry - Complete implementation with database integration
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    
    let whereClause: any = {}
    if (status) {
      whereClause.isActive = status === 'active'
    }
    if (type) {
      whereClause.type = type
    }
    
    let applications = await prisma.application.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        userApplications: {
          select: { id: true }
        },
        userSessions: {
          where: { isActive: true },
          select: { id: true }
        }
      }
    })
    
    // Format response with statistics
    const formattedApplications = applications.map(app => ({
      id: app.id,
      name: app.name,
      slug: app.slug,
      description: app.description,
      type: app.type || 'web',
      status: app.isActive ? 'active' : 'inactive',
      url: app.url,
      clientId: generateClientId(app.id),
      clientSecret: generateClientSecret(app.id),
      callbackUrls: [], // Would need separate table for this
      allowedOrigins: [], // Would need separate table for this
      settings: {
        allowRegistration: false,
        requireEmailVerification: true,
        defaultRole: 'user',
        sessionTimeout: 7200,
        maxSessions: 3,
        ...app.settings
      },
      branding: {
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        logoUrl: app.logoUrl,
        ...app.branding
      },
      statistics: {
        totalUsers: app.userApplications.length,
        activeUsers: app.userSessions.length,
        totalLogins: 0, // Would need to track this separately
        lastLogin: null // Would need to track this separately
      },
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    }))
    
    return NextResponse.json({
      success: true,
      applications: formattedApplications,
      total: formattedApplications.length,
      message: 'Applications retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get applications:', error)
    return NextResponse.json(
      { error: 'Failed to get applications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, description, type, url, settings, branding } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'Application name is required' },
        { status: 400 }
      )
    }
    
    // Generate slug if not provided
    const appSlug = slug || name.toLowerCase().replace(/\s+/g, '-')
    
    // Check if application already exists
    const existingApp = await prisma.application.findFirst({
      where: {
        OR: [
          { name },
          { slug: appSlug }
        ]
      }
    })
    
    if (existingApp) {
      return NextResponse.json(
        { error: 'Application with this name already exists' },
        { status: 409 }
      )
    }
    
    // Create new application
    const newApp = await prisma.application.create({
      data: {
        name,
        slug: appSlug,
        description: description || '',
        type: type || 'web',
        url: url || '',
        logoUrl: null,
        branding: branding || {},
        settings: settings || {},
        isActive: true
      }
    })
    
    console.log(`🔐 Application Created: ${newApp.name}`, {
      applicationId: newApp.id,
      clientId: generateClientId(newApp.id)
    })
    
    return NextResponse.json({
      success: true,
      application: {
        id: newApp.id,
        name: newApp.name,
        slug: newApp.slug,
        description: newApp.description,
        type: newApp.type || 'web',
        status: 'active',
        url: newApp.url,
        clientId: generateClientId(newApp.id),
        clientSecret: generateClientSecret(newApp.id),
        callbackUrls: [],
        allowedOrigins: [],
        settings: {
          allowRegistration: false,
          requireEmailVerification: true,
          defaultRole: 'user',
          sessionTimeout: 7200,
          maxSessions: 3,
          ...newApp.settings
        },
        branding: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          logoUrl: newApp.logoUrl,
          ...newApp.branding
        },
        statistics: {
          totalUsers: 0,
          activeUsers: 0,
          totalLogins: 0,
          lastLogin: null
        },
        createdAt: newApp.createdAt,
        updatedAt: newApp.updatedAt
      },
      message: 'Application registered successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to register application:', error)
    return NextResponse.json(
      { error: 'Failed to register application' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, slug, description, type, url, status, settings, branding } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }
    
    // Check if application exists
    const existingApp = await prisma.application.findUnique({
      where: { id }
    })
    
    if (!existingApp) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }
    
    // Check for duplicate name/slug if changing
    if (name || slug) {
      const duplicateCheck = await prisma.application.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(name ? [{ name }] : []),
                ...(slug ? [{ slug }] : [])
              ]
            }
          ]
        }
      })
      
      if (duplicateCheck) {
        return NextResponse.json(
          { error: 'Application with this name or slug already exists' },
          { status: 409 }
        )
      }
    }
    
    // Update application
    const updatedApp = await prisma.application.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(url !== undefined && { url }),
        ...(status !== undefined && { isActive: status === 'active' }),
        ...(settings && { settings }),
        ...(branding && { branding }),
        updatedAt: new Date()
      }
    })
    
    console.log(`🔐 Application Updated: ${updatedApp.name}`, {
      applicationId: updatedApp.id
    })
    
    return NextResponse.json({
      success: true,
      application: {
        id: updatedApp.id,
        name: updatedApp.name,
        slug: updatedApp.slug,
        description: updatedApp.description,
        type: updatedApp.type || 'web',
        status: updatedApp.isActive ? 'active' : 'inactive',
        url: updatedApp.url,
        clientId: generateClientId(updatedApp.id),
        clientSecret: generateClientSecret(updatedApp.id),
        callbackUrls: [],
        allowedOrigins: [],
        settings: {
          allowRegistration: false,
          requireEmailVerification: true,
          defaultRole: 'user',
          sessionTimeout: 7200,
          maxSessions: 3,
          ...updatedApp.settings
        },
        branding: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          logoUrl: updatedApp.logoUrl,
          ...updatedApp.branding
        },
        statistics: {
          totalUsers: 0, // Would need to recalculate
          activeUsers: 0, // Would need to recalculate
          totalLogins: 0,
          lastLogin: null
        },
        createdAt: updatedApp.createdAt,
        updatedAt: updatedApp.updatedAt
      },
      message: 'Application updated successfully'
    })
  } catch (error) {
    console.error('Failed to update application:', error)
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('id')
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }
    
    // Check if application exists
    const existingApp = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        userApplications: {
          select: { id: true }
        },
        userSessions: {
          where: { isActive: true },
          select: { id: true }
        }
      }
    })
    
    if (!existingApp) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }
    
    // Check if application has active users or sessions
    if (existingApp.userApplications.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete application with registered users',
          details: `Application has ${existingApp.userApplications.length} registered users`
        },
        { status: 400 }
      )
    }
    
    if (existingApp.userSessions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete application with active sessions',
          details: `Application has ${existingApp.userSessions.length} active sessions`
        },
        { status: 400 }
      )
    }
    
    // Delete application
    await prisma.application.delete({
      where: { id: applicationId }
    })
    
    console.log(`🔐 Application Deleted: ${existingApp.name}`, {
      applicationId
    })
    
    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete application:', error)
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateClientId(appId: string): string {
  return `app_${appId.substring(0, 8)}_client`
}

function generateClientSecret(appId: string): string {
  return `app_${appId.substring(0, 8)}_secret_${randomBytes(16).toString('hex')}`
}
