import { prisma } from '../lib/prisma';

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
    async createTemplate(data: CreateEmailTemplateData): Promise<EmailTemplate> {
        const result = await prisma.$queryRaw<any[]>`
            INSERT INTO email_templates (
                id, name, subject, html_content, text_content, variables, 
                is_active, application_id, created_at, updated_at
            )
            VALUES (
                gen_random_uuid()::uuid,
                ${data.name},
                ${data.subject},
                ${data.htmlContent},
                ${data.textContent || null},
                ${JSON.stringify(data.variables || [])}::jsonb,
                ${data.isActive !== undefined ? data.isActive : true},
                ${data.applicationId || null}::uuid,
                NOW(),
                NOW()
            )
            RETURNING *
        `;

        return this.mapRowToTemplate(result[0]);
    }

    async getTemplate(id: string): Promise<EmailTemplate | null> {
        const result = await prisma.$queryRaw<any[]>`
            SELECT * FROM email_templates WHERE id = ${id}::uuid
        `;

        if (!result[0]) return null;
        return this.mapRowToTemplate(result[0]);
    }

    async getTemplateByName(name: string, applicationId?: string): Promise<EmailTemplate | null> {
        let query = `
            SELECT * FROM email_templates 
            WHERE name = ${name}
        `;

        if (applicationId) {
            query += ` AND (application_id = ${applicationId}::uuid OR application_id IS NULL)`;
        }

        query += ` ORDER BY application_id DESC NULLS LAST LIMIT 1`;

        const result = await prisma.$queryRawUnsafe<any[]>(query);
        if (!result[0]) return null;
        return this.mapRowToTemplate(result[0]);
    }

    async updateTemplate(id: string, data: UpdateEmailTemplateData): Promise<EmailTemplate | null> {
        const updates: string[] = [];
        const params: any[] = [];

        if (data.subject !== undefined) {
            updates.push(`subject = $${params.length + 1}`);
            params.push(data.subject);
        }
        if (data.htmlContent !== undefined) {
            updates.push(`html_content = $${params.length + 1}`);
            params.push(data.htmlContent);
        }
        if (data.textContent !== undefined) {
            updates.push(`text_content = $${params.length + 1}`);
            params.push(data.textContent);
        }
        if (data.variables !== undefined) {
            updates.push(`variables = $${params.length + 1}::jsonb`);
            params.push(JSON.stringify(data.variables));
        }
        if (data.isActive !== undefined) {
            updates.push(`is_active = $${params.length + 1}`);
            params.push(data.isActive);
        }

        if (updates.length === 0) {
            return this.getTemplate(id);
        }

        updates.push(`updated_at = NOW()`);

        const query = `
            UPDATE email_templates 
            SET ${updates.join(', ')}
            WHERE id = $${params.length + 1}::uuid
            RETURNING *
        `;
        params.push(id);

        const result = await prisma.$queryRawUnsafe<any[]>(query, ...params);
        if (!result[0]) return null;
        return this.mapRowToTemplate(result[0]);
    }

    async deleteTemplate(id: string): Promise<boolean> {
        const result = await prisma.$executeRaw`
            DELETE FROM email_templates WHERE id = ${id}::uuid
        `;
        return result > 0;
    }

    async listTemplates(applicationId?: string, page: number = 1, limit: number = 20): Promise<{
        templates: EmailTemplate[];
        total: number;
        page: number;
        limit: number;
    }> {
        let whereClause = '1=1';
        const params: any[] = [];

        if (applicationId) {
            whereClause += ` AND (application_id = $${params.length + 1}::uuid OR application_id IS NULL)`;
            params.push(applicationId);
        }

        const offset = (page - 1) * limit;

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total FROM email_templates WHERE ${whereClause}
        `;
        const countResult = await prisma.$queryRawUnsafe<any[]>(countQuery, ...params);
        const total = parseInt(countResult[0].total, 10);

        // Get templates
        const query = `
            SELECT * FROM email_templates 
            WHERE ${whereClause}
            ORDER BY created_at DESC 
            LIMIT ${limit} OFFSET ${offset}
        `;
        const rows = await prisma.$queryRawUnsafe<any[]>(query, ...params);

        return {
            templates: rows.map(this.mapRowToTemplate),
            total,
            page,
            limit
        };
    }

    async getCategories(): Promise<string[]> {
        // Mock implementation - return common email categories
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
        // Mock implementation - return empty array for now
        return [];
    }

    async restoreVersion(id: string, versionId: number, userId?: string): Promise<EmailTemplate | null> {
        // Mock implementation - just return the current template
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
            
            // Mock implementation - just log the email
            console.log('Test Email:', {
                to,
                subject: template.subject,
                content: renderedContent
            });

            return true;
        } catch (error) {
            console.error('Failed to send test email:', error);
            return false;
        }
    }

    async renderTemplate(slug: string, variables: Record<string, any>): Promise<{
        subject: string;
        htmlContent: string;
        textContent?: string;
    } | null> {
        // Find template by slug (for now, we'll use the first template as mock)
        const templates = await this.listTemplates();
        const template = templates.templates.find(t => t.name.toLowerCase().includes(slug.toLowerCase()));
        
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
            htmlContent: render(template.htmlContent),
            textContent: template.textContent ? render(template.textContent) : undefined
        };
    }

    private mapRowToTemplate(row: any): EmailTemplate {
        return {
            id: row.id,
            name: row.name,
            subject: row.subject,
            htmlContent: row.html_content,
            textContent: row.text_content,
            variables: row.variables || [],
            isActive: row.is_active,
            applicationId: row.application_id,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
}

export const emailTemplateService = new EmailTemplateService();
export default emailTemplateService;
