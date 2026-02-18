import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';
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
  /** Optional: 'mobile' or 'admin' to use different SMTP configs */
  smtpType?: 'mobile' | 'admin';
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

interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

// Environment variable based config (fallback)
const ENV_SMTP_CONFIG: SMTPConfig = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587'),
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
};

const EMAIL_ENABLED = !!(ENV_SMTP_CONFIG.host && ENV_SMTP_CONFIG.user && ENV_SMTP_CONFIG.pass);

class EmailService {
  private transporter: any | null = null;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private cachedSmtpConfig: { mobile?: SMTPConfig; admin?: SMTPConfig } = {};
  private lastConfigFetch: number = 0;
  private CONFIG_CACHE_TTL = 60000; // 1 minute cache

  constructor() {
    this.initializeTransporter();
    this.loadTemplates();
  }

  /**
   * Get SMTP configuration from database or environment variables
   */
  private async getSmtpConfig(type: 'mobile' | 'admin' = 'mobile'): Promise<SMTPConfig | null> {
    // Check cache first
    const now = Date.now();
    if (this.cachedSmtpConfig[type] && (now - this.lastConfigFetch) < this.CONFIG_CACHE_TTL) {
      return this.cachedSmtpConfig[type]!;
    }

    const smtpKey = type === 'mobile' ? 'smtpMobile' : 'smtpAdmin';

    try {
      // Try to get from system_configs table first (used by SystemConfigModel)
      let integrations = await SystemConfigModel.get('integrations');
      
      // If not in system_configs, try app_settings table (admin UI saves here)
      if (!integrations) {
        try {
          const appSetting = await prisma.appSetting.findFirst({
            where: {
              key: 'integrations'
            },
            select: {
              value: true
            }
          });
          if (appSetting) {
            integrations = appSetting.value as any;
          }
        } catch (e) {
          // app_settings table might not exist
        }
      }

      if (integrations) {
        const dbConfig = integrations[smtpKey];
        
        if (dbConfig && dbConfig.host && dbConfig.user && dbConfig.pass) {
          const config: SMTPConfig = {
            host: dbConfig.host,
            port: dbConfig.port || 587,
            user: dbConfig.user,
            pass: dbConfig.pass,
            from: dbConfig.from || dbConfig.user,
          };
          this.cachedSmtpConfig[type] = config;
          this.lastConfigFetch = now;
          console.log(`✅ SMTP config loaded from database (${type})`);
          return config;
        }
      }
    } catch (error) {
      console.warn('[EmailService] Could not load SMTP config from database:', error);
    }

    // Fallback to environment variables
    if (EMAIL_ENABLED) {
      this.cachedSmtpConfig[type] = ENV_SMTP_CONFIG;
      this.lastConfigFetch = now;
      return ENV_SMTP_CONFIG;
    }

    return null;
  }

