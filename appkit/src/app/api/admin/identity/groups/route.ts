// User groups management endpoint
import { NextRequest, NextResponse } from 'next/server'

// Mock user groups data
const mockGroups = [
  {
    id: '1',
    name: 'Administrators',
    slug: 'administrators',
    description: 'System administrators with full access',
    isSystem: true,
    isDefault: false,
    permissions: ['*'],
    color: '#ef4444',
    icon: 'shield',
    userCount: 1,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Content Managers',
    slug: 'content-managers',
    description: 'Users who can manage content',
    isSystem: false,
    isDefault: false,
    permissions: ['content:read', 'content:write', 'media:read', 'media:write'],
    color: '#3b82f6',
    icon: 'edit',
    userCount: 3,
    createdAt: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    name: 'Viewers',
    slug: 'viewers',
    description: 'Users with read-only access',
    isSystem: false,
    isDefault: true,
    permissions: ['content:read', 'media:read'],
    color: '#64748b',
    icon: 'eye',
    userCount: 5,
    createdAt: '2024-01-03T00:00:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        groups: mockGroups
      },
      message: 'User groups retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get user groups:', error)
    return NextResponse.json(
      { error: 'Failed to get user groups' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Create a new group
    const newGroup = {
      id: Date.now().toString(),
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
      description: body.description || '',
      isSystem: false,
      isDefault: false,
      permissions: body.permissions || [],
      color: body.color || '#64748b',
      icon: body.icon || 'users',
      userCount: 0,
      createdAt: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: { group: newGroup },
      message: 'User group created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create user group:', error)
    return NextResponse.json(
      { error: 'Failed to create user group' },
      { status: 500 }
    )
  }
}
