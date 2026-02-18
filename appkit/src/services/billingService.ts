// Billing API Service for admin console
import { API_BASE_URL } from './apiConfig'

export interface BillingPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: string
  intervalCount: number
  product?: {
    id: string
    name: string
    description?: string
    features?: string[]
  }
}

export interface SubscriptionSummary {
  id: string
  status: string
  plan: {
    id: string
    name: string
    price: number
    currency: string
    interval: string
    intervalCount: number
  }
  currentPeriodEnd?: string | Date
  cancelAtPeriodEnd?: boolean
}

export interface PaymentMethodSummary {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault?: boolean
}

export interface InvoiceSummary {
  id: string
  number?: string
  amount: number
  currency: string
  status: string
  date: string | Date
  pdf?: string
  hostedInvoiceUrl?: string
}

class BillingService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/billing${endpoint}`
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return (await response.json()) as T
  }

  async listPlans(): Promise<{ plans: BillingPlan[] }> {
    return this.request<{ plans: BillingPlan[] }>(`/plans`)
  }

  async getSubscription(): Promise<{ subscription: any }>{
    return this.request<{ subscription: any }>(`/subscription`)
  }

  async createSubscription(params: { planId: string; paymentMethodId?: string; circleId?: string }): Promise<{ subscription: SubscriptionSummary; clientSecret?: string }>{
    return this.request<{ subscription: SubscriptionSummary; clientSecret?: string }>(`/subscription`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async updateSubscription(id: string, planId: string): Promise<{ subscription: SubscriptionSummary }>{
    return this.request<{ subscription: SubscriptionSummary }>(`/subscription/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ planId }),
    })
  }

  async cancelSubscription(id: string = 'current'): Promise<{ subscription: SubscriptionSummary }>{
    return this.request<{ subscription: SubscriptionSummary }>(`/subscription/${id}/cancel`, {
      method: 'POST',
    })
  }

  async reactivateSubscription(id: string = 'current'): Promise<{ subscription: SubscriptionSummary }>{
    return this.request<{ subscription: SubscriptionSummary }>(`/subscription/${id}/reactivate`, {
      method: 'POST',
    })
  }

  async addPaymentMethod(paymentMethodId: string): Promise<{ message: string }>{
    return this.request<{ message: string }>(`/payment-methods`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId }),
    })
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<{ message: string }>{
    return this.request<{ message: string }>(`/payment-methods/${paymentMethodId}/default`, {
      method: 'POST',
    })
  }

  async listPaymentMethods(): Promise<{ paymentMethods: PaymentMethodSummary[] }>{
    return this.request<{ paymentMethods: PaymentMethodSummary[] }>(`/payment-methods`)
  }

  async removePaymentMethod(paymentMethodId: string): Promise<{ message: string }>{
    return this.request<{ message: string }>(`/payment-methods/${paymentMethodId}`, {
      method: 'DELETE',
    })
  }

  async listInvoices(limit = 10): Promise<{ invoices: InvoiceSummary[] }>{
    const query = new URLSearchParams({ limit: String(limit) }).toString()
    return this.request<{ invoices: InvoiceSummary[] }>(`/invoices?${query}`)
  }

  async applyCoupon(code: string): Promise<{ message: string }>{
    return this.request<{ message: string }>(`/apply-coupon`, {
      method: 'POST',
      body: JSON.stringify({ coupon: code })
    })
  }
}

export const billingService = new BillingService()



