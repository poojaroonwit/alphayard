// Users management endpoint
import { NextRequest, NextResponse } from 'next/server'

// Mock users data
const mockUsers = [
  {
    id: 'f1707668-141f-4290-b93d-8f8ca8a0f860',
    email: 'admin@appkit.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString()
  },
  {
    id: '2',
    email: 'user@example.com',
    firstName: 'Regular',
    lastName: 'User',
    role: 'user',
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-02T00:00:00Z',
    lastLogin: '2024-01-15T10:30:00Z'
  },
  {
    id: '3',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isActive: false,
    isVerified: false,
    createdAt: '2024-01-03T00:00:00Z',
    lastLogin: null
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    
    // Filter users based on search
    let filteredUsers = mockUsers
    if (search) {
      filteredUsers = mockUsers.filter(user => 
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)
    
    return NextResponse.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / limit)
        }
      },
      message: 'Users retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get users:', error)
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Create a new user
    const newUser = {
      id: Date.now().toString(),
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role || 'user',
      isActive: body.isActive !== undefined ? body.isActive : true,
      isVerified: body.isVerified || false,
      createdAt: new Date().toISOString(),
      lastLogin: null
    }
    
    return NextResponse.json({
      success: true,
      data: { user: newUser },
      message: 'User created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
