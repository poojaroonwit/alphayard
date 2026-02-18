import { prisma } from '../lib/prisma';

export interface LegalDocument {
  id: string;
  type: string;
  slug: string;
  title: string;
  content: string;
  contentFormat: string;
  summary?: string;
  version: string;
  versionDate: Date;
  effectiveDate: Date;
  lastUpdated: Date;
  language: string;
  country?: string;
  status: string;
  isRequiredAcceptance: boolean;
  requiresReacceptance: boolean;
  displayOrder: number;
  showInApp: boolean;
  showInFooter: boolean;
  sections?: LegalSection[];
}

export interface LegalSection {
  id: string;
  documentId: string;
  sectionNumber?: string;
  title: string;
  content: string;
  contentFormat: string;
  sortOrder: number;
  parentSectionId?: string;
  isImportant: boolean;
  highlightColor?: string;
}

export interface UserAcceptance {
  id: string;
  userId: string;
  documentId: string;
  acceptedAt: Date;
  acceptedVersion: string;
  acceptedFrom: string;
  isCurrent: boolean;
}

export interface DeveloperDoc {
  id: string;
  category: string;
  slug: string;
  title: string;
  content: string;
  contentFormat: string;
  excerpt?: string;
  parentId?: string;
  sortOrder: number;
  tags?: string[];
  difficultyLevel?: string;
  estimatedReadTime?: number;
  status: string;
  isFeatured: boolean;
  version: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

class LegalContentService {
  // =====================================================
  // LEGAL DOCUMENTS
  // =====================================================

  async getPublishedDocuments(language: string = 'en'): Promise<LegalDocument[]> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM legal_documents 
      WHERE status = 'published' 
      AND language = $1
      ORDER BY display_order, type
    `, [language]);

    return result.map((row: any) => this.mapDocument(row));
  }

  async getDocumentBySlug(slug: string): Promise<LegalDocument | null> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM legal_documents 
      WHERE slug = $1 
      AND status = 'published'
    `, [slug]);

    if (result.length === 0) return null;

    const doc = this.mapDocument(result[0]);
    
