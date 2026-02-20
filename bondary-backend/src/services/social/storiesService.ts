import { prisma } from '../../lib/prisma';
import { Prisma } from '../../../prisma/generated/prisma/client';

export interface CreateStoryInput {
  authorId: string;
  circleId?: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'text';
  backgroundColor?: string;
  textColor?: string;
  fontStyle?: string;
  duration?: number;
  visibility?: 'public' | 'circle' | 'close_friends' | 'private';
}

export interface Story {
  id: string;
  authorId: string;
  circleId?: string;
  content?: string;
  mediaUrl?: string;
  mediaType: string;
  backgroundColor?: string;
  textColor?: string;
  fontStyle?: string;
  duration: number;
  visibility: string;
  viewsCount: number;
  reactionsCount: number;
  isArchived: boolean;
  expiresAt: Date;
  createdAt: Date;
  author?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  hasViewed?: boolean;
  myReaction?: string;
}

export class StoriesService {
  
  async createStory(input: CreateStoryInput): Promise<Story> {
    const { 
      authorId, circleId, content, mediaUrl, mediaType = 'image',
      backgroundColor, textColor, fontStyle, duration = 5, visibility = 'circle'
    } = input;
    
    // Calculate expires_at (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.social_stories (
        author_id, circle_id, content, media_url, media_type,
        background_color, text_color, font_style, duration, visibility, expires_at
      ) VALUES (
        ${authorId}::uuid, ${circleId}::uuid, ${content}, ${mediaUrl}, ${mediaType},
        ${backgroundColor}, ${textColor}, ${fontStyle}, ${duration}, ${visibility}, ${expiresAt}::timestamptz
      )
      RETURNING *
    `;
    
    return this.mapStory(result[0]);
  }

  async getStories(userId: string, options: {
    circleId?: string;
    includeExpired?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<Story[]> {
    const { circleId, includeExpired = false, limit = 50, offset = 0 } = options;
    
    const conditions: Prisma.Sql[] = [
      Prisma.sql`s.is_archived = false`
    ];
    
    if (!includeExpired) {
      conditions.push(Prisma.sql`s.expires_at > NOW()`);
    }
    
    if (circleId) {
      conditions.push(Prisma.sql`s.circle_id = ${circleId}::uuid`);
    }
    
    const whereClause = Prisma.join(conditions, ' AND ');
    
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        s.*,
        u.id as author_id,
        u.username as author_username,
        u.display_name as author_display_name,
        u.avatar_url as author_avatar_url,
        u.is_verified as author_is_verified,
        sv.id IS NOT NULL as has_viewed,
        sr.reaction as my_reaction
      FROM bondarys.social_stories s
      JOIN core.users u ON s.author_id = u.id
      LEFT JOIN bondarys.social_story_views sv ON s.id = sv.story_id AND sv.viewer_id = ${userId}::uuid
      LEFT JOIN bondarys.social_story_reactions sr ON s.id = sr.story_id AND sr.user_id = ${userId}::uuid
      WHERE ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return result.map(row => this.mapStoryWithAuthor(row));
  }

  async getStoriesByUser(authorId: string, viewerId: string): Promise<Story[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        s.*,
        u.id as author_id,
        u.username as author_username,
        u.display_name as author_display_name,
        u.avatar_url as author_avatar_url,
        u.is_verified as author_is_verified,
        sv.id IS NOT NULL as has_viewed,
        sr.reaction as my_reaction
      FROM bondarys.social_stories s
      JOIN core.users u ON s.author_id = u.id
      LEFT JOIN bondarys.social_story_views sv ON s.id = sv.story_id AND sv.viewer_id = ${viewerId}::uuid
      LEFT JOIN bondarys.social_story_reactions sr ON s.id = sr.story_id AND sr.user_id = ${viewerId}::uuid
      WHERE s.author_id = ${authorId}::uuid 
        AND s.expires_at > NOW()
        AND s.is_archived = false
      ORDER BY s.created_at ASC
    `;
    
