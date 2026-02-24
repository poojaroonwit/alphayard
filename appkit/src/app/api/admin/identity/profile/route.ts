// User Profile - Complete implementation with database integration
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // Get user profile with comprehensive data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userApplications: {
          include: {
            application: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true
              }
            }
          }
        },
        userSessions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        userGroupMembers: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
                icon: true,
                permissions: true
              }
            }
          }
        }
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Get user permissions
    const permissions = await getUserPermissions(userId)
    
    // Format response
    const profile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      avatar: user.avatarUrl,
      role: user.userType || 'user',
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLoginAt,
      permissions: permissions,
      applications: user.userApplications.map(ua => ({
        id: ua.application.id,
        name: ua.application.name,
        slug: ua.application.slug,
        logo: ua.application.logoUrl,
        role: ua.role,
        addedAt: ua.createdAt
      })),
      sessions: user.userSessions.map(session => ({
        id: session.id,
        deviceType: session.deviceType,
        deviceName: session.deviceName,
        browser: session.browser,
        ipAddress: session.ipAddress,
        lastActivity: session.lastActivityAt,
        createdAt: session.createdAt
      })),
      groups: user.userGroupMembers.map(ugm => ({
        id: ugm.group.id,
        name: ugm.group.name,
        slug: ugm.group.slug,
        color: ugm.group.color,
        icon: ugm.group.icon,
        role: ugm.role,
        permissions: Array.isArray(ugm.group.permissions) ? ugm.group.permissions : [],
        addedAt: ugm.createdAt
      })),
      statistics: {
        totalApplications: user.userApplications.length,
        activeSessions: user.userSessions.length,
        totalGroups: user.userGroupMembers.length
      }
    }
    
    return NextResponse.json({
      success: true,
      profile,
      message: 'User profile retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get user profile:', error)
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, firstName, lastName, avatarUrl, preferences } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        // Note: metadata field doesn't exist in User model, preferences would need to be stored separately
        updatedAt: new Date()
      }
    })
    
    console.log(`🔐 User Profile Updated: ${userId}`, {
      userId,
      updatedFields: Object.keys({ firstName, lastName, avatarUrl, preferences }).filter(k => body[k])
    })
    
    return NextResponse.json({
      success: true,
      profile: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatarUrl,
        role: updatedUser.userType || 'user',
        isActive: updatedUser.isActive,
        isVerified: updatedUser.isVerified,
        updatedAt: updatedUser.updatedAt
      },
      message: 'User profile updated successfully'
    })
  } catch (error) {
    console.error('Failed to update user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, currentPassword, newPassword } = body
    
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'User ID, current password, and new password are required' },
        { status: 400 }
      )
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash || '')
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }
    
    // Validate new password
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { 
        passwordHash: hashedPassword,
        updatedAt: new Date()
      }
    })
    
    console.log(`🔐 Password Changed: ${userId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Failed to change password:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}

// Helper function to get user permissions
async function getUserPermissions(userId: string) {
  try {
    const userGroupMembers = await prisma.userGroupMember.findMany({
      where: { userId },
      include: {
        group: true
      }
    })
    
    const permissions = new Set<string>()
    userGroupMembers.forEach(userGroupMember => {
      if (userGroupMember.group.permissions) {
        const groupPermissions = Array.isArray(userGroupMember.group.permissions) 
          ? userGroupMember.group.permissions 
          : []
        groupPermissions.forEach((perm: any) => {
          if (typeof perm === 'string') {
            permissions.add(perm)
          }
        })
      }
    })
    
    return Array.from(permissions)
  } catch (error) {
    console.error('Failed to get user permissions:', error)
    return []
  }
}
