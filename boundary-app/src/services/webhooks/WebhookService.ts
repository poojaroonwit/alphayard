import { apiClient } from '../api/apiClient';
import { analyticsService } from '../analytics/AnalyticsService';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  headers?: Record<string, string>;
  retryCount: number;
  maxRetries: number;
  timeout: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: Date;
  nextRetry?: Date;
  responseCode?: number;
  responseBody?: string;
  errorMessage?: string;
  createdAt: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  status: 'success' | 'failed';
  responseCode: number;
  responseTime: number; // in milliseconds
  responseBody?: string;
  errorMessage?: string;
  attemptNumber: number;
  createdAt: Date;
}

export interface WebhookStats {
  totalWebhooks: number;
  activeWebhooks: number;
  totalEvents: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  successRate: number;
}

export interface WebhookTemplate {
  id: string;
  name: string;
  description: string;
  events: string[];
  samplePayload: any;
  headers: Record<string, string>;
  isPopular: boolean;
}

class WebhookService {
  async getWebhooks(): Promise<Webhook[]> {
    try {
      const response = await apiClient.get('/webhooks');
      return response.data;
    } catch (error) {
      console.error('Failed to get webhooks:', error);
      throw error;
    }
  }

  async getWebhook(webhookId: string): Promise<Webhook> {
    try {
      const response = await apiClient.get(`/webhooks/${webhookId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get webhook:', error);
      throw error;
    }
  }

  async createWebhook(webhook: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Webhook> {
    try {
      const response = await apiClient.post('/webhooks', webhook);
      
      analyticsService.trackEvent('webhook_created', {
        name: webhook.name,
        eventsCount: webhook.events.length,
        isActive: webhook.isActive
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to create webhook:', error);
      throw error;
    }
  }

  async updateWebhook(webhookId: string, updates: Partial<Webhook>): Promise<Webhook> {
    try {
      const response = await apiClient.put(`/webhooks/${webhookId}`, updates);
      
      analyticsService.trackEvent('webhook_updated', {
        webhookId,
        updatedFields: Object.keys(updates)
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to update webhook:', error);
      throw error;
    }
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      await apiClient.delete(`/webhooks/${webhookId}`);
      
      analyticsService.trackEvent('webhook_deleted', {
        webhookId
      });
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      throw error;
    }
  }

  async testWebhook(webhookId: string, event: string, payload?: any): Promise<{
    success: boolean;
    responseCode: number;
    responseTime: number;
    responseBody?: string;
    errorMessage?: string;
  }> {
    try {
      const response = await apiClient.post(`/webhooks/${webhookId}/test`, {
        event,
        payload
      });
      
      analyticsService.trackEvent('webhook_tested', {
        webhookId,
        event,
        success: response.data.success
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to test webhook:', error);
      throw error;
    }
  }

  async getWebhookEvents(webhookId: string, filters?: {
    status?: string;
    event?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    events: WebhookEvent[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.event) params.append('event', filters.event);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());

      const response = await apiClient.get(`/webhooks/${webhookId}/events?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get webhook events:', error);
      throw error;
    }
  }

  async getWebhookDeliveries(webhookId: string, eventId?: string): Promise<WebhookDelivery[]> {
    try {
      const params = eventId ? `?eventId=${eventId}` : '';
      const response = await apiClient.get(`/webhooks/${webhookId}/deliveries${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get webhook deliveries:', error);
      throw error;
    }
  }

  async retryWebhookEvent(eventId: string): Promise<void> {
    try {
      await apiClient.post(`/webhooks/events/${eventId}/retry`);
      
      analyticsService.trackEvent('webhook_event_retried', {
        eventId
      });
    } catch (error) {
      console.error('Failed to retry webhook event:', error);
      throw error;
    }
  }

  async getWebhookStats(): Promise<WebhookStats> {
    try {
      const response = await apiClient.get('/webhooks/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get webhook stats:', error);
      throw error;
    }
  }

  async getWebhookTemplates(): Promise<WebhookTemplate[]> {
    try {
      const response = await apiClient.get('/webhooks/templates');
      return response.data;
    } catch (error) {
      console.error('Failed to get webhook templates:', error);
      throw error;
    }
  }

  async createWebhookFromTemplate(templateId: string, config: {
    name: string;
    url: string;
    secret?: string;
    headers?: Record<string, string>;
  }): Promise<Webhook> {
    try {
      const response = await apiClient.post(`/webhooks/templates/${templateId}/create`, config);
      
      analyticsService.trackEvent('webhook_created_from_template', {
        templateId,
        name: config.name
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to create webhook from template:', error);
      throw error;
    }
  }

  async getAvailableEvents(): Promise<Array<{
    name: string;
    description: string;
    category: string;
    samplePayload: any;
  }>> {
    try {
      const response = await apiClient.get('/webhooks/events');
      return response.data;
    } catch (error) {
      console.error('Failed to get available events:', error);
      throw error;
    }
  }

  async validateWebhookUrl(url: string): Promise<{
    isValid: boolean;
    error?: string;
    responseTime?: number;
  }> {
    try {
      const response = await apiClient.post('/webhooks/validate-url', { url });
      return response.data;
    } catch (error) {
      console.error('Failed to validate webhook URL:', error);
      throw error;
    }
  }

  async regenerateWebhookSecret(webhookId: string): Promise<{
    secret: string;
  }> {
    try {
      const response = await apiClient.post(`/webhooks/${webhookId}/regenerate-secret`);
      
      analyticsService.trackEvent('webhook_secret_regenerated', {
        webhookId
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to regenerate webhook secret:', error);
      throw error;
    }
  }

  async getWebhookLogs(webhookId: string, filters?: {
    level?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Array<{
    id: string;
    level: string;
    message: string;
    timestamp: Date;
    metadata: any;
  }>> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.level) params.append('level', filters.level);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());

      const response = await apiClient.get(`/webhooks/${webhookId}/logs?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get webhook logs:', error);
      throw error;
    }
  }

  async exportWebhookData(webhookId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const response = await apiClient.get(`/webhooks/${webhookId}/export?format=${format}`);
      
      analyticsService.trackEvent('webhook_data_exported', {
        webhookId,
        format
      });
      
      return response.data.downloadUrl;
    } catch (error) {
      console.error('Failed to export webhook data:', error);
      throw error;
    }
  }

  async getWebhookHealth(webhookId: string): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    lastSuccessfulDelivery?: Date;
    lastFailedDelivery?: Date;
    successRate: number;
    averageResponseTime: number;
    totalDeliveries: number;
  }> {
    try {
      const response = await apiClient.get(`/webhooks/${webhookId}/health`);
      return response.data;
    } catch (error) {
      console.error('Failed to get webhook health:', error);
      throw error;
    }
  }

  async pauseWebhook(webhookId: string): Promise<void> {
    try {
      await apiClient.post(`/webhooks/${webhookId}/pause`);
      
      analyticsService.trackEvent('webhook_paused', {
        webhookId
      });
    } catch (error) {
      console.error('Failed to pause webhook:', error);
      throw error;
    }
  }

  async resumeWebhook(webhookId: string): Promise<void> {
    try {
      await apiClient.post(`/webhooks/${webhookId}/resume`);
      
      analyticsService.trackEvent('webhook_resumed', {
        webhookId
      });
    } catch (error) {
      console.error('Failed to resume webhook:', error);
      throw error;
    }
  }
}

export const webhookService = new WebhookService(); 