  /**
   * Create a transporter for the given SMTP config
   */
  private createTransporter(config: SMTPConfig): any {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  private initializeTransporter() {
    // Initialize with env vars if available (for backward compatibility)
    if (EMAIL_ENABLED) {
      this.transporter = this.createTransporter(ENV_SMTP_CONFIG);

      // Verify connection
      this.transporter.verify((error: Error | null) => {
        if (error) {
          console.error('❌ Email service initialization failed:', error);
        } else {
          console.log('✅ Email service ready (using environment variables)');
        }
      });
    } else {
      console.log('ℹ️ Email service: No env SMTP config. Will check database config on send.');
    }
  }

  /**
   * Clear cached SMTP config (call when admin updates settings)
   */
  public clearConfigCache(): void {
    this.cachedSmtpConfig = {};
    this.lastConfigFetch = 0;
    console.log('ℹ️ Email service config cache cleared');
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

  /**
   * Get a template from the database by slug
   */
  private async getTemplateFromDatabase(slug: string): Promise<{ subject: string; html: string; text?: string } | null> {
    try {
      const template = await prisma.emailTemplate.findFirst({
        where: {
          slug: slug,
          isActive: true
        },
        select: {
          subject: true,
          htmlContent: true,
          textContent: true,
          variables: true
        }
      });
      
      if (!template) {
        return null;
      }
      
      return {
        subject: template.subject,
        html: template.htmlContent || '',
        text: template.textContent || undefined,
      };
    } catch (error) {
      console.warn('[EmailService] Could not fetch template from database:', error);
      return null;
    }
  }

  /**
   * Render a template with data using Handlebars
   */
  private renderTemplateWithData(templateContent: string, data: Record<string, any>): string {
    try {
      const compiled = handlebars.compile(templateContent);
      return compiled(data);
    } catch (error) {
      console.error('[EmailService] Template rendering error:', error);
      // Return template as-is with simple variable replacement fallback
      let result = templateContent;
      Object.entries(data).forEach(([key, value]) => {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      });
      return result;
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

    // Get SMTP config (database first, then env vars)
    const smtpType = options.smtpType || 'mobile';
    const smtpConfig = await this.getSmtpConfig(smtpType);

    if (!smtpConfig) {
      // If we reach here, we are NOT in mock mode, but also have no SMTP config.
      console.warn('⚠️ Email SMTP not configured (neither database nor env vars) and Mock mode disabled. Email not sent.');
      return false;
    }

    try {
      let html: string;
      let subject: string = options.subject;
      let text: string | undefined;

      // Add common defaults to data
      const enrichedData: Record<string, any> = {
        ...options.data,
        year: options.data.year || new Date().getFullYear().toString(),
        appName: options.data.appName || 'AppKit',
      };

      // Support for raw HTML (used by sendTestEmail)
      if (options.template === 'raw' && enrichedData._rawHtml) {
        html = enrichedData._rawHtml;
        text = enrichedData._rawText;
      }
      // First try to get template from database
      else {
        const dbTemplate = await this.getTemplateFromDatabase(options.template);
        
        if (dbTemplate) {
          // Render database template
          html = this.renderTemplateWithData(dbTemplate.html, enrichedData);
          subject = this.renderTemplateWithData(dbTemplate.subject, enrichedData);
          if (dbTemplate.text) {
            text = this.renderTemplateWithData(dbTemplate.text, enrichedData);
          }
        } else if (this.templates.has(options.template)) {
          // Fallback to file-based template
          const template = this.templates.get(options.template)!;
          html = template(enrichedData);
        } else {
          // Fallback to simple HTML
          html = this.generateSimpleHTML(subject, enrichedData);
        }
      }

      // Create transporter with the config (uses cached if same config)
      const transporter = this.createTransporter(smtpConfig);

      const mailOptions: any = {
        from: smtpConfig.from || smtpConfig.user,
        to: options.to,
        subject,
        html,
        attachments: options.attachments,
      };

      // Add plain text version if available
      if (text) {
        mailOptions.text = text;
      }

      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${options.to}:`, result.messageId);

      // Log email in database
      await this.logEmail({
        to: options.to,
        subject,
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
            body { font-circle: Arial, sans-serif; line-height: 1.6; color: #333; }
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
              <h1>AppKit</h1>
            </div>
            <div class="content">
              ${this.generateContentFromData(data)}
            </div>
            <div class="footer">
              <p>© 2024 AppKit. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateContentFromData(data: Record<string, any>): string {
    let content = '';

    if (data.inviterName && data.circleName) {
      content = `
        <h2>You're invited to join ${data.circleName}!</h2>
        <p>Hello!</p>
        <p>${data.inviterName} has invited you to join their circle group "${data.circleName}" on AppKit.</p>
        ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
        <p>Click the button below to accept the invitation:</p>
        <p><a href="${data.inviteUrl}" class="button">Join circle</a></p>
        <p>Or use this code: <strong>${data.inviteCode}</strong></p>
      `;
    } else if (data.userName) {
      content = `
        <h2>Welcome to AppKit, ${data.userName}!</h2>
        <p>Your account has been created successfully.</p>
        ${data.circleName ? `<p>You've joined the circle group: <strong>${data.circleName}</strong></p>` : ''}
        <p>Click the button below to get started:</p>
        <p><a href="${data.loginUrl}" class="button">Get Started</a></p>
      `;
    } else if (data.resetUrl) {
      content = `
        <h2>Password Reset Request</h2>
        <p>Hello ${data.userName},</p>
        <p>You requested a password reset for your AppKit account.</p>
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
      await prisma.$executeRaw`
        INSERT INTO email_logs (to_email, subject, template, message_id, status, error_message, sent_at)
        VALUES (${emailData.to}, ${emailData.subject}, ${emailData.template}, ${emailData.messageId}, ${emailData.status}, ${emailData.error}, ${new Date().toISOString()})
      `;
    } catch (error) {
      console.error('Failed to log email:', error);
    }
  }

  // Public methods
  async sendCircleInvitation(data: InvitationEmailData, toEmail: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: `You're invited to join ${data.circleName} on AppKit`,
      template: 'circle-invitation',
      data
    });
  }

  async sendWelcomeEmail(data: WelcomeEmailData, toEmail: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: 'Welcome to AppKit!',
      template: 'welcome',
      data
    });
  }

  async sendPasswordReset(data: PasswordResetEmailData, toEmail: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: 'Reset your AppKit password',
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

  /**
   * Send security alert email
   */
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
      data
    });
  }

  /**
   * Send using a specific database template by slug
   */
  async sendUsingTemplate(
    templateSlug: string,
    to: string,
    data: Record<string, any>
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: '', // Will be overridden by database template
      template: templateSlug,
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
  async isHealthy(type: 'mobile' | 'admin' = 'mobile'): Promise<boolean> {
    const smtpConfig = await this.getSmtpConfig(type);
    if (!smtpConfig) return false;

    try {
      const transporter = this.createTransporter(smtpConfig);
      await transporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test SMTP connection with given config (for admin testing)
   */
  async testConnection(config: SMTPConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = this.createTransporter(config);
      await transporter.verify();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Send a test email to verify SMTP configuration
   */
  async sendTestEmail(to: string, type: 'mobile' | 'admin' = 'mobile'): Promise<{ success: boolean; error?: string }> {
    const smtpConfig = await this.getSmtpConfig(type);
    if (!smtpConfig) {
      return { success: false, error: 'No SMTP configuration found' };
    }

    try {
      const transporter = this.createTransporter(smtpConfig);
      await transporter.sendMail({
        from: smtpConfig.from || smtpConfig.user,
        to,
        subject: 'Test Email - AppKit SMTP Configuration',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #FA7272;">SMTP Configuration Test</h2>
            <p>This is a test email to verify your SMTP configuration.</p>
            <p><strong>Configuration Type:</strong> ${type}</p>
            <p><strong>SMTP Host:</strong> ${smtpConfig.host}</p>
            <p><strong>Sent At:</strong> ${new Date().toISOString()}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">If you received this email, your SMTP configuration is working correctly.</p>
          </div>
        `,
      });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send test email' 
      };
    }
  }

  /**
   * Get current SMTP status for admin dashboard
   */
  async getStatus(): Promise<{
    mobileConfigured: boolean;
    mobileHealthy: boolean;
    adminConfigured: boolean;
    adminHealthy: boolean;
    source: 'database' | 'environment' | 'none';
  }> {
    const mobileConfig = await this.getSmtpConfig('mobile');
    const adminConfig = await this.getSmtpConfig('admin');
    
    // Determine source
    let source: 'database' | 'environment' | 'none' = 'none';
    try {
      const integrations = await SystemConfigModel.get('integrations');
      if (integrations?.smtpMobile?.host || integrations?.smtpAdmin?.host) {
        source = 'database';
      } else if (EMAIL_ENABLED) {
        source = 'environment';
      }
    } catch {
      if (EMAIL_ENABLED) {
        source = 'environment';
      }
    }

    return {
      mobileConfigured: !!mobileConfig,
      mobileHealthy: mobileConfig ? await this.isHealthy('mobile') : false,
      adminConfigured: !!adminConfig,
      adminHealthy: adminConfig ? await this.isHealthy('admin') : false,
      source,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;

