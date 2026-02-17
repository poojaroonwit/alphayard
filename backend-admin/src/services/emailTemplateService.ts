/**
 * Email Template Service
 * Manages email templates stored in the database
 */

import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import handlebars from 'handlebars';
import { v4 as uuidv4 } from 'uuid';

// =====================================================
// INTERFACES
// =====================================================

export interface EmailTemplateVariable {
  name: string;
  description: string;
  required: boolean;
  default?: string;
}

export interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: EmailTemplateVariable[];
  sampleData: Record<string, any>;
  isActive: boolean;
  isSystem: boolean;
  version: number;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface EmailTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: EmailTemplateVariable[];
  createdAt: string;
  createdBy?: string;
  changeNote?: string;
}

export interface CreateTemplateInput {
  slug: string;
  name: string;
  description?: string;
  category?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: EmailTemplateVariable[];
  sampleData?: Record<string, any>;
  isActive?: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  variables?: EmailTemplateVariable[];
  sampleData?: Record<string, any>;
  isActive?: boolean;
  changeNote?: string;
}

export interface TemplateListOptions {
  category?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Extract metadata from variables JSON field
 * The variables field stores both variables array and metadata (description, category, etc.)
 */
function extractMetadata(variablesJson: any): {
  variables: EmailTemplateVariable[];
  description?: string;
  category?: string;
  sampleData?: Record<string, any>;
  isSystem?: boolean;
  version?: number;
  createdBy?: string;
  updatedBy?: string;
} {
  if (!variablesJson) {
    return { variables: [] };
  }

  // If it's an array, it's just variables
  if (Array.isArray(variablesJson)) {
    return { variables: variablesJson };
  }

  // If it's an object, extract variables and metadata
  if (typeof variablesJson === 'object') {
    const {
      _variables = [],
      _description,
      _category = 'general',
      _sampleData = {},
      _isSystem = false,
      _version = 1,
      _createdBy,
      _updatedBy,
      ...rest
    } = variablesJson;

    return {
      variables: _variables.length > 0 ? _variables : (Array.isArray(variablesJson) ? variablesJson : []),
      description: _description,
      category: _category,
      sampleData: _sampleData,
      isSystem: _isSystem,
      version: _version,
      createdBy: _createdBy,
      updatedBy: _updatedBy,
    };
  }

  return { variables: [] };
}

/**
 * Build variables JSON with metadata
 */
function buildVariablesJson(
  variables: EmailTemplateVariable[],
  metadata: {
    description?: string;
    category?: string;
    sampleData?: Record<string, any>;
    isSystem?: boolean;
    version?: number;
    createdBy?: string;
    updatedBy?: string;
  }
): any {
  return {
    _variables: variables,
    _description: metadata.description,
    _category: metadata.category || 'general',
    _sampleData: metadata.sampleData || {},
    _isSystem: metadata.isSystem || false,
    _version: metadata.version || 1,
    _createdBy: metadata.createdBy,
    _updatedBy: metadata.updatedBy,
  };
}

function mapPrismaToTemplate(row: any): EmailTemplate {
  const metadata = extractMetadata(row.variables);
  
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: metadata.description,
    category: metadata.category || 'general',
    subject: row.subject,
    htmlContent: row.htmlContent || '',
    textContent: row.textContent || undefined,
    variables: metadata.variables || [],
    sampleData: metadata.sampleData || {},
    isActive: row.isActive,
    isSystem: metadata.isSystem || false,
    version: metadata.version || 1,
    createdAt: row.createdAt.toISOString(),
    createdBy: metadata.createdBy,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: metadata.updatedBy,
  };
}

function mapRowToVersion(row: any): EmailTemplateVersion {
  return {
    id: row.id,
    templateId: row.template_id,
    version: row.version,
    subject: row.subject,
    htmlContent: row.html_content,
    textContent: row.text_content,
    variables: row.variables || [],
    createdAt: row.created_at,
    createdBy: row.created_by,
    changeNote: row.change_note,
  };
}

// Register Handlebars helpers
handlebars.registerHelper('if', function(this: any, conditional: any, options: any) {
  if (conditional) {
    return options.fn(this);
  }
  return options.inverse ? options.inverse(this) : '';
});

// =====================================================
// SERVICE CLASS
// =====================================================

