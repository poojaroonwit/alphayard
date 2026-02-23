// User Roles Management
import { NextRequest, NextResponse } from 'next/server'

// Mock roles with permissions
const mockRoles = [
  {
    id: '1',
    name: 'Super Admin',
    slug: 'super-admin',
    description: 'Full system access with all permissions',
    isSystem: true,
    isDefault: false,
    permissions: ['*'],
    userCount: 1,
    color: '#dc2626',
    icon: 'crown',
    level: 100,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Admin',
    slug: 'admin',
    description: 'Administrative access for application management',
    isSystem: true,
    isDefault: false,
    permissions: [
      'users:read', 'users:write', 'users:delete',
      'roles:read', 'roles:write',
      'applications:read', 'applications:write',
      'settings:read', 'settings:write',
      'analytics:read'
    ],
    userCount: 3,
    color: '#3b82f6',
    icon: 'shield',
    level: 80,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Manager',
    slug: 'manager',
    description: 'Can manage users and content within assigned applications',
    isSystem: false,
    isDefault: false,
    permissions: [
      'users:read', 'users:write',
      'content:read', 'content:write',
      'analytics:read'
    ],
    userCount: 5,
    color: '#10b981',
    icon: 'users',
    level: 60,
    createdAt: '2024-01-02T00:00:00Z'
  },
  {
    id: '4',
    name: 'User',
    slug: 'user',
    description: 'Basic user access with limited permissions',
    isSystem: true,
    isDefault: true,
    permissions: [
      'profile:read', 'profile:write',
      'content:read'
    ],
    userCount: 25,
    color: '#64748b',
    icon: 'user',
    level: 20,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access to content',
    isSystem: false,
    isDefault: false,
    permissions: [
      'content:read'
    ],
    userCount: 10,
    color: '#94a3b8',
    icon: 'eye',
    level: 10,
    createdAt: '2024-01-03T00:00:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeSystem = searchParams.get('includeSystem') !== 'false'
    
    let roles = mockRoles
    if (!includeSystem) {
      roles = roles.filter(r => !r.isSystem)
    }
    
    return NextResponse.json({
      success: true,
      roles: roles.sort((a, b) => b.level - a.level),
      message: 'Roles retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get roles:', error)
    return NextResponse.json(
      { error: 'Failed to get roles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newRole = {
      id: Date.now().toString(),
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
      description: body.description || '',
      isSystem: false,
      isDefault: false,
      permissions: body.permissions || [],
      userCount: 0,
      color: body.color || '#64748b',
      icon: body.icon || 'user',
      level: body.level || 50,
      createdAt: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      role: newRole,
      message: 'Role created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create role:', error)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}
