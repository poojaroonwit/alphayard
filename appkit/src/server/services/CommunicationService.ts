/**
 * Communication Service
 *
 * Centralized service for sending messages through the PRIMARY provider
 * configured for each channel (email, sms, push).
 *
 * Channel groups:
 *   Email → smtp, sendgrid, mailgun, ses
 *   SMS   → twilio, vonage, messagebird
 *   Push  → firebase, onesignal, apns
 */

import { prisma } from '../lib/prisma';
import { emailTemplateService } from './emailTemplateService';

// ============================================================================
// Channel Group Mapping
// ============================================================================

const CHANNEL_GROUPS: Record<string, string[]> = {
  email: ['smtp', 'sendgrid', 'mailgun', 'ses'],
  sms: ['twilio', 'vonage', 'messagebird'],
  push: ['firebase', 'onesignal', 'apns'],
};

function getChannelForType(type: string): string | null {
  for (const [channel, types] of Object.entries(CHANNEL_GROUPS)) {
    if (types.includes(type)) return channel;
  }
  return null;
}

// ============================================================================
// Provider Config Types
// ============================================================================

interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  isPrimary?: boolean;
  settings: Record<string, any>;
}

// ============================================================================
// Communication Service
// ============================================================================

class CommunicationService {
  /**
   * Get all configured providers, checking app-specific settings first
   * then falling back to the global comm config.
   */
  private async getProviders(applicationId?: string): Promise<ProviderConfig[]> {
    if (applicationId) {
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { settings: true },
      });
      
      if (app?.settings) {
        const settings = app.settings as Record<string, any>;
        if (settings.comm_config && Array.isArray(settings.comm_config.providers)) {
           // We have app-level overrides
           return settings.comm_config.providers;
        }
      }
    }

    // Fallback to global config
    const row = await prisma.systemConfig.findUnique({
      where: { key: 'default_comm_config' },
    });
    if (!row?.value) return [];
    const cfg = row.value as any;
    return Array.isArray(cfg.providers) ? cfg.providers : [];
  }

  /**
   * Resolve the primary provider for a given channel.
   * Falls back to the first enabled provider if none is marked primary.
   */
  async getPrimaryProvider(channel: 'email' | 'sms' | 'push', applicationId?: string): Promise<ProviderConfig | null> {
    const providers = await this.getProviders(applicationId);
    const channelTypes = CHANNEL_GROUPS[channel] || [];

    // Filter to providers in this channel group that are enabled
    const channelProviders = providers.filter(
      (p) => channelTypes.includes(p.type) && p.enabled
    );

    if (channelProviders.length === 0) return null;

    // Find the one marked as primary
    const primary = channelProviders.find((p) => p.isPrimary);
    return primary || channelProviders[0]; // fallback to first enabled
  }

  // ==========================================================================
  // SMS
  // ==========================================================================

  /**
   * Send SMS using the primary SMS provider
   */
  async sendSms(to: string, message: string, applicationId?: string): Promise<{ messageId: string }> {
    const provider = await this.getPrimaryProvider('sms', applicationId);
    if (!provider) {
      console.warn('[CommunicationService] No SMS provider configured — message not sent');
      return { messageId: `no-sms-provider-${Date.now()}` };
    }

    console.log(`[CommunicationService] Sending SMS via ${provider.type} (${provider.name}) to ${to}`);

    switch (provider.type) {
      case 'twilio':
        return this.sendViaTwilio(to, message, provider.settings);
      case 'vonage':
        return this.sendViaVonage(to, message, provider.settings);
      default:
        console.warn(`[CommunicationService] Unsupported SMS provider type: ${provider.type}`);
        return { messageId: `unsupported-${Date.now()}` };
    }
  }

  private async sendViaTwilio(
    to: string,
    message: string,
    settings: Record<string, any>
  ): Promise<{ messageId: string }> {
    const { accountSid, authToken, fromNumber } = settings;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({ To: to, From: fromNumber, Body: message });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as any;
      throw new Error(err?.message || `Twilio error ${res.status}`);
    }

    const result = (await res.json()) as any;
    return { messageId: result.sid || `twilio-${Date.now()}` };
  }

  private async sendViaVonage(
    to: string,
    message: string,
    settings: Record<string, any>
  ): Promise<{ messageId: string }> {
    const { apiKey, apiSecret, fromNumber } = settings;

    const res = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        api_secret: apiSecret,
        to,
        from: fromNumber,
        text: message,
      }),
    });

    if (!res.ok) throw new Error(`Vonage error ${res.status}`);
    const result = (await res.json()) as any;
    const firstMsg = result?.messages?.[0];
    if (firstMsg?.status !== '0') {
      throw new Error(firstMsg?.['error-text'] || 'Vonage send failed');
    }
    return { messageId: firstMsg?.['message-id'] || `vonage-${Date.now()}` };
  }

  // ==========================================================================
  // Email
  // ==========================================================================

  /**
   * Send email using a named template via the primary email provider
   */
  async sendEmailByTemplate(options: {
    slug: string;
    to: string;
    subject?: string;
    data?: Record<string, any>;
    applicationId?: string;
  }): Promise<{ messageId: string }> {
    // emailTemplateService already resolves SMTP config from the primary provider
    return emailTemplateService.sendEmailBySlug(options);
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  /**
   * Get which channel group a provider type belongs to
   */
  getChannelForType(type: string): string | null {
    return getChannelForType(type);
  }

  /**
   * List all providers grouped by channel
   */
  async getProvidersByChannel(applicationId?: string): Promise<Record<string, ProviderConfig[]>> {
    const providers = await this.getProviders(applicationId);
    const grouped: Record<string, ProviderConfig[]> = {
      email: [],
      sms: [],
      push: [],
      other: [],
    };

    for (const p of providers) {
      const channel = getChannelForType(p.type);
      if (channel && grouped[channel]) {
        grouped[channel].push(p);
      } else {
        grouped.other.push(p);
      }
    }

    return grouped;
  }

  /**
   * Enforce single-primary rule when saving config.
   * Returns a cleaned providers array with at most one isPrimary per channel group.
   */
  enforceSinglePrimary(providers: ProviderConfig[]): ProviderConfig[] {
    const seenPrimary = new Set<string>();

    return providers.map((p) => {
      const channel = getChannelForType(p.type);
      if (!channel) return p;

      if (p.isPrimary && p.enabled) {
        if (seenPrimary.has(channel)) {
          // Already have a primary for this channel — demote
          return { ...p, isPrimary: false };
        }
        seenPrimary.add(channel);
      }
      return p;
    });
  }
}

export const communicationService = new CommunicationService();
export default communicationService;
