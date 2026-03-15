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
    private async getEffectiveSmtpConfig(): Promise<{
        host: string;
        port: number;
        secure: boolean;
        user?: string;
        pass?: string;
        from: string;
    }> {
        // Primary: read from default_comm_config (set via Communication Hub UI)
        // Structure: { providers: [{ type: 'smtp', enabled: true, settings: { host, port, username, password, fromEmail, fromName, secure } }] }
        let cfg: Record<string, any> = {};
        const commRow = await prisma.systemConfig.findUnique({ where: { key: 'default_comm_config' } });
        if (commRow?.value) {
            const commCfg = commRow.value as any;
            const smtpProvider = Array.isArray(commCfg.providers)
                ? commCfg.providers.find((p: any) => p.type === 'smtp' && p.enabled !== false)
                : null;
            if (smtpProvider?.settings) {
                cfg = smtpProvider.settings;
            }
        }

        // Legacy fallback: system.smtp key
        if (!cfg.host) {
            const legacyRow = await prisma.systemConfig.findUnique({ where: { key: 'system.smtp' } });
            if (legacyRow?.value) cfg = legacyRow.value as Record<string, any>;
        }

        const host = String(cfg.host || process.env.SMTP_HOST || '');
        const port = Number(cfg.port || process.env.SMTP_PORT || 587);
        const secure = Boolean(cfg.secure ?? (process.env.SMTP_SECURE === 'true'));
        // support both 'username' (UI key) and 'user' (legacy key)
        const user = String(cfg.username || cfg.user || process.env.SMTP_USER || '');
        const pass = String(cfg.password || process.env.SMTP_PASS || '');
        const fromEmail = String(cfg.fromEmail || process.env.SMTP_FROM || 'noreply@example.com');
        const fromName = String(cfg.fromName || 'AppKit');

        return {
            host,
            port,
            secure,
            user: user || undefined,
            pass: pass || undefined,
            from: `${fromName} <${fromEmail}>`,
        };
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

            const smtp = await this.getEffectiveSmtpConfig();
            if (smtp.host) {
                const transporter = nodemailer.createTransport({
                    host: smtp.host,
                    port: smtp.port,
                    secure: smtp.secure,
                    auth: smtp.user ? {
                        user: smtp.user,
                        pass: smtp.pass
                    } : undefined
                });
                
                await transporter.sendMail({
                    from: smtp.from,
                    to,
                    subject,
                    html: renderedContent
                });
                console.log(`Email successfully sent to ${to} via SMTP`);
            } else {
                console.warn('Test Email (SMTP not configured, logging to console):', {
                    to,
                    subject,
                    content: renderedContent
                });
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

        // Find app-specific template first, fall back to platform default
        const template = await prisma.emailTemplate.findFirst({
            where: {
                slug,
                isActive: true,
                ...(applicationId ? { OR: [{ applicationId }, { applicationId: null }] } : { applicationId: null }),
            },
            orderBy: { applicationId: 'desc' }, // app-specific wins
        });

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

        const smtp = await this.getEffectiveSmtpConfig();

        if (!smtp.host) {
            // No SMTP configured — log and return a mock message ID
            console.warn('[EmailTemplateService] SMTP not configured. Email not sent:', { to, subject });
            return { messageId: `no-smtp-${Date.now()}` };
        }

        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
        });

        const result = await transporter.sendMail({
            from: smtp.from,
            to,
            subject,
            html,
            ...(text ? { text } : {}),
        });

        console.log(`[EmailTemplateService] Email sent to ${to}:`, result.messageId);
        return { messageId: result.messageId };
    }

    async renderTemplate(slug: string, variables: Record<string, any>): Promise<{
        subject: string;
        htmlContent: string;
        textContent?: string;
    } | null> {
        // Find template by exact slug in database
        const template = await prisma.emailTemplate.findFirst({
            where: { slug }
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
