import { prisma } from '../../lib/prisma';

export interface QuickReply {
  id: string;
  userId: string;
  shortcut: string;
  title: string;
  content: string;
  attachments: any[];
  useCount: number;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TemplatesService {
  // Create a quick reply template
  async createTemplate(
    userId: string,
    shortcut: string,
    title: string,
    content: string,
    attachments: any[] = []
  ): Promise<QuickReply> {
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_quick_replies (user_id, shortcut, title, content, attachments)
      VALUES (${userId}::uuid, ${shortcut}, ${title}, ${content}, ${JSON.stringify(attachments)}::jsonb)
      RETURNING *
    `;
    return this.mapQuickReply(result[0]);
  }

  // Update a template
  async updateTemplate(
    id: string,
    userId: string,
    updates: { shortcut?: string; title?: string; content?: string; attachments?: any[] }
  ): Promise<QuickReply | null> {
    const setClause: string[] = ['updated_at = NOW()'];
    const insertCols: string[] = [];
    const insertVals: string[] = [];

    if (updates.shortcut !== undefined) {
      setClause.push(`shortcut = '${updates.shortcut.replace(/'/g, "''")}'`);
      insertCols.push('shortcut');
      insertVals.push(`'${updates.shortcut.replace(/'/g, "''")}'`);
    }
    if (updates.title !== undefined) {
      setClause.push(`title = '${updates.title.replace(/'/g, "''")}'`);
      insertCols.push('title');
      insertVals.push(`'${updates.title.replace(/'/g, "''")}'`);
    }
    if (updates.content !== undefined) {
      setClause.push(`content = '${updates.content.replace(/'/g, "''")}'`);
      insertCols.push('content');
      insertVals.push(`'${updates.content.replace(/'/g, "''")}'`);
    }
    if (updates.attachments !== undefined) {
      setClause.push(`attachments = '${JSON.stringify(updates.attachments).replace(/'/g, "''")}'::jsonb`);
      insertCols.push('attachments');
      insertVals.push(`'${JSON.stringify(updates.attachments).replace(/'/g, "''")}'::jsonb`);
    }

    const insertColsStr = insertCols.length > 0 ? `, ${insertCols.join(', ')}` : '';
    const insertValsStr = insertVals.length > 0 ? `, ${insertVals.join(', ')}` : '';

    const result = await prisma.$queryRawUnsafe<any[]>(`
      UPDATE bondarys.chat_quick_replies 
      SET ${setClause.join(', ')}
      WHERE id = '${id}'::uuid AND user_id = '${userId}'::uuid AND is_global = FALSE
      RETURNING *
    `);

    return result[0] ? this.mapQuickReply(result[0]) : null;
  }

  // Delete a template
  async deleteTemplate(id: string, userId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.chat_quick_replies 
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid AND is_global = FALSE
    `;
    return (result ?? 0) > 0;
  }

  // Get user's templates
  async getTemplates(userId: string): Promise<QuickReply[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_quick_replies 
      WHERE user_id = ${userId}::uuid OR is_global = TRUE
      ORDER BY use_count DESC, title
    `;
    return result.map(row => this.mapQuickReply(row));
  }

  // Search templates by shortcut or content
  async searchTemplates(userId: string, query: string): Promise<QuickReply[]> {
    const searchPattern = `%${query}%`;
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_quick_replies 
      WHERE (user_id = ${userId}::uuid OR is_global = TRUE)
        AND (shortcut ILIKE ${searchPattern} OR title ILIKE ${searchPattern} OR content ILIKE ${searchPattern})
      ORDER BY use_count DESC
      LIMIT 10
    `;
    return result.map(row => this.mapQuickReply(row));
  }

  // Find template by shortcut
  async findByShortcut(userId: string, shortcut: string): Promise<QuickReply | null> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_quick_replies 
      WHERE (user_id = ${userId}::uuid OR is_global = TRUE) AND shortcut = ${shortcut}
      LIMIT 1
    `;
    return result[0] ? this.mapQuickReply(result[0]) : null;
  }

  // Use a template (increment counter)
  async useTemplate(id: string, userId: string): Promise<QuickReply | null> {
    const result = await prisma.$queryRaw<any[]>`
      UPDATE bondarys.chat_quick_replies 
      SET use_count = use_count + 1, updated_at = NOW()
      WHERE id = ${id}::uuid AND (user_id = ${userId}::uuid OR is_global = TRUE)
      RETURNING *
    `;
    return result[0] ? this.mapQuickReply(result[0]) : null;
  }

  // Get most used templates
  async getMostUsed(userId: string, limit: number = 5): Promise<QuickReply[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_quick_replies 
      WHERE (user_id = ${userId}::uuid OR is_global = TRUE) AND use_count > 0
      ORDER BY use_count DESC
      LIMIT ${limit}
    `;
    return result.map(row => this.mapQuickReply(row));
  }

  // Process message for shortcut expansion
  async expandShortcuts(userId: string, text: string): Promise<string> {
    // Find shortcuts in text (e.g., /thanks, /brb)
    const shortcutRegex = /\/([a-zA-Z0-9_]+)/g;
    const matches = text.match(shortcutRegex);

    if (!matches) return text;

    let expandedText = text;

    for (const match of matches) {
      const shortcut = match; // includes the /
      const template = await this.findByShortcut(userId, shortcut);

      if (template) {
        expandedText = expandedText.replace(match, template.content);
        await this.useTemplate(template.id, userId);
      }
    }

    return expandedText;
  }

  // Create global template (admin only)
  async createGlobalTemplate(
    adminId: string,
    shortcut: string,
    title: string,
    content: string
  ): Promise<QuickReply> {
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_quick_replies (user_id, shortcut, title, content, is_global)
      VALUES (${adminId}::uuid, ${shortcut}, ${title}, ${content}, TRUE)
      RETURNING *
    `;
    return this.mapQuickReply(result[0]);
  }

  // Get suggested shortcuts for new users
  getSuggestedShortcuts(): Array<{ shortcut: string; title: string; content: string }> {
    return [
      { shortcut: '/thanks', title: 'Thank You', content: 'Thank you so much! 🙏' },
      { shortcut: '/brb', title: 'Be Right Back', content: "I'll be right back!" },
      { shortcut: '/omw', title: 'On My Way', content: 'On my way! 🏃' },
      { shortcut: '/ok', title: 'OK', content: 'OK, sounds good! 👍' },
      { shortcut: '/np', title: 'No Problem', content: 'No problem at all!' },
      { shortcut: '/gtg', title: 'Got To Go', content: 'Got to go now. Talk later! 👋' },
      { shortcut: '/busy', title: 'Busy', content: "I'm busy right now, will get back to you soon." },
      { shortcut: '/call', title: 'Call Me', content: 'Can you give me a call when you get a chance? 📞' },
    ];
  }

  private mapQuickReply(row: any): QuickReply {
    return {
      id: row.id,
      userId: row.user_id,
      shortcut: row.shortcut,
      title: row.title,
      content: row.content,
      attachments: row.attachments || [],
      useCount: row.use_count || 0,
      isGlobal: row.is_global,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const templatesService = new TemplatesService();
