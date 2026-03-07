import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// GET /api/v1/admin/billing/plans — list plans (optionally filter by applicationId)
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const { searchParams } = request.nextUrl
    const applicationId = searchParams.get('applicationId') || undefined

    const plans = await prisma.subscriptionPlan.findMany({
      where: applicationId ? { applicationId } : {},
      include: {
        application: { select: { id: true, name: true, slug: true } },
        _count: { select: { subscriptions: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({ plans })
  } catch (error: any) {
    console.error('[billing/plans GET]', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

// POST /api/v1/admin/billing/plans — create plan
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    // Plans are now managed exclusively in Stripe.
    // New plans should be created as Stripe products/prices and synced via
    // POST /api/v1/admin/billing/stripe/sync instead of this endpoint.
    return NextResponse.json(
      {
        error:
          'Subscription plans are managed in Stripe. Create products and prices in Stripe, then sync them using /api/v1/admin/billing/stripe/sync.',
      },
      { status: 400 },
    )
  } catch (error: any) {
    console.error('[billing/plans POST]', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
