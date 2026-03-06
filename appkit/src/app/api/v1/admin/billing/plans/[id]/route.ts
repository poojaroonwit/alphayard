import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

// GET /api/v1/admin/billing/plans/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
      include: {
        application: { select: { id: true, name: true, slug: true } },
        _count: { select: { subscriptions: true } },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error('[billing/plans/:id GET]', error)
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}

// PUT /api/v1/admin/billing/plans/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const existing = await prisma.subscriptionPlan.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      slug: rawSlug,
      description,
      priceMonthly,
      priceYearly,
      currency,
      features,
      limits,
      isActive,
      isPublic,
      trialDays,
      sortOrder,
      stripePriceIdMonthly,
      stripePriceIdYearly,
    } = body

    // Slug uniqueness check (excluding self)
    if (rawSlug && rawSlug !== existing.slug) {
      const slugConflict = await prisma.subscriptionPlan.findFirst({
        where: { slug: rawSlug, applicationId: existing.applicationId, id: { not: params.id } },
      })
      if (slugConflict) {
        return NextResponse.json({ error: 'A plan with this slug already exists for this application' }, { status: 409 })
      }
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(rawSlug !== undefined && { slug: String(rawSlug).toLowerCase().replace(/[^a-z0-9-]/g, '') }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(priceMonthly !== undefined && { priceMonthly: priceMonthly != null ? priceMonthly : null }),
        ...(priceYearly !== undefined && { priceYearly: priceYearly != null ? priceYearly : null }),
        ...(currency !== undefined && { currency }),
        ...(features !== undefined && { features: Array.isArray(features) ? features : [] }),
        ...(limits !== undefined && { limits: typeof limits === 'object' && !Array.isArray(limits) ? limits : {} }),
        ...(isActive !== undefined && { isActive }),
        ...(isPublic !== undefined && { isPublic }),
        ...(trialDays !== undefined && { trialDays: Number(trialDays) || 0 }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) || 0 }),
        ...(stripePriceIdMonthly !== undefined && { stripePriceIdMonthly: stripePriceIdMonthly || null }),
        ...(stripePriceIdYearly !== undefined && { stripePriceIdYearly: stripePriceIdYearly || null }),
      },
      include: {
        application: { select: { id: true, name: true, slug: true } },
        _count: { select: { subscriptions: true } },
      },
    })

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error('[billing/plans/:id PUT]', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

// DELETE /api/v1/admin/billing/plans/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
      include: { _count: { select: { subscriptions: true } } },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (plan._count.subscriptions > 0) {
      // Soft-delete: deactivate instead of hard-delete to preserve subscription history
      await prisma.subscriptionPlan.update({
        where: { id: params.id },
        data: { isActive: false },
      })
      return NextResponse.json({ message: 'Plan deactivated (has active subscriptions — cannot hard-delete)' })
    }

    await prisma.subscriptionPlan.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Plan deleted' })
  } catch (error: any) {
    console.error('[billing/plans/:id DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