    return result.map(row => this.mapStoryWithAuthor(row));
  }

  async getStoryById(storyId: string, viewerId: string): Promise<Story | null> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        s.*,
        u.id as author_id,
        u.username as author_username,
        u.display_name as author_display_name,
        u.avatar_url as author_avatar_url,
        u.is_verified as author_is_verified,
        sv.id IS NOT NULL as has_viewed,
        sr.reaction as my_reaction
      FROM bondarys.social_stories s
      JOIN core.users u ON s.author_id = u.id
      LEFT JOIN bondarys.social_story_views sv ON s.id = sv.story_id AND sv.viewer_id = ${viewerId}::uuid
      LEFT JOIN bondarys.social_story_reactions sr ON s.id = sr.story_id AND sr.user_id = ${viewerId}::uuid
      WHERE s.id = ${storyId}::uuid
    `;
    
    return result.length > 0 ? this.mapStoryWithAuthor(result[0]) : null;
  }

  async viewStory(storyId: string, viewerId: string): Promise<void> {
    await prisma.socialStoryView.upsert({
      where: {
        storyId_viewerId: {
          storyId,
          viewerId,
        },
      },
      create: {
        storyId,
        viewerId,
      },
      update: {},
    });
  }

  async getStoryViewers(storyId: string, limit = 50, offset = 0): Promise<any[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        u.id, u.username, u.display_name, u.avatar_url, u.is_verified,
        sv.viewed_at
      FROM bondarys.social_story_views sv
      JOIN core.users u ON sv.viewer_id = u.id
      WHERE sv.story_id = ${storyId}::uuid
      ORDER BY sv.viewed_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return result;
  }

  async reactToStory(storyId: string, userId: string, reaction: string): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO bondarys.social_story_reactions (story_id, user_id, reaction)
      VALUES (${storyId}::uuid, ${userId}::uuid, ${reaction})
      ON CONFLICT (story_id, user_id) 
      DO UPDATE SET reaction = ${reaction}
    `;
    
    // Update reactions count
    await prisma.$executeRaw`
      UPDATE bondarys.social_stories 
      SET reactions_count = (
        SELECT COUNT(*) FROM bondarys.social_story_reactions WHERE story_id = ${storyId}::uuid
      )
      WHERE id = ${storyId}::uuid
    `;
  }

  async removeStoryReaction(storyId: string, userId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM bondarys.social_story_reactions 
      WHERE story_id = ${storyId}::uuid AND user_id = ${userId}::uuid
    `;
    
    await prisma.$executeRaw`
      UPDATE bondarys.social_stories 
      SET reactions_count = GREATEST(reactions_count - 1, 0)
      WHERE id = ${storyId}::uuid
    `;
  }

  async deleteStory(storyId: string, userId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.social_stories 
      WHERE id = ${storyId}::uuid AND author_id = ${userId}::uuid
    `;
    
    return (result as number) > 0;
  }

  async archiveStory(storyId: string, userId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.social_stories 
      SET is_archived = true, updated_at = NOW()
      WHERE id = ${storyId}::uuid AND author_id = ${userId}::uuid
    `;
    
    return (result as number) > 0;
  }

  // Highlights
  async createHighlight(userId: string, title: string, coverImage?: string): Promise<any> {
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.social_story_highlights (user_id, title, cover_image)
      VALUES (${userId}::uuid, ${title}, ${coverImage})
      RETURNING *
    `;
    
    return result[0];
  }

  async getHighlights(userId: string): Promise<any[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT h.*, 
        (SELECT COUNT(*) FROM bondarys.social_story_highlight_items WHERE highlight_id = h.id) as story_count
      FROM bondarys.social_story_highlights h
      WHERE h.user_id = ${userId}::uuid
      ORDER BY h.created_at DESC
    `;
    
    return result;
  }

  async addStoryToHighlight(highlightId: string, storyId: string, userId: string): Promise<boolean> {
    // Verify ownership
    const ownership = await prisma.$queryRaw<any[]>`
      SELECT id FROM bondarys.social_story_highlights WHERE id = ${highlightId}::uuid AND user_id = ${userId}::uuid
    `;
    
    if (ownership.length === 0) return false;
    
    await prisma.$executeRaw`
      INSERT INTO bondarys.social_story_highlight_items (highlight_id, story_id)
      VALUES (${highlightId}::uuid, ${storyId}::uuid)
      ON CONFLICT (highlight_id, story_id) DO NOTHING
    `;
    
    return true;
  }

  async removeStoryFromHighlight(highlightId: string, storyId: string, userId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.social_story_highlight_items shi
      USING bondarys.social_story_highlights sh
      WHERE shi.highlight_id = sh.id 
        AND shi.highlight_id = ${highlightId}::uuid 
        AND shi.story_id = ${storyId}::uuid
        AND sh.user_id = ${userId}::uuid
    `;
    
    return (result as number) > 0;
  }

  async deleteHighlight(highlightId: string, userId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.social_story_highlights 
      WHERE id = ${highlightId}::uuid AND user_id = ${userId}::uuid
    `;
    
    return (result as number) > 0;
  }

  private mapStory(row: any): Story {
    return {
      id: row.id,
      authorId: row.author_id,
      circleId: row.circle_id,
      content: row.content,
      mediaUrl: row.media_url,
      mediaType: row.media_type,
      backgroundColor: row.background_color,
      textColor: row.text_color,
      fontStyle: row.font_style,
      duration: row.duration,
      visibility: row.visibility,
      viewsCount: row.views_count,
      reactionsCount: row.reactions_count,
      isArchived: row.is_archived,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }

  private mapStoryWithAuthor(row: any): Story {
    const story = this.mapStory(row);
    story.author = {
      id: row.author_id,
      username: row.author_username,
      displayName: row.author_display_name,
      avatarUrl: row.author_avatar_url,
      isVerified: row.author_is_verified,
    };
    story.hasViewed = row.has_viewed;
    story.myReaction = row.my_reaction;
    return story;
  }
}

export const storiesService = new StoriesService();
export default storiesService;
