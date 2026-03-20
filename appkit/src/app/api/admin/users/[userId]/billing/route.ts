import { NextResponse } from 'next/server'
import prisma from '@/server/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    // Fetch all user subscriptions with plan and application details
    const subscriptions = await prisma.subscription.findMany({
      where: { 
        userId: userId
      },
      include: {
        plan: true,
        application: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (subscriptions.length === 0) {
      return NextResponse.json({ subscriptions: [] })
    }

    // Map Prisma Subscription data to a cleaner format for the frontend
    const mappedSubscriptions = subscriptions.map(sub => {
      const metadata = sub.metadata as any || {}
      const limits = sub.plan?.limits as any || {
        users: 100, storage: 500, bandwidth: 1000, apiCalls: 1000000
      }
      const usage = metadata.usage || { users: 1, storage: 1, bandwidth: 1, apiCalls: 1000 }

      return {
        id: sub.id,
        appId: sub.applicationId,
        appName: sub.application?.name || 'Global',
        plan: sub.plan?.slug || 'free',
        planName: sub.plan?.name || 'Free',
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart?.toISOString() || sub.createdAt.toISOString(),
        currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        amount: Number(sub.plan?.priceMonthly) || 0,
        currency: sub.plan?.currency || 'usd',
        paymentMethod: metadata.paymentMethod || {
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          expiry: '12/25'
        },
        usage: usage,
        limits: limits
      }
    })

    return NextResponse.json({ subscriptions: mappedSubscriptions })
  } catch (error) {
    console.error('Error fetching billing info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing info' },
      { status: 500 }
    )
  }
}
