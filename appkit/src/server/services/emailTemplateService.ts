import { prisma } from '../lib/prisma';
import nodemailer from 'nodemailer';

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    variables: string[];
    isActive: boolean;
    applicationId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateEmailTemplateData {
    slug?: string;
    name: string;
    description?: string;
    category?: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    variables?: string[];
    sampleData?: any;
    isActive?: boolean;
    applicationId?: string;
}

export interface UpdateEmailTemplateData {
    name?: string;
    description?: string;
    category?: string;
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    variables?: string[];
    sampleData?: any;
    isActive?: boolean;
    changeNote?: string;
}

/**
 * Email Template Service
 * 
 * Manages email templates for the application.
 */
class EmailTemplateService {
    private async getEffectiveEmailProvider(applicationId?: string): Promise<{
        type: 'smtp' | 'sendgrid' | 'mailgun' | 'brevo' | 'ses';
        settings: Record<string, any>;
    } | null> {
        const emailTypes = ['smtp', 'sendgrid', 'mailgun', 'brevo', 'ses'];

        const pickProvider = (providers: any[]): { type: string; settings: Record<string, any> } | null => {
            const enabled = providers.filter((p: any) => emailTypes.includes(p.type) && p.enabled !== false);
            const primary = enabled.find((p: any) => p.isPrimary) || enabled[0];
            return primary ? { type: primary.type, settings: primary.settings || {} } : null;
        };

        if (applicationId) {
            // 1. AppSetting override (config_override_comm) — written by the UI drawer
            const appSetting = await prisma.appSetting.findFirst({
                where: { applicationId, key: 'config_override_comm' },
            });
            if (appSetting?.value) {
                const commCfg = appSetting.value as any;
                if (Array.isArray(commCfg.providers)) {
                    const p = pickProvider(commCfg.providers);
                    if (p) {
                        console.log(`[EmailTemplateService] Provider resolved from AppSetting (app ${applicationId}): type=${p.type}`);
                        return p as any;
                    }
                }
            }

            // 2. Legacy fallback: application.settings.comm_config
            const app = await prisma.application.findUnique({
                where: { id: applicationId },
                select: { settings: true },
            });
            if (app?.settings) {
                const settings = app.settings as Record<string, any>;
                if (Array.isArray(settings.comm_config?.providers)) {
                    const p = pickProvider(settings.comm_config.providers);
                    if (p) {
                        console.log(`[EmailTemplateService] Provider resolved from application.settings (app ${applicationId}): type=${p.type}`);
                        return p as any;
                    }
                }
            }
        }

        // 3. Global default_comm_config
        const commRow = await prisma.systemConfig.findUnique({ where: { key: 'default_comm_config' } });
        if (commRow?.value) {
            const commCfg = commRow.value as any;
            if (Array.isArray(commCfg.providers)) {
                const p = pickProvider(commCfg.providers);
                if (p) {
                    console.log(`[EmailTemplateService] Provider resolved from global default_comm_config: type=${p.type}`);
                    return p as any;
                }
            }
        }

        // 4. Legacy system.smtp key
        const legacyRow = await prisma.systemConfig.findUnique({ where: { key: 'system.smtp' } });
        if (legacyRow?.value) {
            console.log(`[EmailTemplateService] Provider resolved from legacy system.smtp key`);
            return { type: 'smtp', settings: legacyRow.value as Record<string, any> };
        }

        // 5. Environment variables
        const host = process.env.SMTP_HOST || '';
        if (host) {
            console.log(`[EmailTemplateService] Provider resolved from environment variables: SMTP_HOST=${host}`);
            return {
                type: 'smtp',
                settings: {
                    host,
                    port: process.env.SMTP_PORT || '587',
                    secure: process.env.SMTP_SECURE || 'false',
                    username: process.env.SMTP_USER || '',
                    password: process.env.SMTP_PASS || '',
                    fromEmail: process.env.SMTP_FROM || 'noreply@example.com',
                    fromName: 'AppKit',
                },
            };
        }

        console.warn(`[EmailTemplateService] No email provider configured anywhere`);
        return null;
    }

