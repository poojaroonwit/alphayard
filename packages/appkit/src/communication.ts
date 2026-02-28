import { HttpClient } from './http';

export interface EmailOptions {
  to: string;
  template: string;
  data?: Record<string, unknown>;
  subject?: string;
}

export interface PushOptions {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
}

export interface SMSOptions {
  to: string;
  template: string;
  data?: Record<string, unknown>;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'push';
  subject?: string;
  body: string;
  createdAt: string;
}

export class CommunicationModule {
  constructor(private http: HttpClient) {}

  /** Send a transactional email using a template */
  async sendEmail(options: EmailOptions): Promise<{ messageId: string }> {
    return this.http.post<{ messageId: string }>('/api/v1/communication/email', options);
  }

  /** Send a push notification to a user */
  async sendPush(userId: string, options: PushOptions): Promise<{ messageId: string }> {
    return this.http.post<{ messageId: string }>('/api/v1/communication/push', {
      userId,
      ...options,
    });
  }

  /** Send an SMS message */
  async sendSMS(options: SMSOptions): Promise<{ messageId: string }> {
    return this.http.post<{ messageId: string }>('/api/v1/communication/sms', options);
  }

  /** List all message templates */
  async getTemplates(): Promise<MessageTemplate[]> {
    const res = await this.http.get<{ templates: MessageTemplate[] }>('/api/v1/communication/templates');
    return res.templates || [];
  }
}