    // Get sections
    const sectionsResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM legal_document_sections 
      WHERE document_id = $1 
      ORDER BY sort_order
    `, [doc.id]);
    
    doc.sections = sectionsResult.map((row: any) => this.mapSection(row));
    
    return doc;
  }

  async getDocumentByType(type: string, language: string = 'en'): Promise<LegalDocument | null> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM legal_documents 
      WHERE type = $1 
      AND language = $2
      AND status = 'published'
      ORDER BY version_date DESC
      LIMIT 1
    `, [type, language]);

    if (result.length === 0) return null;

    return this.mapDocument(result[0]);
  }

  async getAllDocuments(): Promise<LegalDocument[]> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM legal_documents 
      ORDER BY type, language, version_date DESC
    `);

    return result.map((row: any) => this.mapDocument(row));
  }

  async createDocument(doc: Partial<LegalDocument>, createdBy?: string): Promise<LegalDocument> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO legal_documents (
        type, slug, title, content, content_format, summary, version,
        effective_date, language, country, status, is_required_acceptance,
        requires_reacceptance, display_order, show_in_app, show_in_footer,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      doc.type,
      doc.slug,
      doc.title,
      doc.content,
      doc.contentFormat || 'markdown',
      doc.summary,
      doc.version || '1.0',
      doc.effectiveDate || new Date(),
      doc.language || 'en',
      doc.country,
      doc.status || 'draft',
      doc.isRequiredAcceptance || false,
      doc.requiresReacceptance || false,
      doc.displayOrder || 0,
      doc.showInApp !== false,
      doc.showInFooter !== false,
      createdBy
    ]);

    return this.mapDocument(result[0]);
  }

  async updateDocument(id: string, updates: Partial<LegalDocument>, updatedBy?: string): Promise<LegalDocument | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push(`content = $${paramIndex++}`);
      values.push(updates.content);
    }
    if (updates.contentFormat !== undefined) {
      fields.push(`content_format = $${paramIndex++}`);
      values.push(updates.contentFormat);
    }
    if (updates.summary !== undefined) {
      fields.push(`summary = $${paramIndex++}`);
      values.push(updates.summary);
    }
    if (updates.version !== undefined) {
      fields.push(`version = $${paramIndex++}`);
      values.push(updates.version);
    }
    if (updates.effectiveDate !== undefined) {
      fields.push(`effective_date = $${paramIndex++}`);
      values.push(updates.effectiveDate);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.isRequiredAcceptance !== undefined) {
      fields.push(`is_required_acceptance = $${paramIndex++}`);
      values.push(updates.isRequiredAcceptance);
    }
    if (updates.requiresReacceptance !== undefined) {
      fields.push(`requires_reacceptance = $${paramIndex++}`);
      values.push(updates.requiresReacceptance);
    }
    if (updates.displayOrder !== undefined) {
      fields.push(`display_order = $${paramIndex++}`);
      values.push(updates.displayOrder);
    }
    if (updates.showInApp !== undefined) {
      fields.push(`show_in_app = $${paramIndex++}`);
      values.push(updates.showInApp);
    }
    if (updates.showInFooter !== undefined) {
      fields.push(`show_in_footer = $${paramIndex++}`);
      values.push(updates.showInFooter);
    }

    if (fields.length === 0) return null;

    fields.push(`last_updated = NOW()`);
    if (updatedBy) {
      fields.push(`updated_by = $${paramIndex++}`);
      values.push(updatedBy);
    }

    values.push(id);

    const result = await prisma.$queryRawUnsafe<any[]>(`
      UPDATE legal_documents 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.length === 0) return null;
    return this.mapDocument(result[0]);
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      DELETE FROM legal_documents WHERE id = $1
    `, [id]);
    return (result.length ?? 0) > 0;
  }

  async publishDocument(id: string): Promise<LegalDocument | null> {
    return this.updateDocument(id, { status: 'published' });
  }

  async archiveDocument(id: string): Promise<LegalDocument | null> {
    return this.updateDocument(id, { status: 'archived' });
  }

  // =====================================================
  // USER ACCEPTANCES
  // =====================================================

  async getUserAcceptances(userId: string): Promise<UserAcceptance[]> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT ua.*, ld.type, ld.title, ld.slug
      FROM user_legal_acceptances ua
      JOIN legal_documents ld ON ld.id = ua.document_id
      WHERE ua.user_id = $1 AND ua.is_current = TRUE
      ORDER BY ua.accepted_at DESC
    `, [userId]);

    return result.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      documentId: row.document_id,
      documentType: row.type,
      documentTitle: row.title,
      documentSlug: row.slug,
      acceptedAt: row.accepted_at,
      acceptedVersion: row.accepted_version,
      acceptedFrom: row.accepted_from,
      isCurrent: row.is_current
    }));
  }

  async acceptDocument(
    userId: string, 
    documentId: string, 
    version: string,
    acceptedFrom: string = 'app',
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserAcceptance> {
    // Mark previous acceptances as not current
    await prisma.$queryRawUnsafe<any[]>(`
      UPDATE user_legal_acceptances 
      SET is_current = FALSE 
      WHERE user_id = $1 AND document_id = $2
    `, [userId, documentId]);

    // Create new acceptance
    const result = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO user_legal_acceptances (
        user_id, document_id, accepted_version, accepted_from,
        ip_address, user_agent, is_current
      ) VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      RETURNING *
    `, [userId, documentId, version, acceptedFrom, ipAddress, userAgent]);

    return {
      id: result[0].id,
      userId: result[0].user_id,
      documentId: result[0].document_id,
      acceptedAt: result[0].accepted_at,
      acceptedVersion: result[0].accepted_version,
      acceptedFrom: result[0].accepted_from,
      isCurrent: result[0].is_current
    };
  }

  async checkUserAcceptance(userId: string, documentType: string): Promise<boolean> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT ua.id 
      FROM user_legal_acceptances ua
      JOIN legal_documents ld ON ld.id = ua.document_id
      WHERE ua.user_id = $1 
      AND ld.type = $2 
      AND ua.is_current = TRUE
      AND ua.accepted_version = ld.version
    `, [userId, documentType]);

    return result.length > 0;
  }

  async getPendingAcceptances(userId: string): Promise<LegalDocument[]> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT ld.* 
      FROM legal_documents ld
      WHERE ld.status = 'published'
      AND ld.is_required_acceptance = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM user_legal_acceptances ua
        WHERE ua.user_id = $1
        AND ua.document_id = ld.id
        AND ua.is_current = TRUE
        AND (
          NOT ld.requires_reacceptance 
          OR ua.accepted_version = ld.version
        )
      )
    `, [userId]);

    return result.map((row: any) => this.mapDocument(row));
  }

  // =====================================================
  // DEVELOPER DOCUMENTATION
  // =====================================================

  async getPublishedDeveloperDocs(): Promise<DeveloperDoc[]> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM developer_documentation 
      WHERE status = 'published'
      ORDER BY sort_order, title
    `);

    return result.map((row: any) => this.mapDeveloperDoc(row));
  }

  async getDeveloperDocBySlug(slug: string): Promise<DeveloperDoc | null> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM developer_documentation 
      WHERE slug = $1
    `, [slug]);

    if (result.length === 0) return null;

    // Increment view count
    await prisma.$queryRawUnsafe<any[]>(`
      UPDATE developer_documentation 
      SET view_count = view_count + 1 
      WHERE slug = $1
    `, [slug]);

    return this.mapDeveloperDoc(result[0]);
  }

  async getDeveloperDocsByCategory(category: string): Promise<DeveloperDoc[]> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM developer_documentation 
      WHERE category = $1 AND status = 'published'
      ORDER BY sort_order, title
    `, [category]);

    return result.map((row: any) => this.mapDeveloperDoc(row));
  }

  async getAllDeveloperDocs(): Promise<DeveloperDoc[]> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM developer_documentation 
      ORDER BY category, sort_order, title
    `);

    return result.map((row: any) => this.mapDeveloperDoc(row));
  }

  async createDeveloperDoc(doc: Partial<DeveloperDoc>, createdBy?: string): Promise<DeveloperDoc> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO developer_documentation (
        category, slug, title, content, content_format, excerpt,
        parent_id, sort_order, tags, difficulty_level, estimated_read_time,
        status, is_featured, version, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      doc.category,
      doc.slug,
      doc.title,
      doc.content,
      doc.contentFormat || 'markdown',
      doc.excerpt,
      doc.parentId,
      doc.sortOrder || 0,
      doc.tags || [],
      doc.difficultyLevel,
      doc.estimatedReadTime,
      doc.status || 'draft',
      doc.isFeatured || false,
      doc.version || '1.0',
      createdBy
    ]);

    return this.mapDeveloperDoc(result[0]);
  }

  async updateDeveloperDoc(id: string, updates: Partial<DeveloperDoc>, updatedBy?: string): Promise<DeveloperDoc | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMappings: Record<string, string> = {
      category: 'category',
      title: 'title',
      content: 'content',
      contentFormat: 'content_format',
      excerpt: 'excerpt',
      parentId: 'parent_id',
      sortOrder: 'sort_order',
      tags: 'tags',
      difficultyLevel: 'difficulty_level',
      estimatedReadTime: 'estimated_read_time',
      status: 'status',
      isFeatured: 'is_featured',
      version: 'version'
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      if ((updates as any)[key] !== undefined) {
        fields.push(`${column} = $${paramIndex++}`);
        values.push((updates as any)[key]);
      }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    if (updatedBy) {
      fields.push(`updated_by = $${paramIndex++}`);
      values.push(updatedBy);
    }

    values.push(id);

    const result = await prisma.$queryRawUnsafe<any[]>(`
      UPDATE developer_documentation 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.length === 0) return null;
    return this.mapDeveloperDoc(result[0]);
  }

  async deleteDeveloperDoc(id: string): Promise<boolean> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      DELETE FROM developer_documentation WHERE id = $1
    `, [id]);
    return (result.length ?? 0) > 0;
  }

  async submitDocFeedback(documentId: string, isHelpful: boolean, feedbackText?: string, userId?: string): Promise<void> {
    await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO developer_doc_feedback (document_id, user_id, is_helpful, feedback_text)
      VALUES ($1, $2, $3, $4)
    `, [documentId, userId, isHelpful, feedbackText]);

    // Update counts
    if (isHelpful) {
      await prisma.$queryRawUnsafe<any[]>(`
        UPDATE developer_documentation 
        SET helpful_count = helpful_count + 1 
        WHERE id = $1
      `, [documentId]);
    } else {
      await prisma.$queryRawUnsafe<any[]>(`
        UPDATE developer_documentation 
        SET not_helpful_count = not_helpful_count + 1 
        WHERE id = $1
      `, [documentId]);
    }
  }

  // =====================================================
  // MAPPERS
  // =====================================================

  private mapDocument(row: any): LegalDocument {
    return {
      id: row.id,
      type: row.type,
      slug: row.slug,
      title: row.title,
      content: row.content,
      contentFormat: row.content_format,
      summary: row.summary,
      version: row.version,
      versionDate: row.version_date,
      effectiveDate: row.effective_date,
      lastUpdated: row.last_updated,
      language: row.language,
      country: row.country,
      status: row.status,
      isRequiredAcceptance: row.is_required_acceptance,
      requiresReacceptance: row.requires_reacceptance,
      displayOrder: row.display_order,
      showInApp: row.show_in_app,
      showInFooter: row.show_in_footer
    };
  }

  private mapSection(row: any): LegalSection {
    return {
      id: row.id,
      documentId: row.document_id,
      sectionNumber: row.section_number,
      title: row.title,
      content: row.content,
      contentFormat: row.content_format,
      sortOrder: row.sort_order,
      parentSectionId: row.parent_section_id,
      isImportant: row.is_important,
      highlightColor: row.highlight_color
    };
  }

  private mapDeveloperDoc(row: any): DeveloperDoc {
    return {
      id: row.id,
      category: row.category,
      slug: row.slug,
      title: row.title,
      content: row.content,
      contentFormat: row.content_format,
      excerpt: row.excerpt,
      parentId: row.parent_id,
      sortOrder: row.sort_order,
      tags: row.tags,
      difficultyLevel: row.difficulty_level,
      estimatedReadTime: row.estimated_read_time,
      status: row.status,
      isFeatured: row.is_featured,
      version: row.version,
      viewCount: row.view_count,
      helpfulCount: row.helpful_count,
      notHelpfulCount: row.not_helpful_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const legalContentService = new LegalContentService();
export default legalContentService;