    private async sendViaProvider(
        provider: { type: string; settings: Record<string, any> },
        mail: { to: string; subject: string; html: string; text?: string }
    ): Promise<{ messageId: string }> {
        const { type, settings: s } = provider;
        const fromEmail = s.fromEmail || 'noreply@example.com';
        const fromName = s.fromName || 'AppKit';

        if (type === 'sendgrid') {
            if (!s.apiKey) throw new Error('SendGrid API key is not configured');
            const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: { Authorization: `Bearer ${s.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: mail.to }] }],
                    from: { email: fromEmail, name: fromName },
                    subject: mail.subject,
                    content: [
                        { type: 'text/html', value: mail.html },
                        ...(mail.text ? [{ type: 'text/plain', value: mail.text }] : []),
                    ],
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({})) as any;
                throw new Error(body.errors?.[0]?.message || `SendGrid error: ${res.status}`);
            }
            return { messageId: `sendgrid-${Date.now()}` };
        }

        if (type === 'mailgun') {
            if (!s.apiKey) throw new Error('Mailgun API key is not configured');
            if (!s.domain) throw new Error('Mailgun domain is not configured');
            const auth = Buffer.from(`api:${s.apiKey}`).toString('base64');
            const params = new URLSearchParams({
                from: `${fromName} <${fromEmail}>`,
                to: mail.to,
                subject: mail.subject,
                html: mail.html,
                ...(mail.text ? { text: mail.text } : {}),
            });
            const res = await fetch(`https://api.mailgun.net/v3/${s.domain}/messages`, {
                method: 'POST',
                headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({})) as any;
                throw new Error(body.message || `Mailgun error: ${res.status}`);
            }
            const data = await res.json() as any;
            return { messageId: data.id || `mailgun-${Date.now()}` };
        }