class EmailTemplateService {
  /**
   * Get all templates with optional filtering
   */
  async getTemplates(options: TemplateListOptions = {}): Promise<{ templates: EmailTemplate[]; total: number }> {
    const { category, isActive, search, page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    // For category and search, we need to query the JSON field, so use $queryRaw with Prisma.sql
    if (category || search) {
      const conditions: Prisma.Sql[] = [];

      if (isActive !== undefined) {
        conditions.push(Prisma.sql`is_active = ${isActive}`);
      }

      if (category) {
        conditions.push(Prisma.sql`variables->>'_category' = ${category}`);
      }

      if (search) {
        const searchPattern = `%${search}%`;
        conditions.push(Prisma.sql`(
          name ILIKE ${searchPattern} OR 
          slug ILIKE ${searchPattern} OR 
          variables->>'_description' ILIKE ${searchPattern}
        )`);
      }

      const whereClause = conditions.length > 0 
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.sql``;

      // Get total count
      const countRows = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count 
        FROM core.email_templates 
        ${whereClause}
      `;
      const total = countRows[0]?.count || 0;

      // Get templates
      const result = await prisma.$queryRaw<any[]>`
        SELECT * FROM core.email_templates 
        ${whereClause} 
        ORDER BY variables->>'_category', name 
        LIMIT ${limit} OFFSET ${offset}
      `;

      return {
        templates: result.map(mapPrismaToTemplate),
        total,
      };
    }

    // Simple query without category/search - use Prisma
    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip: offset,
        take: limit,
      }),
      prisma.emailTemplate.count({ where }),
    ]);

    return {
      templates: templates.map(mapPrismaToTemplate),
      total,
    };
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<EmailTemplate | null> {
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return null;
    }

    return mapPrismaToTemplate(template);
  }

  /**
   * Get template by slug
   */
  async getTemplateBySlug(slug: string, applicationId?: string): Promise<EmailTemplate | null> {
    // Use findFirst when applicationId might be null, as findUnique requires all unique fields
    const template = await prisma.emailTemplate.findFirst({
      where: {
        slug,
        applicationId: applicationId || null,
      },
    });

    if (!template) {
      return null;
    }

    return mapPrismaToTemplate(template);
  }

  /**
   * Create a new template
   */
  async createTemplate(input: CreateTemplateInput, userId?: string, applicationId?: string): Promise<EmailTemplate> {
    const {
      slug,
      name,
      description,
      category = 'general',
      subject,
      htmlContent,
      textContent,
      variables = [],
      sampleData = {},
      isActive = true,
    } = input;

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    // Check if slug already exists
    const existing = await this.getTemplateBySlug(slug, applicationId);
    if (existing) {
      throw new Error(`Template with slug "${slug}" already exists`);
    }

    // Build variables JSON with metadata
    const variablesJson = buildVariablesJson(variables, {
      description,
      category,
      sampleData,
      isSystem: false,
      version: 1,
      createdBy: userId,
      updatedBy: userId,
    });

    const template = await prisma.emailTemplate.create({
      data: {
        applicationId: applicationId || null,
        slug,
        name,
        subject,
        htmlContent,
        textContent,
        variables: variablesJson,
        isActive,
      },
    });

    return mapPrismaToTemplate(template);
  }

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, input: UpdateTemplateInput, userId?: string): Promise<EmailTemplate> {
    const template = await this.getTemplateById(id);
    if (!template) {
      throw new Error('Template not found');
    }

    const {
      name,
      description,
      category,
      subject,
      htmlContent,
      textContent,
      variables,
      sampleData,
      isActive,
      changeNote,
    } = input;

    // Note: Version history functionality removed as email_template_versions table doesn't exist in Prisma schema
    // If version history is needed, it should be added to the Prisma schema first

    // Build update data
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
    }
    if (subject !== undefined) {
      updateData.subject = subject;
    }
    if (htmlContent !== undefined) {
      updateData.htmlContent = htmlContent;
    }
    if (textContent !== undefined) {
      updateData.textContent = textContent;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Update variables JSON with new values and metadata
    const currentMetadata = extractMetadata(template.variables);
    const newVariables = variables !== undefined ? variables : currentMetadata.variables;
    const newSampleData = sampleData !== undefined ? sampleData : currentMetadata.sampleData;
    const newCategory = category !== undefined ? category : currentMetadata.category;
    const newDescription = description !== undefined ? description : currentMetadata.description;
    const newVersion = (subject !== undefined || htmlContent !== undefined || textContent !== undefined || variables !== undefined)
      ? (currentMetadata.version || 1) + 1
      : (currentMetadata.version || 1);

    updateData.variables = buildVariablesJson(newVariables, {
      description: newDescription,
      category: newCategory,
      sampleData: newSampleData,
      isSystem: currentMetadata.isSystem,
      version: newVersion,
      createdBy: currentMetadata.createdBy,
      updatedBy: userId,
    });

    const updated = await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
    });

    return mapPrismaToTemplate(updated);
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<boolean> {
    const template = await this.getTemplateById(id);
    if (!template) {
      throw new Error('Template not found');
    }

    const metadata = extractMetadata(template.variables);
    if (metadata.isSystem) {
      throw new Error('System templates cannot be deleted');
    }

    await prisma.emailTemplate.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Save a version snapshot
   * Note: This is a no-op as email_template_versions table doesn't exist in Prisma schema
   */
  private async saveVersion(template: EmailTemplate, userId?: string, changeNote?: string): Promise<void> {
    // Version history functionality removed - table doesn't exist in Prisma schema
    // If version history is needed, add email_template_versions table to Prisma schema first
    return;
  }

  /**
   * Get version history for a template
   * Note: Returns empty array as email_template_versions table doesn't exist in Prisma schema
   */
  async getTemplateVersions(templateId: string): Promise<EmailTemplateVersion[]> {
    // Version history functionality removed - table doesn't exist in Prisma schema
    // If version history is needed, add email_template_versions table to Prisma schema first
    return [];
  }

  /**
   * Restore a specific version
   * Note: This is a no-op as email_template_versions table doesn't exist in Prisma schema
   */
  async restoreVersion(templateId: string, version: number, userId?: string): Promise<EmailTemplate> {
    throw new Error('Version history is not available. email_template_versions table does not exist in the Prisma schema.');
  }

  /**
   * Render a template with data
   */
  async renderTemplate(slug: string, data: Record<string, any>, applicationId?: string): Promise<{ subject: string; html: string; text?: string }> {
    const template = await this.getTemplateBySlug(slug, applicationId);
    if (!template) {
      throw new Error(`Template "${slug}" not found`);
    }

    if (!template.isActive) {
      throw new Error(`Template "${slug}" is not active`);
    }

    // Add default values for missing required variables
    const enrichedData = { ...data };
    for (const variable of template.variables) {
      if (enrichedData[variable.name] === undefined && variable.default) {
        enrichedData[variable.name] = variable.default;
      }
    }

    // Add common defaults
    if (!enrichedData.year) {
      enrichedData.year = new Date().getFullYear().toString();
    }
    if (!enrichedData.appName) {
      enrichedData.appName = 'AppKit';
    }

    // Compile and render templates
    const subjectTemplate = handlebars.compile(template.subject);
    const htmlTemplate = handlebars.compile(template.htmlContent);
    
    const result: { subject: string; html: string; text?: string } = {
      subject: subjectTemplate(enrichedData),
      html: htmlTemplate(enrichedData),
    };

    if (template.textContent) {
      const textTemplate = handlebars.compile(template.textContent);
      result.text = textTemplate(enrichedData);
    }

    return result;
  }

  /**
   * Preview a template with sample data
   */
  async previewTemplate(id: string, customData?: Record<string, any>): Promise<{ subject: string; html: string; text?: string }> {
    const template = await this.getTemplateById(id);
    if (!template) {
      throw new Error('Template not found');
    }

    // Use custom data or sample data
    const data = customData || template.sampleData;

    // Add common defaults
    const enrichedData = { ...data };
    if (!enrichedData.year) {
      enrichedData.year = new Date().getFullYear().toString();
    }
    if (!enrichedData.appName) {
      enrichedData.appName = 'AppKit';
    }

    // Compile and render templates
    const subjectTemplate = handlebars.compile(template.subject);
    const htmlTemplate = handlebars.compile(template.htmlContent);
    
    const result: { subject: string; html: string; text?: string } = {
      subject: subjectTemplate(enrichedData),
      html: htmlTemplate(enrichedData),
    };

    if (template.textContent) {
      const textTemplate = handlebars.compile(template.textContent);
      result.text = textTemplate(enrichedData);
    }

    return result;
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(id: string, newSlug: string, newName: string, userId?: string, applicationId?: string): Promise<EmailTemplate> {
    const template = await this.getTemplateById(id);
    if (!template) {
      throw new Error('Template not found');
    }

    return this.createTemplate({
      slug: newSlug,
      name: newName,
      description: template.description,
      category: template.category,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      variables: template.variables,
      sampleData: template.sampleData,
      isActive: false, // New duplicates are inactive by default
    }, userId, applicationId);
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    // Query distinct categories from the JSON field
    const result = await prisma.$queryRaw<Array<{ category: string }>>`
      SELECT DISTINCT variables->>'_category' as category 
      FROM core.email_templates 
      WHERE variables->>'_category' IS NOT NULL
      ORDER BY category
    `;

    return result.map(row => row.category).filter(Boolean);
  }

  /**
   * Send a test email using a template
   */
  async sendTestEmail(templateId: string, toEmail: string, customData?: Record<string, any>): Promise<boolean> {
    // Import emailService here to avoid circular dependency
    const { emailService } = await import('./emailService');
    
    const rendered = await this.previewTemplate(templateId, customData);
    
    // Use the emailService to send
    return emailService.sendEmail({
      to: toEmail,
      subject: `[TEST] ${rendered.subject}`,
      template: 'raw', // Use raw mode
      data: {
        _rawHtml: rendered.html,
        _rawText: rendered.text,
      },
    });
  }
}

// Export singleton instance
export const emailTemplateService = new EmailTemplateService();
export default emailTemplateService;
