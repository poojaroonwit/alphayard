import { NextRequest, NextResponse } from 'next/server'
import { authenticate, hasPermission } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

// GET /api/v1/admin/users - Get all users with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    if (!hasPermission(auth.admin, 'users:view')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build where conditions
    const where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.isActive = status === 'active'
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          avatarUrl: true,
          points: true
        }
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/v1/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    if (!hasPermission(auth.admin, 'users:create')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { email, firstName, lastName, isActive = true } = body

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Email, firstName, and lastName are required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Create user (password would be set separately or via invitation)
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        isActive,
        // Note: In a real implementation, you'd handle password creation/invitation
        passwordHash: '', // Would be properly set
        verifiedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({ user }, { status: 201 })

  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
