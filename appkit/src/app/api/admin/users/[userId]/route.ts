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
        userApplications: true
      }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Determine the active plan (if any), otherwise 'Free'
    const activeSubscription = (dbUser as any).subscriptions?.find((s: any) => s.status === 'active')
    const planName = activeSubscription?.plan?.name || 'Free'

    // Determine role (defaulting to the role in the first userApplication, or 'User')
    const primaryRole = (dbUser as any).userApplications?.[0]?.role || 'User'

    // Parse preferences for any extra info (like company/address) if they exist
    const prefs = dbUser.preferences as any || {}

    // Transform to expected frontend format
    const user = {
      id: dbUser.id,
      email: dbUser.email,
      name: `${dbUser.firstName} ${dbUser.lastName}`.trim(),
      status: dbUser.isActive ? 'active' : 'inactive',
      plan: planName,
      joinedAt: dbUser.createdAt.toISOString(),
      lastActive: dbUser.lastLoginAt?.toISOString() || dbUser.createdAt.toISOString(),
      avatar: dbUser.avatarUrl || undefined,
      phone: dbUser.phoneNumber || undefined,
      address: prefs.address || undefined,
      company: prefs.company || undefined,
      role: primaryRole,
      points: dbUser.points || 0,
      appPoints: (dbUser as any).userApplications?.[0]?.appPoints || 0
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
