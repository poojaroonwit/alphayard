import { HttpClient } from './http';

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  status: number;
  response?: string;
  createdAt: string;
}

export class WebhooksModule {
  constructor(private http: HttpClient) {}

  /** List all registered webhooks */
  async list(): Promise<Webhook[]> {
    const res = await this.http.get<{ webhooks: Webhook[] }>('/api/v1/webhooks');
    return res.webhooks || [];
  }

  /** Register a new webhook endpoint */
  async create(data: { url: string; events: string[]; secret?: string }): Promise<Webhook> {
    return this.http.post<Webhook>('/api/v1/webhooks', data);
  }

  /** Update an existing webhook */
  async update(id: string, data: Partial<{ url: string; events: string[]; isActive: boolean }>): Promise<Webhook> {
    return this.http.patch<Webhook>(`/api/v1/webhooks/${id}`, data);
  }

  /** Delete a webhook endpoint */
  async delete(id: string): Promise<void> {
    await this.http.delete(`/api/v1/webhooks/${id}`);
  }

  /** Get delivery logs for a webhook */
  async getDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
    const res = await this.http.get<{ deliveries: WebhookDelivery[] }>(
      `/api/v1/webhooks/${webhookId}/deliveries`,
    );
    return res.deliveries || [];
  }

  /** Retry a failed delivery */
  async retryDelivery(webhookId: string, deliveryId: string): Promise<void> {
    await this.http.post(`/api/v1/webhooks/${webhookId}/deliveries/${deliveryId}/retry`);
  }
}
