import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import { authenticate } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const { id } = params

    // Check admin_users table first
    let user: any = await prisma.adminUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isSuperAdmin: true,
        roleId: true,
        lastLoginAt: true,
        createdAt: true
      }
    })

    // Fallback to users table
    if (!user) {
      const dbUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          userType: true,
          lastLoginAt: true,
          createdAt: true
        }
      })
      if (dbUser) {
        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim(),
          isActive: dbUser.isActive,
          isSuperAdmin: dbUser.userType === 'admin',
          roleId: null,
          lastLoginAt: dbUser.lastLoginAt,
          createdAt: dbUser.createdAt
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, user })

  } catch (error: any) {
    console.error('Failed to get admin user:', error)
    return NextResponse.json({ error: 'Failed to fetch admin user' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, firstName, lastName, email, roleId, isActive, isSuperAdmin } = body

    // Try admin_users first
    const adminUser = await prisma.adminUser.findUnique({ where: { id } })
    if (adminUser) {
      const updated = await prisma.adminUser.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email }),
          ...(roleId !== undefined && { roleId }),
          ...(isActive !== undefined && { isActive }),
          ...(isSuperAdmin !== undefined && { isSuperAdmin })
        }
      })
      return NextResponse.json({ success: true, user: updated })
    }

    // Fallback to users table
    const user = await prisma.user.findUnique({ where: { id } })
    if (user) {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(email !== undefined && { email }),
          ...(isActive !== undefined && { isActive })
        }
      })
      return NextResponse.json({ success: true, user: updated })
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 })

  } catch (error: any) {
    console.error('Failed to update admin user:', error)
    return NextResponse.json({ error: 'Failed to update admin user' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const { id } = params

    // Try admin_users first
    const adminUser = await prisma.adminUser.findUnique({ where: { id } })
    if (adminUser) {
      await prisma.adminUser.update({
        where: { id },
        data: { isActive: false }
      })
      return NextResponse.json({ success: true, message: 'Admin user deactivated' })
    }

    // Fallback to users table
    const user = await prisma.user.findUnique({ where: { id } })
    if (user) {
      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      })
      return NextResponse.json({ success: true, message: 'User deactivated' })
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 })

  } catch (error: any) {
    console.error('Failed to delete admin user:', error)
    return NextResponse.json({ error: 'Failed to delete admin user' }, { status: 500 })
  }
}