        // Brevo (Sendinblue) — HTTP API (avoids SMTP port blocking)
        if (type === 'brevo') {
            if (!s.apiKey) throw new Error('Brevo API key is not configured');
            const res = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: { 'api-key': s.apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: { name: fromName, email: fromEmail },
                    to: [{ email: mail.to }],
                    subject: mail.subject,
                    htmlContent: mail.html,
                    ...(mail.text ? { textContent: mail.text } : {}),
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({})) as any;
                throw new Error(body.message || `Brevo error: ${res.status}`);
            }
            const data = await res.json() as any;
            return { messageId: data.messageId || `brevo-${Date.now()}` };
        }

        // SMTP (default)
        const host = String(s.host || '');
        if (!host) throw new Error('SMTP host is not configured');
        const port = Number(s.port || 587);
        const secure = Boolean(s.secure === true || s.secure === 'true');
        const user = s.username || s.user || '';
        console.log(`[EmailTemplateService] SMTP config → host=${host} port=${port} secure=${secure} user=${user || '(none)'}`);
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: user ? { user, pass: s.password || s.pass || '' } : undefined,
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 10000,
        });
        const result = await transporter.sendMail({
            from: `${fromName} <${fromEmail}>`,
            to: mail.to,
            subject: mail.subject,
            html: mail.html,
            ...(mail.text ? { text: mail.text } : {}),
        });
        return { messageId: result.messageId };
    }

    async createTemplate(data: CreateEmailTemplateData): Promise<EmailTemplate> {
        const template = await prisma.emailTemplate.create({
            data: {
                slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                name: data.name,
                subject: data.subject,
                htmlContent: data.htmlContent,
                textContent: data.textContent || null,
                variables: data.variables || [],
                isActive: data.isActive !== undefined ? data.isActive : true,
                applicationId: data.applicationId || null
            }
        });

        return this.mapRowToTemplate(template);
    }

    async getTemplate(id: string): Promise<EmailTemplate | null> {
        const template = await prisma.emailTemplate.findUnique({
            where: { id }
        });

        if (!template) return null;
        return this.mapRowToTemplate(template);
    }

    async getTemplateByName(name: string, applicationId?: string): Promise<EmailTemplate | null> {
        const templates = await prisma.emailTemplate.findMany({
            where: {
                name,
                applicationId: applicationId || null
            },
            orderBy: {
                applicationId: 'desc'
            },
            take: 1
        });

        if (!templates[0]) return null;
        return this.mapRowToTemplate(templates[0]);
    }

    async updateTemplate(id: string, data: UpdateEmailTemplateData): Promise<EmailTemplate | null> {
        const updateData: any = {};
        
        if (data.subject !== undefined) {
            updateData.subject = data.subject;
        }
        if (data.htmlContent !== undefined) {
            updateData.htmlContent = data.htmlContent;
        }
        if (data.textContent !== undefined) {
            updateData.textContent = data.textContent;
        }
        if (data.variables !== undefined) {
            updateData.variables = data.variables;
        }
        if (data.isActive !== undefined) {
            updateData.isActive = data.isActive;
        }

        if (Object.keys(updateData).length === 0) {
            return this.getTemplate(id);
        }

        const template = await prisma.emailTemplate.update({
            where: { id },
            data: updateData
        });

        return this.mapRowToTemplate(template);
    }

    async deleteTemplate(id: string): Promise<boolean> {
        const result = await prisma.emailTemplate.delete({
            where: { id }
        });
        return !!result;
    }

    async listTemplates(applicationId?: string, page: number = 1, limit: number = 20): Promise<{
        templates: EmailTemplate[];
        total: number;
        page: number;
        limit: number;
    }> {
        const where = applicationId ? { applicationId } : {};
        const offset = (page - 1) * limit;

        // Get total count
        const total = await prisma.emailTemplate.count({ where });

        // Get templates
        const templates = await prisma.emailTemplate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit
        });

        return {
            templates: templates.map((t: any) => this.mapRowToTemplate(t)),
            total,
            page,
            limit
        };
    }

    async getCategories(): Promise<string[]> {
        // Baseline categories corresponding to core communication types
        return ['welcome', 'password-reset', 'verification', 'notification', 'marketing', 'billing'];
    }

    async getTemplates(options?: any): Promise<{
        templates: EmailTemplate[];
        total: number;
        page: number;
        limit: number;
    }> {
        return this.listTemplates(options?.applicationId, options?.page, options?.limit);
    }

    async getTemplateById(id: string): Promise<EmailTemplate | null> {
        return this.getTemplate(id);
    }

    async duplicateTemplate(id: string, slug: string, name: string, userId?: string): Promise<EmailTemplate | null> {
        const template = await this.getTemplate(id);
        if (!template) return null;

        const newTemplate = await this.createTemplate({
            name,
            subject: `Copy of ${template.subject}`,
            htmlContent: template.htmlContent,
            textContent: template.textContent,
            variables: template.variables,
            isActive: false
        });

        return newTemplate;
    }

    async getTemplateVersions(id: string): Promise<any[]> {
        // Versioning is not yet supported in the database schema
        return [];
    }

    async restoreVersion(id: string, versionId: number, userId?: string): Promise<EmailTemplate | null> {
        // Versioning is not yet supported; return current template
        return this.getTemplate(id);
    }

    async previewTemplate(id: string, data: Record<string, any>): Promise<string> {
        const template = await this.getTemplate(id);
        if (!template) return '';

        let content = template.htmlContent || '';
        
        // Replace variables in the template
        for (const [key, value] of Object.entries(data)) {
            const placeholder = `{{${key}}}`;
            content = content.replace(new RegExp(placeholder, 'g'), String(value));
        }

        return content;
    }

    async sendTestEmail(id: string, to: string, data: Record<string, any>): Promise<boolean> {
        try {
            const template = await this.getTemplate(id);
            if (!template) return false;

            const renderedContent = await this.previewTemplate(id, data);
            
            // Replace variables in subject as well
            let subject = template.subject;
            for (const [key, value] of Object.entries(data)) {
                subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
            }

            const provider = await this.getEffectiveEmailProvider(template.applicationId || undefined);
            if (provider) {
                await this.sendViaProvider(provider, { to, subject, html: renderedContent });
                console.log(`Email successfully sent to ${to} via ${provider.type}`);
            } else {
                console.warn('Test Email (no provider configured, logging to console):', { to, subject });
            }

            return true;
        } catch (error) {
            console.error('Failed to send test email:', error);
            return false;
        }
    }

    /**
     * Find template by slug, render with variables, and send via SMTP.
     * Used by the service-to-service communication endpoint.
     */
    async sendEmailBySlug(options: {
        slug: string;
        to: string;
        subject?: string;
        data?: Record<string, any>;
        applicationId?: string;
    }): Promise<{ messageId: string }> {
        const { slug, to, data = {}, applicationId } = options;

        // Find app-specific template first, fall back to platform default, then any active template
        let template = await prisma.emailTemplate.findFirst({
            where: {
                slug,
                isActive: true,
                ...(applicationId ? { OR: [{ applicationId }, { applicationId: null }] } : { applicationId: null }),
            },
            orderBy: { applicationId: 'desc' }, // app-specific wins
        });

        // Last resort: find any active template with this slug regardless of application scope
        if (!template) {
            template = await prisma.emailTemplate.findFirst({
                where: { slug, isActive: true },
                orderBy: { applicationId: 'desc' },
            });
        }

        if (!template) {
            throw new Error(`Email template '${slug}' not found`);
        }

        const render = (content: string): string => {
            let out = content;
            for (const [key, value] of Object.entries(data)) {
                out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
            }
            return out;
        };

        const subject = options.subject || render(template.subject);
        const html = template.htmlContent ? render(template.htmlContent as string) : '';
        const text = template.textContent ? render(template.textContent as string) : undefined;

        const provider = await this.getEffectiveEmailProvider(applicationId);

        if (!provider) {
            console.warn('[EmailTemplateService] No email provider configured. Email not sent:', { to, subject });
            return { messageId: `no-provider-${Date.now()}` };
        }

        console.log(`[EmailTemplateService] Sending via ${provider.type} to ${to}`);
        const result = await this.sendViaProvider(provider, { to, subject, html, text });
        console.log(`[EmailTemplateService] Email sent to ${to}:`, result.messageId);
        return result;
    }

    async renderTemplate(slug: string, variables: Record<string, any>, applicationId?: string): Promise<{
        subject: string;
        htmlContent: string;
        textContent?: string;
    } | null> {
        const template = await prisma.emailTemplate.findFirst({
            where: {
                slug,
                isActive: true,
                ...(applicationId ? { OR: [{ applicationId }, { applicationId: null }] } : { applicationId: null }),
            },
            orderBy: { applicationId: 'desc' },
        }) ?? await prisma.emailTemplate.findFirst({
            where: { slug, isActive: true },
            orderBy: { applicationId: 'desc' },
        });
        
        if (!template) return null;

        const render = (content: string): string => {
            let rendered = content;
            for (const [key, value] of Object.entries(variables)) {
                const placeholder = `{{${key}}}`;
                rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
            }
            return rendered;
        };

        return {
            subject: render(template.subject),
            htmlContent: template.htmlContent ? render(template.htmlContent as string) : '',
            textContent: template.textContent ? render(template.textContent as string) : undefined
        };
    }

    private mapRowToTemplate(row: any): EmailTemplate {
        return {
            id: row.id,
            name: row.name,
            subject: row.subject,
            htmlContent: row.htmlContent,
            textContent: row.textContent,
            variables: row.variables || [],
            isActive: row.isActive,
            applicationId: row.applicationId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
        };
    }
}

export const emailTemplateService = new EmailTemplateService();
export default emailTemplateService;
