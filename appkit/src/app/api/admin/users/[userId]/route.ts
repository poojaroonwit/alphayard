import { NextResponse } from 'next/server'
import prisma from '@/server/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    // Fetch user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          include: {
            plan: true
          }
        },
        userApplications: true,
        loginHistory: {
          select: {
            loginMethod: true,
            socialProvider: true
          },
          where: {
            success: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Extract unique login methods
    const loginMethods = Array.from(new Set(
      (dbUser as any).loginHistory?.map((h: any) => h.socialProvider || h.loginMethod || 'password') || []
    ))
    if (loginMethods.length === 0 && dbUser.passwordHash) {
      loginMethods.push('password')
    }

    // Determine the active plan (if any), otherwise 'Free'
    const activeSubscription = (dbUser as any).subscriptions?.find((s: any) => s.status === 'active')
    const planName = activeSubscription?.plan?.name || 'Free'

    // Determine role (defaulting to the role in the first userApplication, or 'User')
    const primaryRole = (dbUser as any).userApplications?.[0]?.role || 'User'

    // Parse preferences for any extra info (like company/address) if they exist
    const prefs = dbUser.preferences as any || {}

    // Transform to expected frontend format
    const u = dbUser as any
    const user = {
      id: u.id,
      email: u.email,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      status: u.isActive ? 'active' : 'inactive',
      plan: planName,
      joinedAt: u.createdAt.toISOString(),
      lastActive: u.lastLoginAt?.toISOString() || u.createdAt.toISOString(),
      avatar: u.avatarUrl || undefined,
      phone: u.phoneNumber || undefined,
      address: u.address || prefs.address || undefined,
      company: u.company || prefs.company || undefined,
      city: u.city || undefined,
      state: u.state || undefined,
      country: u.country || undefined,
      zipCode: u.zipCode || undefined,
      jobTitle: u.jobTitle || undefined,
      role: primaryRole,
      loginMethods,
      points: u.points || 0,
      appPoints: u.userApplications?.[0]?.appPoints || 0,
      coins: u.coins || 0
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}
