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

    const body = await request.json()
    const {
      applicationId,
      name,
      slug: rawSlug,
      description,
      priceMonthly,
      priceYearly,
      currency = 'USD',
      features = [],
      limits = {},
      isActive = true,
      isPublic = true,
      trialDays = 0,
      sortOrder = 0,
      stripePriceIdMonthly,
      stripePriceIdYearly,
    } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Plan name is required' }, { status: 400 })
    }

    const slug = (rawSlug || toSlug(name.trim())).toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/(^-|-$)/g, '')
    if (!slug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }

    // Slug uniqueness per application
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { slug, applicationId: applicationId || null },
    })
    if (existing) {
      return NextResponse.json({ error: 'A plan with this slug already exists for this application' }, { status: 409 })
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        applicationId: applicationId || null,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        priceMonthly: priceMonthly != null ? priceMonthly : null,
        priceYearly: priceYearly != null ? priceYearly : null,
        currency,
        features: Array.isArray(features) ? features : [],
        limits: typeof limits === 'object' && !Array.isArray(limits) ? limits : {},
        isActive,
        isPublic,
        trialDays: Number(trialDays) || 0,
        sortOrder: Number(sortOrder) || 0,
        stripePriceIdMonthly: stripePriceIdMonthly || null,
        stripePriceIdYearly: stripePriceIdYearly || null,
      },
      include: {
        application: { select: { id: true, name: true, slug: true } },
      },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error: any) {
    console.error('[billing/plans POST]', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
