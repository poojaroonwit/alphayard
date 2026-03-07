import { API_BASE_URL } from './apiConfig'
import { authService } from './authService'

export interface PlanApplication {
  id: string
  name: string
  slug: string
}

export interface SubscriptionPlan {
  id: string
  applicationId: string | null
  name: string
  slug: string
  description: string | null
  priceMonthly: string | null
  priceYearly: string | null
  currency: string
  features: string[]
  limits: Record<string, number | null>
  isActive: boolean
  isPublic: boolean
  trialDays: number
  sortOrder: number
  stripePriceIdMonthly: string | null
  stripePriceIdYearly: string | null
  createdAt: string
  updatedAt: string
  application?: PlanApplication | null
  _count?: { subscriptions: number }
}

export type PlanInput = Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt' | 'application' | '_count'>

// ── Backward-compat types (used by UserManagement.tsx) ───────────────────────
/** @deprecated Use SubscriptionPlan */
export type BillingPlan = SubscriptionPlan

export interface PaymentMethodSummary {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

export interface InvoiceSummary {
  id: string
  number?: string
  amount: number
  currency: string
  status: string
  date: string
  pdfUrl?: string
  pdf?: string
  hostedInvoiceUrl?: string
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authService.getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const billingService = {
  listPlans(applicationId?: string): Promise<{ plans: SubscriptionPlan[] }> {
    const qs = applicationId ? `?applicationId=${applicationId}` : ''
    return apiFetch(`/v1/admin/billing/plans${qs}`)
  },

  getPlan(id: string): Promise<{ plan: SubscriptionPlan }> {
    return apiFetch(`/v1/admin/billing/plans/${id}`)
  },

  createPlan(data: Partial<PlanInput> & { name: string }): Promise<{ plan: SubscriptionPlan }> {
    return apiFetch('/v1/admin/billing/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updatePlan(id: string, data: Partial<PlanInput>): Promise<{ plan: SubscriptionPlan }> {
    return apiFetch(`/v1/admin/billing/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deletePlan(id: string): Promise<{ message: string }> {
    return apiFetch(`/v1/admin/billing/plans/${id}`, { method: 'DELETE' })
  },

  // ── Stripe integration ────────────────────────────────────────────────────
  checkStripeConnection(): Promise<{ connected: boolean; accountId?: string; email?: string; error?: string }> {
    return apiFetch('/v1/admin/billing/stripe/sync')
  },

  syncFromStripe(): Promise<{ synced: number; failed: number; syncedNames: string[]; failedNames?: string[] }> {
    return apiFetch('/v1/admin/billing/stripe/sync', { method: 'POST' })
  },

  // ── Subscription management (user-facing stubs) ──────────────────────────
  getSubscription(): Promise<{ subscription: any }> {
    return apiFetch('/v1/admin/users/subscription')
  },
  createSubscription(data: { planId: string }): Promise<{ subscription: any }> {
    return apiFetch('/v1/admin/users/subscription', { method: 'POST', body: JSON.stringify(data) })
  },
  updateSubscription(id: string, planId: string): Promise<{ subscription: any }> {
    return apiFetch(`/v1/admin/users/subscription/${id}`, { method: 'PUT', body: JSON.stringify({ planId }) })
  },
  cancelSubscription(): Promise<{ subscription: any }> {
    return apiFetch('/v1/admin/users/subscription/cancel', { method: 'POST' })
  },
  reactivateSubscription(): Promise<{ subscription: any }> {
    return apiFetch('/v1/admin/users/subscription/reactivate', { method: 'POST' })
  },
  listPaymentMethods(): Promise<{ paymentMethods: PaymentMethodSummary[] }> {
    return apiFetch('/v1/admin/users/payment-methods')
  },
  addPaymentMethod(paymentMethodId: string): Promise<void> {
    return apiFetch('/v1/admin/users/payment-methods', { method: 'POST', body: JSON.stringify({ paymentMethodId }) })
  },
  removePaymentMethod(id: string): Promise<void> {
    return apiFetch(`/v1/admin/users/payment-methods/${id}`, { method: 'DELETE' })
  },
  setDefaultPaymentMethod(id: string): Promise<void> {
    return apiFetch(`/v1/admin/users/payment-methods/${id}/default`, { method: 'POST' })
  },
  listInvoices(limit = 10): Promise<{ invoices: InvoiceSummary[] }> {
    return apiFetch(`/v1/admin/users/invoices?limit=${limit}`)
  },
  applyCoupon(code: string): Promise<void> {
    return apiFetch('/v1/admin/users/coupon', { method: 'POST', body: JSON.stringify({ code }) })
  },
}
