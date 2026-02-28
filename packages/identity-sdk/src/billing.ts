import { HttpClient } from './http';

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string;
}

export interface Usage {
  apiCalls: number;
  storage: string;
  activeUsers: number;
  [key: string]: unknown;
}

export class BillingModule {
  constructor(private http: HttpClient) {}

  /** Get available subscription plans */
  async getPlans(): Promise<Plan[]> {
    const res = await this.http.get<{ plans: Plan[] }>('/api/v1/billing/plans');
    return res.plans || [];
  }

  /** Subscribe a user to a plan */
  async subscribe(userId: string, planId: string): Promise<Subscription> {
    return this.http.post<Subscription>('/api/v1/billing/subscriptions', { userId, planId });
  }

  /** Get a user's current subscription */
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      return await this.http.get<Subscription>(`/api/v1/billing/subscriptions/${userId}`);
    } catch {
      return null;
    }
  }

  /** Cancel a subscription */
  async cancel(userId: string): Promise<void> {
    await this.http.delete(`/api/v1/billing/subscriptions/${userId}`);
  }

  /** Get usage metrics for a user */
  async getUsage(userId: string): Promise<Usage> {
    return this.http.get<Usage>(`/api/v1/billing/usage/${userId}`);
  }
}
