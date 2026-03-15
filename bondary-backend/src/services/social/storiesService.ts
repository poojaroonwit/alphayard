import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

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
    
    const story = await prisma.socialStory.create({
      data: {
        authorId,
        mediaUrl: mediaUrl || '',
        mediaType: mediaType || 'image',
        caption: content || null,
        backgroundColor: backgroundColor || null,
        expiresAt
      }
    });
    
    return this.mapStory(story);
  }

  async getStories(userId: string, options: {
    circleId?: string;
    includeExpired?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<Story[]> {
    const { circleId, includeExpired = false, limit = 50, offset = 0 } = options;
    
    const whereCondition: any = {
      isArchived: false
    };
    
    if (!includeExpired) {
      whereCondition.expiresAt = { gt: new Date() };
    }
    
    if (circleId) {
      whereCondition.circleId = circleId;
    }
    
    const stories = await prisma.socialStory.findMany({
      where: whereCondition,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true
          }
        },
        views: {
          where: { viewerId: userId },
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
    
    return stories.map((row: any) => this.mapStoryWithAuthor(row));
  }

  async getStoriesByUser(authorId: string, viewerId: string): Promise<Story[]> {
    const stories = await prisma.socialStory.findMany({
      where: {
        authorId: authorId,
        expiresAt: { gt: new Date() }
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true
          }
        },
        views: {
          where: { viewerId: viewerId },
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    return stories.map((row: any) => this.mapStoryWithAuthor(row));
  }

  async getStoryById(storyId: string, viewerId: string): Promise<Story | null> {
    const story = await prisma.socialStory.findUnique({
      where: { id: storyId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true
          }
        },
        views: {
          where: { viewerId: viewerId },
          select: { id: true }
        }
      }
    });
    
    return story ? this.mapStoryWithAuthor(story) : null;
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
    const views = await prisma.socialStoryView.findMany({
      where: { storyId: storyId },
      include: {
        viewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isVerified: true
          }
        }
      },
      orderBy: { viewedAt: 'desc' },
      take: limit,
      skip: offset
    });
    
    return views.map((view: any) => ({
      id: view.viewer.id,
      username: view.viewer.firstName && view.viewer.lastName ? 
        `${view.viewer.firstName} ${view.viewer.lastName}`.toLowerCase().replace(/\s+/g, '') : '',
      display_name: view.viewer.firstName && view.viewer.lastName ? 
        `${view.viewer.firstName} ${view.viewer.lastName}` : '',
      avatar_url: view.viewer.avatarUrl,
      is_verified: view.viewer.isVerified,
      viewed_at: view.viewedAt
    }));
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
