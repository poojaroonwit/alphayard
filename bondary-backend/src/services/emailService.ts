import { prisma } from '../lib/prisma';
import { appkitClient } from '../lib/appkitClient';
import { SystemConfigModel } from '../models/SystemConfigModel';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  smtpType?: 'mobile' | 'admin'; // kept for API compatibility, ignored
}

interface InvitationEmailData {
  inviterName: string;
  circleName: string;
  inviteCode: string;
  inviteUrl: string;
  message?: string;
}

interface WelcomeEmailData {
  userName: string;
  circleName: string;
  loginUrl: string;
}

interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}

class EmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    // Mock mode — log only, no actual send
    const otpConfig = await SystemConfigModel.findByKey('otp_config');
    const isMock = otpConfig?.value?.emailProvider === 'mock' || !otpConfig;

    if (isMock) {
      console.log('\n================== [MOCK OTP EMAIL] ==================');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Code/Data:`, JSON.stringify(options.data, null, 2));
      console.log('======================================================\n');
      await this.logEmail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        messageId: 'mock-' + Date.now(),
        status: 'sent',
      });
      return true;
    }

    // Send via AppKit
    try {
      const result = await appkitClient.communication.sendEmail({
        to: options.to,
        template: options.template,
        subject: options.subject,
        data: options.data,
      });
      console.log(`✅ Email sent via AppKit to ${options.to}:`, result.messageId);
      await this.logEmail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        messageId: result.messageId,
        status: 'sent',
      });
      return true;
    } catch (error) {
      console.error('❌ Failed to send email via AppKit:', error);
      await this.logEmail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  private async logEmail(emailData: {
    to: string;
    subject: string;
    template: string;
    messageId?: string;
    status: 'sent' | 'failed';
    error?: string;
  }) {
    try {
      await prisma.$executeRaw`
        INSERT INTO email_logs (to_email, subject, template, message_id, status, error_message, sent_at)
        VALUES (${emailData.to}, ${emailData.subject}, ${emailData.template}, ${emailData.messageId}, ${emailData.status}, ${emailData.error}, ${new Date().toISOString()})
      `;
    } catch {
      // Non-fatal
    }
  }

  // ── Public convenience methods ──────────────────────────────────

  async sendCircleInvitation(data: InvitationEmailData, toEmail: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: `You're invited to join ${data.circleName} on Boundary`,
      template: 'circle-invitation',
      data,
    });
  }

  async sendWelcomeEmail(data: WelcomeEmailData, toEmail: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: 'Welcome to Boundary!',
      template: 'welcome',
      data,
    });
  }

  async sendPasswordReset(data: PasswordResetEmailData, toEmail: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: 'Reset your Boundary password',
      template: 'password-reset',
      data,
    });
  }

  async sendNotification(data: {
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
  }, toEmail: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: data.title,
      template: 'notification',
      data,
    });
  }

  async sendSecurityAlert(data: {
    alertType: string;
    alertMessage: string;
    timestamp: string;
    deviceName: string;
    location: string;
    ipAddress: string;
    secureAccountUrl: string;
    reviewActivityUrl: string;
  }, toEmail: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: `Security Alert: ${data.alertType}`,
      template: 'security-alert',
      data,
    });
  }

  async sendUsingTemplate(templateSlug: string, to: string, data: Record<string, any>): Promise<boolean> {
    return this.sendEmail({ to, subject: '', template: templateSlug, data });
  }

  async sendBulkEmails(emails: Array<{ to: string; data: any; template: string; subject: string }>): Promise<{
    sent: number;
    failed: number;
    results: Array<{ to: string; success: boolean; error?: string }>;
  }> {
    const results = await Promise.allSettled(emails.map(e => this.sendEmail(e)));
    const processed = results.map((r, i) => ({
      to: emails[i].to,
      success: r.status === 'fulfilled' && r.value,
      error: r.status === 'rejected' ? r.reason?.message : undefined,
    }));
    return {
      sent: processed.filter(r => r.success).length,
      failed: processed.filter(r => !r.success).length,
      results: processed,
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      await appkitClient.communication.getTemplates();
      return true;
    } catch {
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
