import { NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const APP_USER_STATUS = new Set(['active', 'inactive', 'suspended'])

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const { id: appId, userId } = params

    if (!UUID_REGEX.test(appId) || !UUID_REGEX.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid application ID or user ID format' },
        { status: 400 }
      )
    }

    const appExists = await prisma.application.findUnique({
      where: { id: appId },
      select: { id: true }
    })
    if (!appExists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const membership = await prisma.userApplication.findUnique({
      where: {
        userId_applicationId: {
          userId,
          applicationId: appId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            phoneNumber: true,
            avatarUrl: true,
            lastLoginAt: true
          }
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'User is not linked to this application' },
        { status: 404 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : undefined
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : undefined
    const phoneNumber = typeof body.phoneNumber === 'string' ? body.phoneNumber.trim() : undefined
    const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : undefined
    const role = typeof body.role === 'string' ? body.role.trim() : undefined
    const status = typeof body.status === 'string' ? body.status.trim().toLowerCase() : undefined
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : undefined

    if (status && !APP_USER_STATUS.has(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Allowed: active, inactive, suspended' },
        { status: 400 }
      )
    }

    const hasUserUpdates =
      firstName !== undefined ||
      lastName !== undefined ||
      phoneNumber !== undefined ||
      avatarUrl !== undefined ||
      isActive !== undefined
    const hasMembershipUpdates = role !== undefined || status !== undefined

    if (!hasUserUpdates && !hasMembershipUpdates) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const [, updatedMembership] = await prisma.$transaction([
      hasUserUpdates
        ? prisma.user.update({
            where: { id: userId },
            data: {
              ...(firstName !== undefined ? { firstName } : {}),
              ...(lastName !== undefined ? { lastName } : {}),
              ...(phoneNumber !== undefined ? { phoneNumber: phoneNumber || null } : {}),
              ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
              ...(isActive !== undefined ? { isActive } : {}),
              updatedAt: new Date()
            }
          })
        : prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      hasMembershipUpdates
        ? prisma.userApplication.update({
            where: {
              userId_applicationId: {
                userId,
                applicationId: appId
              }
            },
            data: {
              ...(role !== undefined ? { role } : {}),
              ...(status !== undefined ? { status } : {}),
              lastActiveAt: new Date()
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  isActive: true,
                  phoneNumber: true,
                  avatarUrl: true,
                  lastLoginAt: true
                }
              }
            }
          })
        : prisma.userApplication.findUniqueOrThrow({
            where: {
              userId_applicationId: {
                userId,
                applicationId: appId
              }
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  isActive: true,
                  phoneNumber: true,
                  avatarUrl: true,
                  lastLoginAt: true
                }
              }
            }
          })
    ])

    return NextResponse.json({
      user: {
        id: updatedMembership.user.id,
        email: updatedMembership.user.email,
        name: `${updatedMembership.user.firstName} ${updatedMembership.user.lastName}`.trim() || 'Unknown User',
        status: updatedMembership.status.toLowerCase(),
        role: updatedMembership.role,
        phone: updatedMembership.user.phoneNumber || undefined,
        avatar: updatedMembership.user.avatarUrl || undefined,
        joinedAt: updatedMembership.joinedAt.toISOString(),
        lastActive:
          updatedMembership.lastActiveAt?.toISOString() ||
          updatedMembership.user.lastLoginAt?.toISOString() ||
          updatedMembership.joinedAt.toISOString()
      },
      message: 'Application user updated successfully'
    })
  } catch (error) {
    console.error('Error updating application user:', error)
    return NextResponse.json(
      { error: 'Failed to update application user' },
      { status: 500 }
    )
  }
}
