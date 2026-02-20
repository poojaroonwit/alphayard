import { prisma } from '../../lib/prisma';
import { Prisma } from '../../../prisma/generated/prisma/client';

export interface Hashtag {
  id: string;
  tag: string;
  usageCount: number;
  lastUsedAt: Date;
  isTrending: boolean;
  isBlocked: boolean;
  createdAt: Date;
}

export interface Mention {
  id: string;
  postId?: string;
  commentId?: string;
  mentionedUserId: string;
  mentionerId: string;
  mentionText: string;
  isRead: boolean;
  createdAt: Date;
  mentioner?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export class HashtagsService {
  
  // Extract hashtags from text
  extractHashtags(text: string): string[] {
    const regex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(regex);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
  }

  // Extract mentions from text
  extractMentions(text: string): string[] {
    const regex = /@([a-zA-Z0-9_]+)/g;
    const matches = text.match(regex);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
  }

  async processHashtags(postId: string, text: string): Promise<Hashtag[]> {
    const tags = this.extractHashtags(text);
    const hashtags: Hashtag[] = [];
    
    for (const tag of tags) {
      // Insert or update hashtag
      const result = await prisma.$queryRaw<any[]>`
        INSERT INTO bondarys.social_hashtags (tag, usage_count, last_used_at)
        VALUES (${tag}, 1, NOW())
        ON CONFLICT (tag) 
        DO UPDATE SET usage_count = bondarys.social_hashtags.usage_count + 1, last_used_at = NOW()
        RETURNING *
      `;
      
      const hashtag = result[0];
      
      // Link to post
      await prisma.$executeRaw`
        INSERT INTO bondarys.social_post_hashtags (post_id, hashtag_id)
        VALUES (${postId}::uuid, ${hashtag.id}::uuid)
        ON CONFLICT (post_id, hashtag_id) DO NOTHING
      `;
      
      hashtags.push(this.mapHashtag(hashtag));
    }
    
    return hashtags;
  }

  async processMentions(postId: string | null, commentId: string | null, mentionerId: string, text: string): Promise<Mention[]> {
    const usernames = this.extractMentions(text);
    const mentions: Mention[] = [];
    
    for (const username of usernames) {
      // Find user by username
      const userResult = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM core.users WHERE LOWER(username) = ${username.toLowerCase()}
      `;
      
      if (userResult.length === 0) continue;
      
      const mentionedUserId = userResult[0].id;
      
      // Don't create mention for self
      if (mentionedUserId === mentionerId) continue;
      
      // Insert mention
      const result = await prisma.$queryRaw<any[]>`
        INSERT INTO bondarys.social_mentions (post_id, comment_id, mentioned_user_id, mentioner_id, mention_text)
        VALUES (${postId}::uuid, ${commentId}::uuid, ${mentionedUserId}::uuid, ${mentionerId}::uuid, ${`@${username}`})
        RETURNING *
      `;
      
      mentions.push(this.mapMention(result[0]));
    }
    
    return mentions;
  }

  async getTrendingHashtags(limit = 20): Promise<Hashtag[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.social_hashtags 
      WHERE is_blocked = false
        AND last_used_at > NOW() - INTERVAL '7 days'
      ORDER BY usage_count DESC, last_used_at DESC
      LIMIT ${limit}
    `;
    
    return result.map(this.mapHashtag);
  }

  async searchHashtags(query: string, limit = 20): Promise<Hashtag[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.social_hashtags 
      WHERE tag ILIKE ${`${query}%`} AND is_blocked = false
      ORDER BY usage_count DESC
      LIMIT ${limit}
    `;
    
    return result.map(this.mapHashtag);
  }

  async getHashtagPosts(tag: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    const { limit = 50, offset = 0 } = options;
    
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        e.id, e.attributes, e.created_at,
        u.id as author_id, u.username as author_username,
        u.display_name as author_display_name, u.avatar_url as author_avatar_url,
        u.is_verified as author_is_verified
      FROM bondarys.social_post_hashtags ph
      JOIN bondarys.social_hashtags h ON ph.hashtag_id = h.id
      JOIN bondarys.entities e ON ph.post_id = e.id
      LEFT JOIN core.users u ON e.owner_id = u.id
      WHERE LOWER(h.tag) = ${tag.toLowerCase()} AND h.is_blocked = false
      ORDER BY e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return result.map(row => ({
      id: row.id,
      ...row.attributes,
      createdAt: row.created_at,
      author: row.author_id ? {
        id: row.author_id,
        username: row.author_username,
        displayName: row.author_display_name,
        avatarUrl: row.author_avatar_url,
        isVerified: row.author_is_verified,
      } : null,
    }));
  }

  async getUnreadMentions(userId: string, limit = 50): Promise<Mention[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        m.*,
        u.id as mentioner_id, u.username as mentioner_username,
        u.display_name as mentioner_display_name, u.avatar_url as mentioner_avatar_url
      FROM bondarys.social_mentions m
      JOIN core.users u ON m.mentioner_id = u.id
      WHERE m.mentioned_user_id = ${userId}::uuid AND m.is_read = false
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `;
    
    return result.map(this.mapMentionWithUser);
  }

  async getAllMentions(userId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Mention[]> {
    const { limit = 50, offset = 0 } = options;
    
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        m.*,
        u.id as mentioner_id, u.username as mentioner_username,
        u.display_name as mentioner_display_name, u.avatar_url as mentioner_avatar_url
      FROM bondarys.social_mentions m
      JOIN core.users u ON m.mentioner_id = u.id
      WHERE m.mentioned_user_id = ${userId}::uuid
      ORDER BY m.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return result.map(this.mapMentionWithUser);
  }

  async markMentionAsRead(mentionId: string, userId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.social_mentions 
      SET is_read = true
      WHERE id = ${mentionId}::uuid AND mentioned_user_id = ${userId}::uuid
    `;
    
    return (result as number) > 0;
  }

  async markAllMentionsAsRead(userId: string): Promise<number> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.social_mentions 
      SET is_read = true
      WHERE mentioned_user_id = ${userId}::uuid AND is_read = false
    `;
    
    return result as number;
  }

  async getUnreadMentionsCount(userId: string): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count 
      FROM bondarys.social_mentions 
      WHERE mentioned_user_id = ${userId}::uuid AND is_read = false
    `;
    
    return Number(result[0].count);
  }

  // Update trending status based on usage
  async updateTrendingStatus(): Promise<void> {
    // Reset all trending
    await prisma.$executeRaw`UPDATE bondarys.social_hashtags SET is_trending = false`;
    
    // Set top 20 as trending
    await prisma.$executeRaw`
      UPDATE bondarys.social_hashtags 
      SET is_trending = true
      WHERE id IN (
        SELECT id FROM bondarys.social_hashtags 
        WHERE is_blocked = false 
          AND last_used_at > NOW() - INTERVAL '24 hours'
        ORDER BY usage_count DESC
        LIMIT 20
      )
    `;
  }

  // Admin: Block/unblock hashtag
  async blockHashtag(tag: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.social_hashtags 
      SET is_blocked = true
      WHERE LOWER(tag) = ${tag.toLowerCase()}
    `;
    
    return (result as number) > 0;
  }

  async unblockHashtag(tag: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.social_hashtags 
      SET is_blocked = false
      WHERE LOWER(tag) = ${tag.toLowerCase()}
    `;
    
    return (result as number) > 0;
  }

  private mapHashtag(row: any): Hashtag {
    return {
      id: row.id,
      tag: row.tag,
      usageCount: row.usage_count,
      lastUsedAt: row.last_used_at,
      isTrending: row.is_trending,
      isBlocked: row.is_blocked,
      createdAt: row.created_at,
    };
  }

  private mapMention(row: any): Mention {
    return {
      id: row.id,
      postId: row.post_id,
      commentId: row.comment_id,
      mentionedUserId: row.mentioned_user_id,
      mentionerId: row.mentioner_id,
      mentionText: row.mention_text,
      isRead: row.is_read,
      createdAt: row.created_at,
    };
  }

  private mapMentionWithUser(row: any): Mention {
    return {
      id: row.id,
      postId: row.post_id,
      commentId: row.comment_id,
      mentionedUserId: row.mentioned_user_id,
      mentionerId: row.mentioner_id,
      mentionText: row.mention_text,
      isRead: row.is_read,
      createdAt: row.created_at,
      mentioner: {
        id: row.mentioner_id,
        username: row.mentioner_username,
        displayName: row.mentioner_display_name,
        avatarUrl: row.mentioner_avatar_url,
      },
    };
  }
}

export const hashtagsService = new HashtagsService();
export default hashtagsService;
