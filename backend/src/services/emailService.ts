import nodemailer from 'nodemailer';
import { pool } from '../config/database';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { SystemConfigModel } from '../models/SystemConfigModel';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface InvitationEmailData {
  inviterName: string;
  familyName: string;
  inviteCode: string;
  inviteUrl: string;
  message?: string;
}

interface WelcomeEmailData {
  userName: string;
  familyName: string;
  loginUrl: string;
}

interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}

const EMAIL_ENABLED = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

class EmailService {
  private transporter: any | null = null;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter() {
    if (EMAIL_ENABLED) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Verify connection
      this.transporter.verify((error: Error | null) => {
        if (error) {
          console.error('❌ Email service initialization failed:', error);
        } else {
          console.log('✅ Email service ready');
        }
      });
    }
  }



  private loadTemplates() {
    const templatesDir = path.join(__dirname, '../templates/emails');

    if (fs.existsSync(templatesDir)) {
      const templateFiles = fs.readdirSync(templatesDir);

      templateFiles.forEach(file => {
        if (file.endsWith('.hbs')) {
          const templateName = file.replace('.hbs', '');
          const templateContent = fs.readFileSync(
            path.join(templatesDir, file),
            'utf8'
          );
          this.templates.set(templateName, handlebars.compile(templateContent));
        }
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    // Check System Config for OTP provider override
    const otpConfig = await SystemConfigModel.get('otp_config');
    // Default to 'mock' if no config found OR explicitly set to mock
    // This answers "which mock otp": It defaults to Mock if not configured!
    const isMock = otpConfig?.emailProvider === 'mock' || !otpConfig;

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
        status: 'sent'
      });
      return true;
    }

    if (!this.transporter || !EMAIL_ENABLED) {
      // If we reach here, we are NOT in mock mode, but also have no transporter.
      // This is a misconfiguration if someone explicitly set "smtp" but didn't provide env vars.
      console.warn('⚠️ Email SMTP not configured and Mock mode disabled. Email not sent.');
      return false;
    }

    try {
      let html: string;

      if (this.templates.has(options.template)) {
        const template = this.templates.get(options.template)!;
        html = template(options.data);
      } else {
        // Fallback to simple HTML
        html = this.generateSimpleHTML(options.subject, options.data);
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${options.to}:`, result.messageId);

      // Log email in database
      await this.logEmail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        messageId: result.messageId,
        status: 'sent'
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);

      // Log failed email
      await this.logEmail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return false;
    }
  }

  private generateSimpleHTML(subject: string, data: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-hourse: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FA7272; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background: #FA7272; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bondarys</h1>
            </div>
            <div class="content">
              ${this.generateContentFromData(data)}
            </div>
            <div class="footer">
              <p>© 2024 Bondarys. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateContentFromData(data: Record<string, any>): string {
    let content = '';

    if (data.inviterName && data.familyName) {
      content = `
        <h2>You're invited to join ${data.familyName}!</h2>
        <p>Hello!</p>
        <p>${data.inviterName} has invited you to join their hourse group "${data.familyName}" on Bondarys.</p>
        ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
        <p>Click the button below to accept the invitation:</p>
        <p><a href="${data.inviteUrl}" class="button">Join hourse</a></p>
        <p>Or use this code: <strong>${data.inviteCode}</strong></p>
      `;
    } else if (data.userName) {
      content = `
        <h2>Welcome to Bondarys, ${data.userName}!</h2>
        <p>Your account has been created successfully.</p>
        ${data.familyName ? `<p>You've joined the hourse group: <strong>${data.familyName}</strong></p>` : ''}
        <p>Click the button below to get started:</p>
        <p><a href="${data.loginUrl}" class="button">Get Started</a></p>
      `;
    } else if (data.resetUrl) {
      content = `
        <h2>Password Reset Request</h2>
        <p>Hello ${data.userName},</p>
        <p>You requested a password reset for your Bondarys account.</p>
        <p>Click the button below to reset your password:</p>
        <p><a href="${data.resetUrl}" class="button">Reset Password</a></p>
        <p>This link will expire in ${data.expiresIn}.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
      `;
    }

    return content;
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
      await pool.query(
        `INSERT INTO email_logs (to_email, subject, template, message_id, status, error_message, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          emailData.to,
          emailData.subject,
          emailData.template,
          emailData.messageId,
          emailData.status,
          emailData.error,
          new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error('Failed to log email:', error);
    }
  }

  // Public methods
  async sendFamilyInvitation(data: InvitationEmailData, toEmail: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: `You're invited to join ${data.familyName} on Bondarys`,
      template: 'hourse-invitation',
      data
    });
  }

  async sendWelcomeEmail(data: WelcomeEmailData, toEmail: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: 'Welcome to Bondarys!',
      template: 'welcome',
      data
    });
  }

  async sendPasswordReset(data: PasswordResetEmailData, toEmail: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: 'Reset your Bondarys password',
      template: 'password-reset',
      data
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
      data
    });
  }

  async sendBulkEmails(emails: Array<{ to: string; data: any; template: string; subject: string }>): Promise<{
    sent: number;
    failed: number;
    results: Array<{ to: string; success: boolean; error?: string }>;
  }> {
    const results = await Promise.allSettled(
      emails.map(email => this.sendEmail(email))
    );

    const processedResults = results.map((result, index) => ({
      to: emails[index].to,
      success: result.status === 'fulfilled' && result.value,
      error: result.status === 'rejected' ? result.reason?.message : undefined
    }));

    return {
      sent: processedResults.filter(r => r.success).length,
      failed: processedResults.filter(r => !r.success).length,
      results: processedResults
    };
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
