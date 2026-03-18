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

/** Communication provider configuration */
export interface CommProvider {
  id: string;
  name: string;
  type: string; // smtp | sendgrid | mailgun | ses | twilio | vonage | messagebird | firebase | onesignal | apns
  enabled: boolean;
  isPrimary?: boolean; // only one per channel group (email, sms, push)
  settings: Record<string, unknown>;
}

/** Communication configuration with channels and providers */
export interface CommConfig {
  providers: CommProvider[];
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  smtpSettings?: {
    host: string;
    port: number;
    username: string;
    password?: string;
    fromEmail: string;
    fromName: string;
    secure: boolean;
  };
}

/** Channel group constants */
export const CHANNEL_GROUPS: Record<string, string[]> = {
  email: ['smtp', 'sendgrid', 'mailgun', 'ses'],
  sms: ['twilio', 'vonage', 'messagebird'],
  push: ['firebase', 'onesignal', 'apns'],
};

export class CommunicationModule {
  constructor(private http: HttpClient) {}

  // ==========================================================================
  // Sending Messages
  // ==========================================================================

  /** Send a transactional email using the PRIMARY email provider */
  async sendEmail(options: EmailOptions): Promise<{ messageId: string }> {
    return this.http.post<{ messageId: string }>('/api/v1/communication/email', options);
  }

  /** Send a push notification to a user via the PRIMARY push provider */
  async sendPush(userId: string, options: PushOptions): Promise<{ messageId: string }> {
    return this.http.post<{ messageId: string }>('/api/v1/communication/push', {
      userId,
      ...options,
    });
  }

  /** Send an SMS message via the PRIMARY SMS provider */
  async sendSMS(options: SMSOptions): Promise<{ messageId: string }> {
    return this.http.post<{ messageId: string }>('/api/v1/communication/sms', options);
  }

  // ==========================================================================
  // Templates
  // ==========================================================================

  /** List all message templates */
  async getTemplates(): Promise<MessageTemplate[]> {
    const res = await this.http.get<{ templates: MessageTemplate[] }>('/api/v1/communication/templates');
    return res.templates || [];
  }

  // ==========================================================================
  // Provider Config Management (Admin)
  // ==========================================================================

  /** Get the full communication config including all providers */
  async getCommConfig(): Promise<CommConfig | null> {
    const res = await this.http.get<{ config: CommConfig }>('/api/v1/admin/config/communication');
    return res.config || null;
  }

  /** Save the full communication config */
  async saveCommConfig(config: CommConfig): Promise<boolean> {
    const res = await this.http.put<{ success: boolean }>('/api/v1/admin/config/communication', config);
    return res.success;
  }
}

