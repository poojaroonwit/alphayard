import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// POST /api/v1/admin/billing/stripe/sync
// Fetches Stripe products + prices and upserts local SubscriptionPlan records.
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.' }, { status: 400 })
    }

    // Dynamically import Stripe to avoid bundling issues when key is absent
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })

    // Fetch all active products
    const products = await stripe.products.list({ active: true, limit: 100 })

    // Fetch all active prices
    const prices = await stripe.prices.list({ active: true, limit: 100, expand: ['data.product'] })

    const pricesByProduct: Record<string, { monthly: string | null; yearly: string | null; monthlyLookup: string | null; yearlyLookup: string | null; amount: number | null; currency: string }> = {}

    for (const price of prices.data) {
      const productId = typeof price.product === 'string' ? price.product : price.product.id
      if (!pricesByProduct[productId]) {
        pricesByProduct[productId] = { monthly: null, yearly: null, monthlyLookup: null, yearlyLookup: null, amount: null, currency: price.currency.toUpperCase() }
      }
      const entry = pricesByProduct[productId]
      const unitAmount = price.unit_amount != null ? price.unit_amount / 100 : null
      if (price.recurring?.interval === 'month') {
        entry.monthly = price.id
        entry.monthlyLookup = price.lookup_key || null
        if (entry.amount == null) entry.amount = unitAmount
      } else if (price.recurring?.interval === 'year') {
        entry.yearly = price.id
        entry.yearlyLookup = price.lookup_key || null
      } else if (!price.recurring) {
        // one-time — use as monthly fallback
        if (!entry.monthly) {
          entry.monthly = price.id
          entry.monthlyLookup = price.lookup_key || null
        }
        if (entry.amount == null) entry.amount = unitAmount
      }
    }

    const synced: string[] = []
    const failed: string[] = []

    for (const product of products.data) {
      try {
        const pricing = pricesByProduct[product.id]
        const slug = toSlug(product.name) || product.id
        const priceMonthly = pricing?.amount != null ? String(pricing.amount) : null

        // Compute yearly from Stripe price if available
        let priceYearly: string | null = null
        if (pricing?.yearly) {
          const yPrice = prices.data.find(p => p.id === pricing.yearly)
          priceYearly = yPrice?.unit_amount != null ? String(yPrice.unit_amount / 100) : null
        }

        await prisma.subscriptionPlan.upsert({
          where: { slug },
          create: {
            slug,
            name: product.name,
            description: product.description || null,
            priceMonthly,
            priceYearly,
            currency: pricing?.currency || 'USD',
            stripePriceIdMonthly: pricing?.monthly || null,
            stripePriceIdYearly: pricing?.yearly || null,
            stripeLookupKeyMonthly: pricing?.monthlyLookup || null,
            stripeLookupKeyYearly: pricing?.yearlyLookup || null,
            isActive: product.active,
            isPublic: true,
            features: [],
            limits: {},
            trialDays: 0,
            sortOrder: 0,
          },
          update: {
            name: product.name,
            description: product.description || null,
            priceMonthly,
            priceYearly,
            currency: pricing?.currency || 'USD',
            stripePriceIdMonthly: pricing?.monthly || null,
            stripePriceIdYearly: pricing?.yearly || null,
          stripeLookupKeyMonthly: pricing?.monthlyLookup || null,
          stripeLookupKeyYearly: pricing?.yearlyLookup || null,
            isActive: product.active,
          },
        })
        synced.push(product.name)
      } catch {
        failed.push(product.name)
      }
    }

    return NextResponse.json({
      synced: synced.length,
      failed: failed.length,
      syncedNames: synced,
      ...(failed.length > 0 ? { failedNames: failed } : {}),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Stripe sync failed' }, { status: 500 })
  }
}

// GET /api/v1/admin/billing/stripe/sync — check Stripe connection status
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ connected: false, error: 'STRIPE_SECRET_KEY not set' })
    }

    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
      const account = await stripe.accounts.retrieve()
      return NextResponse.json({ connected: true, accountId: account.id, email: (account as any).email || null })
    } catch (e: any) {
      return NextResponse.json({ connected: false, error: e.message })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}
