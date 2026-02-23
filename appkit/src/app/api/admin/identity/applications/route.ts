// Application Registry - Manage connected applications
import { NextRequest, NextResponse } from 'next/server'

// Mock registered applications
const mockApplications = [
  {
    id: '1',
    name: 'AppKit Admin',
    slug: 'appkit-admin',
    description: 'Main admin console for AppKit platform',
    type: 'web',
    status: 'active',
    url: 'https://appkits.up.railway.app',
    callbackUrls: [
      'https://appkits.up.railway.app/auth/callback',
      'http://localhost:3000/auth/callback'
    ],
    allowedOrigins: [
      'https://appkits.up.railway.app',
      'http://localhost:3000'
    ],
    clientId: 'appkit-admin-client-id',
    clientSecret: 'appkit-admin-client-secret',
    logoUrl: null,
    iconUrl: null,
    settings: {
      allowRegistration: false,
      requireEmailVerification: true,
      defaultRole: 'user',
      sessionTimeout: 7200, // 2 hours
      maxSessions: 3
    },
    branding: {
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      logoUrl: null,
      customCSS: null
    },
    statistics: {
      totalUsers: 1,
      activeUsers: 1,
      totalLogins: 156,
      lastLogin: new Date().toISOString()
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Boundary Mobile',
    slug: 'boundary-mobile',
    description: 'Mobile application for boundary management',
    type: 'mobile',
    status: 'active',
    url: 'https://boundary-mobile.app.com',
    callbackUrls: [
      'boundary://auth/callback',
      'exp://boundary-mobile.auth/callback'
    ],
    allowedOrigins: [
      'boundary://*',
      'exp://boundary-mobile.auth/*'
    ],
    clientId: 'boundary-mobile-client-id',
    clientSecret: 'boundary-mobile-client-secret',
    logoUrl: null,
    iconUrl: null,
    settings: {
      allowRegistration: true,
      requireEmailVerification: true,
      defaultRole: 'user',
      sessionTimeout: 86400, // 24 hours
      maxSessions: 5
    },
    branding: {
      primaryColor: '#10b981',
      secondaryColor: '#64748b',
      logoUrl: null,
      customCSS: null
    },
    statistics: {
      totalUsers: 245,
      activeUsers: 189,
      totalLogins: 1247,
      lastLogin: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Content Manager',
    slug: 'content-manager',
    description: 'Content management system for marketing team',
    type: 'web',
    status: 'inactive',
    url: 'https://content.example.com',
    callbackUrls: [
      'https://content.example.com/auth/callback'
    ],
    allowedOrigins: [
      'https://content.example.com'
    ],
    clientId: 'content-manager-client-id',
    clientSecret: 'content-manager-client-secret',
    logoUrl: null,
    iconUrl: null,
    settings: {
      allowRegistration: false,
      requireEmailVerification: true,
      defaultRole: 'content-editor',
      sessionTimeout: 3600, // 1 hour
      maxSessions: 2
    },
    branding: {
      primaryColor: '#f59e0b',
      secondaryColor: '#64748b',
      logoUrl: null,
      customCSS: null
    },
    statistics: {
      totalUsers: 12,
      activeUsers: 8,
      totalLogins: 89,
      lastLogin: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    
    let applications = mockApplications
    
    if (status) {
      applications = applications.filter(app => app.status === status)
    }
    
    if (type) {
      applications = applications.filter(app => app.type === type)
    }
    
    return NextResponse.json({
      success: true,
      applications: applications,
      total: applications.length,
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
    
    const newApplication = {
      id: Date.now().toString(),
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
      description: body.description || '',
      type: body.type || 'web',
      status: 'pending',
      url: body.url,
      callbackUrls: body.callbackUrls || [],
      allowedOrigins: body.allowedOrigins || [],
      clientId: `${body.slug}-client-id`,
      clientSecret: `${body.slug}-client-secret`,
      logoUrl: body.logoUrl || null,
      iconUrl: body.iconUrl || null,
      settings: {
        allowRegistration: body.allowRegistration || false,
        requireEmailVerification: body.requireEmailVerification !== false,
        defaultRole: body.defaultRole || 'user',
        sessionTimeout: body.sessionTimeout || 7200,
        maxSessions: body.maxSessions || 3,
        ...body.settings
      },
      branding: {
        primaryColor: body.primaryColor || '#3b82f6',
        secondaryColor: body.secondaryColor || '#64748b',
        logoUrl: body.logoUrl || null,
        customCSS: body.customCSS || null
      },
      statistics: {
        totalUsers: 0,
        activeUsers: 0,
        totalLogins: 0,
        lastLogin: null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      application: newApplication,
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
